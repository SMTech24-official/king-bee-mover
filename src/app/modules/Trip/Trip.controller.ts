import { TripService } from "./Trip.service";
import catchAsync from "../../../shared/catchAsync";
import { NextFunction, Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import pick from "../../../shared/pick";
import { tripFilterableFields } from "./Trip.constant";

const createTrip = catchAsync(async (req:Request, res:Response, next:NextFunction) => { 
    const tripData = req.body;
    const result = await TripService.createTrip(tripData);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Trip created successfully',
        data: result,
    });
});

const getAllTrip = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
    const filters = pick(req.query, tripFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])

    const trips = await TripService.getAllTrip(options, filters);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All Trips fetched successfully',
        data: trips,
    });
});

const getTrip = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
    const {id} = req.params;
    const trip = await TripService.getTrip(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Trip fetched successfully',
        data: trip,
    });
});

const updateTrip = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
    const {id} = req.params;
    const tripData = req.body;
    const result = await TripService.updateTrip(id, tripData);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Trip updated successfully',
        data: result,
    });
});

const deleteTrip = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
    const {id} = req.params;
    await TripService.deleteTrip(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Trip deleted successfully',
        data: null,
    });
});

export const TripController = {
    createTrip,
    getAllTrip,
    getTrip,
    updateTrip,
    deleteTrip,
}