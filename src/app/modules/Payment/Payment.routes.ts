import { Router } from "express";
const router = Router();

router.post("/save-card", saveCard);

router.post("/authorize-payment", authorizePayment); 

router.post("/capture-payment", capturePayment);


export const paymentRoutes = router;