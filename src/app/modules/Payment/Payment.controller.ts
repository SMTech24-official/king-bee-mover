import { Request, Response } from "express";
import { paymentService } from "./Payment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import pick from "../../../shared/pick";

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
    const payload = req.body;
    const result = await paymentService.capturePaymentRequestToStripe(payload);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment captured successfully",
        data: result
    });
})

const getCustomerSavedCards = catchAsync(async (req: Request, res: Response) => {
    const { stripeCustomerId } = req.params;
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

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ["status", "startDate", "endDate"]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']) 
    
    const result = await paymentService.getAllPayments(options, filters as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All payments fetched successfully",
        data: result
    });
})

const getPayment = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await paymentService.getPayment(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment fetched successfully",
        data: result
    });
})

const paymentSummary =  catchAsync(async (req: Request, res: Response) => {     
    const result = await paymentService.paymentSummary();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment summary fetched successfully",
        data: result
    });
})

const lastNMonthPayment = catchAsync(async (req: Request, res: Response) => {
    const {n} = req.query ;
    const result = await paymentService.lastNMonthPayment(+(n as string));
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Last N month payment fetched successfully",
        data: result
    });
})




export const PaymentController = {
    saveCard,
    authorizePayment,
    capturePayment,
    getCustomerSavedCards,
    refundPayment, 
    getAllPayments, 
    getPayment, 
    paymentSummary, 
    lastNMonthPayment
}