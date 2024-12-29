// Payment.controller: Module file for the Payment.controller functionality.

import { Request, Response } from "express";
import { paymentService } from "./Payment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";


const saveCard = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = req.user.id; 
    const result = await paymentService.saveCardWithCustomerInfoIntoStripe(payload, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Card saved successfully",
        data: result
    });
})

const authorizePayment = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await paymentService.authorizedPaymentWithSaveCardFromStripe(payload);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment authorized successfully",
        data: result
    });
})

const capturePayment = catchAsync(async (req: Request, res: Response) => {
    const {paymentIntentId} = req.body;
    const result = await paymentService.capturePaymentRequestToStripe(paymentIntentId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment captured successfully",
        data: result
    });
})

const getCustomerSavedCards = catchAsync(async (req: Request, res: Response) => {
    const {stripeCustomerId} = req.params;
    const result = await paymentService.getCustomerSavedCardsFromStripe(stripeCustomerId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All saved cards fetched successfully",
        data: result
    });
})

const refundPayment = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await paymentService.refundPaymentToCustomer(payload);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment refunded successfully",
        data: result
    });
})





export const PaymentController = {
    saveCard,
    authorizePayment,
    capturePayment,
    getCustomerSavedCards,
    refundPayment
}