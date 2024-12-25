// Driver.controller: Module file for the Driver.controller functionality.

import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import { DriverService } from "./Driver.service";
import { NextFunction, Request, Response } from "express";

const createDriver = async (req: Request, res: Response, next: NextFunction) => {
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


export const DriverController = {
    createDriver,
}