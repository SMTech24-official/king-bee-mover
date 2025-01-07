import { Driver, Prisma, UserAccountStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { fileUploader } from "../../../helpars/fileUploader";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IDriverSearchFields } from "./Driver.interface";
import { stripe } from "../../../shared/stripe";
import config from "../../../config";

const createDriver = async (data: Driver, file: Express.Multer.File) => {
    const doesUserExist = await prisma.user.findUnique({
        where: {
            id: data.userId,
        },
    });

    if (!doesUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const isDriverExist = await prisma.driver.findUnique({
        where: {
            userId: data.userId,
        },
    });

    if (isDriverExist) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Driver account already created with this userid");
    }

    const { Location } = await fileUploader.uploadToDigitalOcean(file);
    data.profileImage = Location;

    try {
        // Create a Stripe Connect account
        const stripeAccount = await stripe.accounts.create({
            type: 'express', // Use 'express' for faster onboarding with Stripe Express accounts
            country: 'US', // Replace with the appropriate country code
            email: doesUserExist.email,
            metadata: {
                userId: doesUserExist.id,
            },
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });

        // Generate the onboarding link for the Stripe Express account
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccount.id,
            refresh_url: `${config.frontend_base_url}/reauthenticate`, // Replace with your frontend URL for reauthentication
            return_url: `${config.frontend_base_url}/onboarding-success`, // Replace with your frontend success URL
            type: 'account_onboarding',
        });
        const stripeAccountId = stripeAccount.id;
        data.stripeAccountId = stripeAccountId;
        data.stripeAccountLink = accountLink.url;

    } catch (err) {
        console.error('Stripe Error:', err); // Log the error for debugging
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create Stripe account");
    }

    const driver = await prisma.driver.create({
        data: data,
    });

    return driver;
}

const getAllDriver = async (options: IPaginationOptions, params: IDriverSearchFields) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andCondions: Prisma.DriverWhereInput[] = [];
 

    if (searchTerm) {
        andCondions.push({
            OR: ["name"].map((field) => ({
                [field]: { contains: searchTerm, mode: "insensitive" },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andCondions.push({
            AND: Object.keys(filterData).map((key) => ({
                [key]: { equals: (filterData as any)[key] },
            })),
        });
    }

    const whereConditons: Prisma.DriverWhereInput = { AND: andCondions };

    const result = await prisma.driver.findMany({
        where: whereConditons,
        skip,
        take: limit,
        orderBy:
            options.sortBy && options.sortOrder
                ? {
                    [options.sortBy]: options.sortOrder,
                }
                : {
                    createdAt: "desc",
                },
    });

    // get total count of drivers
    const total = await prisma.driver.count({
        where: whereConditons,
    });

    if (!result || result.length === 0) {
        throw new ApiError(404, "No drivers found");
    }

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result,
    };
}

const updateDriver = async (id: string, data: Partial<Omit<Driver, "userId" | "id">>) => {

    const isDriverExist = await prisma.driver.findUnique({
        where: { id },
    });

    if (!isDriverExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
    }

    const driver = await prisma.driver.update({
        where: { id },
        data,
    });
    return driver;
}

const deleteDriver = async (id: string) => {
    const isDriverExist = await prisma.driver.findUnique({
        where: {
            id: id,
        },
    });

    if (!isDriverExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
    }

    // delete from driver and user table
    await prisma.$transaction(async (tx) => {
        // delete driver
        await tx.driver.delete({
            where: { id },
        });

        // delete user
        await tx.user.delete({
            where: { id: isDriverExist.userId },
        });
    });
}

const getDriver = async (id: string) => {
    const isDriverExist = await prisma.driver.findUnique({
        where: { id },
        include: {
            driverTripApplications: true,
            trips: true
        }
    });

    if (!isDriverExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
    }

    const driver = await prisma.driver.findUnique({
        where: { id },
        include: {
            driverTripApplications: true
        }
    });

    return driver;
}

const verifyDriver = async (id: string, files: Express.Multer.File[]) => {

    const payload: Record<string, string | boolean> = {};
    const values: Array<Express.Multer.File[]> = Object.values(files) as unknown as Array<Express.Multer.File[]>;
    const requiredFields = ["nationalIdFront", "nationalIdBack", "licenseFront", "licenseBack"];

    // check if all required fields are uploaded
    for (const file of values) {
        if (!requiredFields.includes(file[0].fieldname)) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Please upload all required fields");
        }

        const { Location } = await fileUploader.uploadToDigitalOcean(file[0]);
        payload[file[0].fieldname] = Location;
    }

    const driver = await prisma.driver.update({
        where: { id },
        data: {
            ...payload,
            accountStatus: UserAccountStatus.Processing,
        },
    });
    return driver;
}

const getDriverAccountFinance = async (stripeAccountId: string) => {
    try {
        // Retrieve balance for the connected account
        const balance = await stripe.balance.retrieve({
            stripeAccount: stripeAccountId,
        });

        // Calculate available and pending amounts
        const available = balance.available.reduce((sum, entry) => sum + entry.amount, 0) / 100; // Convert cents to dollars
        const pending = balance.pending.reduce((sum, entry) => sum + entry.amount, 0) / 100; // Convert cents to dollars

        // Assuming wallet payments (payments completed but not withdrawn) are the available balance
        const walletPayments = available;

        // Total earnings would typically be the sum of available, pending, and payouts already made
        const totalEarnings = available + pending;

        return { totalEarnings, awaitingPayments: pending, walletPayments };
    } catch (error) {
        console.error('Error retrieving account financials:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error retrieving account financials');
    }
}

const regenerateOnboardingLink = async (stripeAccountId:string) => {
    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${config.frontend_base_url}/reauthenticate`,
        return_url: `${config.frontend_base_url}/onboarding-success`,
        type: 'account_onboarding',
    });

    console.log('Account Onboarding Link:', accountLink.url);
    return accountLink.url;
};

export const DriverService = {
    createDriver,
    updateDriver,
    deleteDriver,
    getDriver,
    getAllDriver,
    verifyDriver,
    getDriverAccountFinance, 
    regenerateOnboardingLink
}