// Trip.service: Module file for the Trip.service functionality.

import { Prisma, Trip } from "@prisma/client";
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
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
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
                if(key === "tags"){
                    return {
                        tags: {
                            has: (filterData as any)[key],
                        },
                    };
                }else{
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
            options.sortBy && options.sortOrder
                ? {
                    [options.sortBy]: options.sortOrder,
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
    const trip = await prisma.trip.findUnique({
        where: { id }
    });
    return trip;
}

const updateTrip = async (id: string, payload: Trip) => {
    const trip = await prisma.trip.update({
        where: { id },
        data: payload
    });
    return trip;
}

const deleteTrip = async (id: string) => {
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