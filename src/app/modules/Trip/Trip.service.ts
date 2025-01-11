import { DriverTripApplicationStatus, PaymentStatus, Prisma, Trip, TripStatus, UserRole } from "@prisma/client";
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

    if(!isCustomerExist.stripeCustomerId){
        throw new ApiError(httpStatus.BAD_REQUEST, "add payment card first to create trip");
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
                    if (key === "driverId") {
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
            driverTripApplications: true, 
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

const cancelTrip = async (id: string, role: UserRole, cancelReason?: string) => {
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
        const payment = await prisma.payment.findUnique({
            where: { tripId: isTripExist.id },
            select: {
                paymentIntentId: true
            }
        })

        if (!payment) {
            throw new ApiError(404, "Payment not found");
        }

        // const penaltyAmount = isTripExist.totalCost * 0.2 * 100; // 20% in cents
        const refundAmount = isTripExist.totalCost * 0.8 * 100; // 80% refund in cents 

        // Cancel the payment and refund 80%
        if (payment.paymentIntentId) {
            // await stripe.paymentIntents.cancel(payment.paymentIntentId); // maybe no need to cancel
            await stripe.paymentIntents.capture(payment.paymentIntentId);

            await stripe.refunds.create({
                payment_intent: payment.paymentIntentId,
                amount: refundAmount,
                reason: "requested_by_customer"
            });

            // update the payment status on local database
            await prisma.payment.update({
                where:{paymentIntentId: payment?.paymentIntentId},
                data: {
                    status: PaymentStatus.Cancelled
                }
            })
        }

        // update the trip status to cancelled
       await prisma.trip.update({
            where: { id },
            data: {
                tripStatus: TripStatus.Cancelled,
                cancellationReason: cancelReason || "Customer cancelled the trip"
            }
        });
    } 

    // update the driver trip application status to cancelled
    await prisma.driverTripApplication.update({
        where: { tripId_driverId: { tripId: isTripExist.id, driverId: isTripExist.assignedDriverId ?? "" } },
        data: { status: DriverTripApplicationStatus.Cancelled }
    })

    return isTripExist; 
}

const tripSummary =  async()=>{

    const totalTrips = await prisma.trip.count();
    const completedTrips = await prisma.trip.count({
        where: { tripStatus: TripStatus.Completed }
    });

    const cancelledTrips = await prisma.trip.count({
        where: { tripStatus: TripStatus.Cancelled }
    });

    const confirmedTrips = await prisma.trip.count({
        where: { tripStatus: TripStatus.Confirmed }
    });

    const pendingTrips = await prisma.trip.count({
        where: { tripStatus: TripStatus.Pending }
    });

    const assignedTrips = await prisma.trip.count({
        where: { tripStatus: TripStatus.Assigned }
    });

    return {
        totalTrips,
        completedTrips,
        cancelledTrips,
        confirmedTrips,
        pendingTrips,
        assignedTrips
    }
}

export const TripService = {
    createTrip,
    getAllTrip,
    getTrip,
    updateTrip,
    cancelTrip,
    tripSummary,
}