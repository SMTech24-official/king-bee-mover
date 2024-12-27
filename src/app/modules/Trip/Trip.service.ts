import { DriverTripApplicationStatus, Prisma, Trip, TripStatus, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { ITripSearchFields } from "./Trip.interface";
import { tripSearchableFields } from "./Trip.constant";

const createTrip = async (payload: Trip) => {

    const isCustomerExist = await prisma.customer.findUnique({
        where: { id: payload.customerId }
    })

    if (!isCustomerExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Update your profile information first to create trips");
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

const deleteTrip = async (id: string, role: UserRole) => {
    const isTripExist = await prisma.trip.findUnique({
        where: { id }
    });

    if (!isTripExist) {
        throw new ApiError(404, "Trip not found");
    }

    // check if the trip is confirmed and the user is customer then charge 20% of the total cost
    if (role === UserRole.Customer && isTripExist.tripStatus == TripStatus.Confirmed) {
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
    deleteTrip,
}