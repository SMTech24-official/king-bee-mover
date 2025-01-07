// Customer.controller: Module file for the Customer.controller functionality.
import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import { CustomerService } from "./Customer.service";
import pick from "../../../shared/pick";
import catchAsync from "../../../shared/catchAsync";


// create a customer  
const createCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const file = (req.file || {}) as Express.Multer.File;
  const result = await CustomerService.createCustomer(req.body, file as Express.Multer.File);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Customer created successfully',
    data: result,
  });    
});

// get all customers
const getAllCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])

  const result = await CustomerService.getAllCustomer(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All customers fetched successfully',
    data: result,
  });
});

// get a customer
const getCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const result = await CustomerService.getCustomer(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer fetched successfully',
    data: result,
  });
});

// update a customer
const updateCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const customerData = req.body;
  const result = await CustomerService.updateCustomer(id, customerData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer updated successfully',
    data: result,
  });
});

// delete a customer
const deleteCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  await CustomerService.deleteCustomer(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer deleted successfully',
    data: null,
  });
});


export const CustomerController = {
  createCustomer,
  getAllCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};