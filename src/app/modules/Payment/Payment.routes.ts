import { Router } from "express";
import { PaymentController } from "./Payment.controller";
import { PaymentValidation } from "./Payment.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
const router = Router();

router.post("/save-card", 
    auth(UserRole.Customer, UserRole.Driver, UserRole.Admin),
    validateRequest(PaymentValidation.saveCard), 
    PaymentController.saveCard
);

router.post("/authorize-payment", 
    // auth(UserRole.Customer, UserRole.Driver, UserRole.Admin),
    validateRequest(PaymentValidation.authorizePayment), 
    PaymentController.authorizePayment
); 

router.post("/capture-payment", 
    // auth(UserRole.Customer, UserRole.Driver, UserRole.Admin),
    validateRequest(PaymentValidation.capturePayment), 
    PaymentController.capturePayment
);

router.get("/get-customer-saved-cards/:stripeCustomerId",
    // auth(UserRole.Customer, UserRole.Driver, UserRole.Admin),
    PaymentController.getCustomerSavedCards
);

router.post("/refund-payment", 
    // auth(UserRole.Customer, UserRole.Driver, UserRole.Admin),
    validateRequest(PaymentValidation.refundPayment), 
    PaymentController.refundPayment
);

export const paymentRoutes = router;