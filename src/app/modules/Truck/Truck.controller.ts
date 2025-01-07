// Truck.controller: Module file for the Truck.controller functionality.
import { NextFunction, Request, Response } from "express";
import prisma from "../../../shared/prisma";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { TruckService } from "./Truck.service";
import pick from "../../../shared/pick";
import { truckFilterableFields } from "./Truck.constant";
import catchAsync from "../../../shared/catchAsync";

const AddTruck = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    if (!req.file) {
        throw new Error('File is required');
    }

    const result = await TruckService.AddTruck(req.body, req.file);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Truck Added successfully',
        data: result,
    });
});

// get all trucks
const GetAllTrucks = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, truckFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])

    const result = await TruckService.getTrucksFromDb(filters, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All trucks fetched successfully',
        data: result,
    });
});

// get truck by id
const GetTruckById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TruckService.GetTruckById(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Truck fetched successfully',
        data: result,
    });
});

// update truck
const UpdateTruck = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const truckData = req.body;
    const result = await TruckService.UpdateTruck(id, truckData);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Truck updated successfully',
        data: result,
    });
});

const DeleteTruck = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await TruckService.DeleteTruck(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Truck deleted successfully',
        data:null
    });
})  ;

export const TruckController = {
    AddTruck,
    GetAllTrucks,
    GetTruckById,
    UpdateTruck,
    DeleteTruck,
};
