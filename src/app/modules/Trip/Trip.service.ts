import { DriverTripApplicationStatus, Prisma, Trip, TripStatus, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { ITripSearchFields } from "./Trip.interface";
import { tripSearchableFields } from "./Trip.constant"; 
import { paymentService } from "../Payment/Payment.service";
import { stripe } from "../../../shared/stripe";

const createTrip = async (payload: Trip) => {

    const isCustomerExist = await prisma.customer.findUnique({
        where: { id: payload.customerId }
    })

    const isTruckExist = await prisma.truck.findUnique({
        where: { id: payload.truckId }
    })

    if (!isCustomerExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Update your profile information first to create trips");
    }

    if (!isTruckExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Truck not found with the truck id");
    }

    const trip = await prisma.trip.create({
        data: payload
    });

    return trip;
}

const getAllTrip = async (options: IPaginationOptions, params: ITripSearchFields) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andCondions: Prisma.TripWhereInput[] = [];

    if (searchTerm) {
        andCondions.push({
            OR: tripSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive"
                },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andCondions.push({
            AND: Object.keys(filterData).map((key) => {
                if (key === "tags") {
                    return {
                        tags: {
                            has: (filterData as any)[key],
                        },
                    };
                } else {
                    if(key === "driverId"){
                        return {
                            driver: {
                                id: (filterData as any)[key]
                            }
                        }
                    }
                    return {
                        [key]: { equals: (filterData as any)[key] },
                    };
                }
            }),
        });
    }

    const whereConditons: Prisma.TripWhereInput = andCondions.length > 0 ? { AND: andCondions } : {};

    const result = await prisma.trip.findMany({
        where: whereConditons,
        skip,
        take: limit,
        orderBy:
            sortBy && sortOrder
                ? {
                    [sortBy]: sortOrder,
                }
                : {
                    createdAt: "desc",
                },
    });

    const total = await prisma.trip.count({
        where: whereConditons
    });

    if (!result || result.length === 0) {
        throw new ApiError(404, "No trips found");
    }

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    }
}

const getTrip = async (id: string) => {

    const isTripExist = await prisma.trip.findUnique({
        where: { id }
    });

    if (!isTripExist) {
        throw new ApiError(404, "Trip not found");
    }

    const trip = await prisma.trip.findUnique({
        where: { id },
        include: {
            driverTripApplications: true
        }
    });
    return trip;
}

const updateTrip = async (id: string, payload: Partial<Trip>) => {
    const isTripExist = await prisma.trip.findUnique({
        where: { id }
    });
    if (!isTripExist) {
        throw new ApiError(404, "Trip not found");
    }

    // bulk update the trip status and the driver trip application status
    if (payload.tripStatus === TripStatus.Confirmed
        || payload.tripStatus === TripStatus.Cancelled
        || payload.tripStatus === TripStatus.Completed) {

        const res = await prisma.$transaction(async (tx) => {
           
            const trip = await tx.trip.update({
                where: { id },
                data: payload
            });

            await tx.driverTripApplication.update({
                where: {
                    tripId_driverId: {
                        tripId: isTripExist.id,
                        driverId: isTripExist.assignedDriverId ?? ""
                    }
                },
                data: {
                    status: payload.tripStatus == TripStatus.Cancelled ?
                        DriverTripApplicationStatus.Cancelled : payload.tripStatus == TripStatus.Completed ?
                            DriverTripApplicationStatus.Completed : DriverTripApplicationStatus.Confirmed
                }
            })
            
            return trip;
        })

        return res;
    }

    const trip = await prisma.trip.update({
        where: { id },
        data: payload
    });

    return trip;
}

const cancelTrip = async (id: string, role: UserRole) => {
    const isTripExist = await prisma.trip.findUnique({ 
        where: { id },
        include: {
            customer: true
        }
    });

    if (!isTripExist) {
        throw new ApiError(404, "Trip not found");
    }

    // check if the trip is confirmed and the user is customer then charge 20% of the total cost
    if (role === UserRole.Customer && isTripExist.tripStatus == TripStatus.Confirmed) {

        const stripeCustomerId = isTripExist.customer.stripeCustomerId ?? ""; 
        const amount = isTripExist.totalCost * 0.2;

        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                payments: {
                    select: {
                     paymentIntentId: true,
                     stripePaymentMethodId: true
                    }
                }
            }
        })

        await paymentService.refundPaymentToCustomer({
            paymentIntentId: trip?.payments[0]?.paymentIntentId ?? ""
        })

        const paymentIntent =  await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: "usd",
            customer: stripeCustomerId,
            payment_method: trip?.payments[0]?.stripePaymentMethodId ?? "",
            off_session: true,
            confirm: true,
            capture_method: "manual",
        })
 
        // const paymentIntent = await paymentService.authorizedPaymentWithSaveCardFromStripe({
        //     tripId: isTripExist.id,
        //     amount: isTripExist.totalCost * 0.2,
        //     customerId: isTripExist.customerId,
        //     paymentMethodId:paymentMethodId,
        //     stripeCustomerId: isTripExist.customer.stripeCustomerId ?? "",
        //     driverId: isTripExist.assignedDriverId ?? ""
        // });
        
        // const res = await paymentService.capturePaymentRequestToStripe(paymentIntent.id);
 
        throw new ApiError(403, "You have to pay 20% of the total cost to cancel the trip");
    }

    const trip = await prisma.trip.delete({
        where: { id }
    });
    return trip;
}

export const TripService = {
    createTrip,
    getAllTrip,
    getTrip,
    updateTrip,
    cancelTrip,
}