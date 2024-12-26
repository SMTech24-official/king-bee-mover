// DriverTripApplication.controller: Module file for the DriverTripApplication.controller functionality.

import { Request, Response } from "express";
import { DriverTripApplicationService } from "./DriverTripApplication.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import pick from "../../../shared/pick";

const createDriverTripApplication = catchAsync(async (req: Request, res: Response) => {
    const driverTripApplicationData = req.body || {};
    const result = await DriverTripApplicationService.createDriverTripApplication(driverTripApplicationData);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Successfully applied for the trip",
        data: result,
    });
})

const getAllDriverTripApplication = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ["tripId", "driverId"]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
    const result = await DriverTripApplicationService.getAllDriverTripApplication(options, filters);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All driver trip applications fetched successfully",
        data: result,
    });
})

const getDriverTripApplication = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DriverTripApplicationService.getSingleDriverTripApplication(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Driver trip application fetched successfully",
        data: result,
    });
})

const assignDriverToTrip = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body || {};
    const result = await DriverTripApplicationService.assignDriverToTrip(id, payload);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Driver trip application updated successfully",
        data: result,
    });
})

const deleteDriverTripApplication = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DriverTripApplicationService.deleteDriverTripApplication(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Driver trip application deleted successfully",
        data: result,
    });
})


export const DriverTripApplicationController = {
    createDriverTripApplication,
    getAllDriverTripApplication,
    getDriverTripApplication,
    assignDriverToTrip,
    deleteDriverTripApplication
}