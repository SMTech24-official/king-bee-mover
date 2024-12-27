import { Driver, Prisma, UserAccountStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { fileUploader } from "../../../helpars/fileUploader";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IDriverSearchFields } from "./Driver.interface";

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

    const driver = await prisma.driver.create({
        data: data,
    });
    return driver;
}

const getAllDriver = async (options: IPaginationOptions, params:IDriverSearchFields ) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andCondions: Prisma.DriverWhereInput[] = [];

    if(searchTerm){
        andCondions.push({
            OR: ["name"].map((field) => ({
                [field]: { contains: searchTerm, mode: "insensitive" },
            })),
        });
    }

    if(Object.keys(filterData).length > 0){
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

    if(!isDriverExist){
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

    if(!isDriverExist){
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

    if(!isDriverExist){
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
    
    for (const file of values) { 
        const { Location } = await fileUploader.uploadToDigitalOcean(file[0]);
        payload[file[0].fieldname] = Location;
    }

    const driver =  await prisma.driver.update({
        where: { id },
        data: {
            ...payload, 
            accountStatus: UserAccountStatus.Processing,
        },
    });
    return driver;   
}

export const DriverService = {
    createDriver,
    updateDriver,
    deleteDriver,
    getDriver,
    getAllDriver,
    verifyDriver,
}
