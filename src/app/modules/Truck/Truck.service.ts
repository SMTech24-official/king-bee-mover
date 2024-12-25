// Truck.service: Module file for the Truck.service functionality.
import prisma from "../../../shared/prisma";
import { Prisma, Truck } from "@prisma/client";
import { IUserFilterRequest } from "../User/user.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { truckSearchAbleFields } from "./Truck.constant";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";

const AddTruck = async (truckData: Truck, file: Express.Multer.File) => {
    const imageUrl = await fileUploader.uploadToDigitalOcean(file);
    const truck = await prisma.truck.create({
        data: {
            ...truckData,
            image: imageUrl.Location,
        },
    });
    return truck;
};

// get all trucks
const getTrucksFromDb = async (
    params: IUserFilterRequest,
    options: IPaginationOptions
) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andCondions: Prisma.TruckWhereInput[] = [];

    if (searchTerm) {
        andCondions.push({
            OR: truckSearchAbleFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andCondions.push({
            AND: Object.keys(filterData).map((key) => ({
                [key]: {
                    equals: (filterData as any)[key],
                },
            })),
        });
    }

    const whereConditons: Prisma.TruckWhereInput = { AND: andCondions };

    const result = await prisma.truck.findMany({
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
    const total = await prisma.truck.count({
        where: whereConditons,
    });

    if (!result || result.length === 0) {
        throw new ApiError(404, "No active trucks found");
    }

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result,
    };
};

const GetTruckById = async (id: string) => {
    const truck = await prisma.truck.findUnique({
        where: { id },
    });
    return truck;
};

const UpdateTruck = async (id: string, truckData: Truck) => {
    const truck = await prisma.truck.update({
        where: { id },
        data: truckData,
    });
    return truck;
};

const DeleteTruck = async (id: string) => {
    const truck = await prisma.truck.delete({
        where: { id },
    });
    return "Truck deleted successfully";
};

export const TruckService = {
    AddTruck,
    getTrucksFromDb,
    GetTruckById,
    UpdateTruck,
    DeleteTruck,
};