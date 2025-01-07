import { Router } from "express";
import { PaymentController } from "./Payment.controller";
import { PaymentValidation } from "./Payment.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
const router = Router();

router.get("/",
    auth(UserRole.Admin), 
    PaymentController.getAllPayments
);

router.get("/summary", 
    auth(UserRole.Admin),
    PaymentController.paymentSummary
)

router.get("/last-n-months", 
    auth(UserRole.Admin),   
    PaymentController.lastNMonthPayment
)


router.get("/:id", 
    auth(UserRole.Admin),    
    PaymentController.getPayment
);

router.post("/save-card", 
    auth(),
    validateRequest(PaymentValidation.saveCard), 
    PaymentController.saveCard
);

router.post("/authorize-payment", 
    auth(UserRole.Customer),
    validateRequest(PaymentValidation.authorizePayment), 
    PaymentController.authorizePayment
); 

router.post("/capture-payment", 
    auth(),
    validateRequest(PaymentValidation.capturePayment), 
    PaymentController.capturePayment
);

router.get("/get-customer-saved-cards/:stripeCustomerId",
    auth(),
    PaymentController.getCustomerSavedCards
);

router.post("/refund-payment", 
    auth(),
    validateRequest(PaymentValidation.refundPayment), 
    PaymentController.refundPayment
);

export const paymentRoutes = router;