
import { Prisma, DriverTripApplication, UserAccountStatus, TripStatus } from "@prisma/client";
import { DriverTripApplicationStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IDriverTripApplicationSearchFields } from "./DriverTripApplication.interface";
import { paginationHelper } from "../../../helpars/paginationHelper";
import httpStatus from "http-status";

const createDriverTripApplication = async (driverTripApplication: DriverTripApplication) => {
    const isExit = await prisma.driverTripApplication.findFirst({
        where: {
            tripId: driverTripApplication.tripId,
            driverId: driverTripApplication.driverId
        }
    });

    if (isExit) {
        throw new ApiError(httpStatus.CONFLICT, "Already applied for this trip");
    }

    const driver = await prisma.driver.findUnique({
        where: {
            id: driverTripApplication.driverId
        },
        select: {
            accountStatus: true
        }
    });

    if (driver?.accountStatus !== UserAccountStatus.Verified) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Driver account is not verified");
    }

    const newDriverTripApplication = await prisma.driverTripApplication.create({
        data: driverTripApplication
    });

    return newDriverTripApplication;
}

const getAllDriverTripApplication = async (options: IPaginationOptions, params: IDriverTripApplicationSearchFields) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

    const andCondions: Prisma.DriverTripApplicationWhereInput[] = [];

    if (Object.keys(params).length > 0) {
        andCondions.push({
            AND: Object.keys(params).map((key) => {
                return { [key]: { equals: (params as any)[key] } };
            }),
        });
    }

    const whereConditons: Prisma.DriverTripApplicationWhereInput = andCondions.length > 0 ? { AND: andCondions } : {};

    const result = await prisma.driverTripApplication.findMany({
        where: whereConditons,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
    });

    const total = await prisma.driverTripApplication.count({
        where: whereConditons
    });

    if (!result || result.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No trips found");
    }

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
}

const getSingleDriverTripApplication = async (id: string) => {
    const result = await prisma.driverTripApplication.findUnique({
        where: { id }
    });
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Driver trip application not found");
    }
    return result;
}

const assignDriverToTrip = async (id: string, payload: { tripId:string, status: DriverTripApplicationStatus }) => {
    const isExit = await prisma.driverTripApplication.findUnique({
        where: { id }
    });  
     
    if (!isExit) {
        throw new ApiError(httpStatus.NOT_FOUND, "Driver trip application not found");
    }

    const result = await prisma.$transaction(async (tsx) => {

        await tsx.driverTripApplication.updateMany({
            where: { tripId: payload.tripId },
            data: {
                status: DriverTripApplicationStatus.Rejected
            }
        });

        const res = await tsx.driverTripApplication.update({
            where: { id },
            data: {
                status: payload.status || DriverTripApplicationStatus.Assigned
            }
        });

        await tsx.trip.update({
            where: { id: payload.tripId },
            data: {
                tripStatus: TripStatus.Assigned,
                assignedDriverId: res.driverId
            }
        });

        return res;
    });
    return result;
}

const deleteDriverTripApplication = async (id: string) => {
    const isExit = await prisma.driverTripApplication.findUnique({
        where: { id }
    });
    if (!isExit) {
        throw new ApiError(httpStatus.NOT_FOUND, "application for this trip not found");
    }

     await prisma.driverTripApplication.delete({
        where: { id }
    });
}

export const DriverTripApplicationService = {
    createDriverTripApplication,
    getAllDriverTripApplication,
    getSingleDriverTripApplication,
    assignDriverToTrip,
    deleteDriverTripApplication
}