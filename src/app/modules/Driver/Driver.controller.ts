// Driver.controller: Module file for the Driver.controller functionality.

import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import { DriverService } from "./Driver.service";
import { NextFunction, Request, Response } from "express";
import pick from "../../../shared/pick";
import { driverFilterableFields } from "./Driver.constant";
import catchAsync from "../../../shared/catchAsync";

//create a driver
const createDriver = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const driverData = req.body || {};
        const file = (req.file || {}) as Express.Multer.File;
        const result = await DriverService.createDriver(driverData, file);
        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Driver created successfully',
            data: result,
        });
    }
)


// get all driver
const getAllDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query, driverFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])

    const result = await DriverService.getAllDriver(options, filters);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All drivers fetched successfully',
        data: result,
    });
});

// get a driver
const getDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await DriverService.getDriver(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Driver fetched successfully',
        data: result,
    });
});


// update a driver
const updateDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const driverData = req.body;
    const result = await DriverService.updateDriver(id, driverData);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Driver updated successfully',
        data: result,
    });
});

// delete a driver
const deleteDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await DriverService.deleteDriver(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Driver deleted successfully',
        data: null,
    });
});

// verify a driver
const verifyDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];
    const {id} = req.params;
    const result = await DriverService.verifyDriver(id, files);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Driver verified successfully',
        data: result,
    });
});



export const DriverController = {
    createDriver,
    getAllDriver,
    getDriver,
    updateDriver,
    deleteDriver,
    verifyDriver,
}