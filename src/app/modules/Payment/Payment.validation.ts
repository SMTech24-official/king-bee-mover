// Payment.validation: Module file for the Payment.validation functionality.

import { z } from "zod";

const saveCard = z.object({
    body: z.object({
        name: z.string(),
        email: z.string(),
        paymentMethodId: z.string(),
        amount: z.number(),
        address: z.object({
            city: z.string(),
            postal_code: z.string(),
            country: z.string()
        })
    })
})

const authorizePayment = z.object({
    body: z.object({
        amount: z.number(),
        customerId: z.string(),
        stripeCustomerId: z.string(),
        paymentMethodId: z.string(),
        tripId: z.string(),
        driverId: z.string()
    })
})

const capturePayment = z.object({
    body: z.object({ 
        paymentIntentId: z.string(),
    })
})
 
const refundPayment = z.object({
    body: z.object({ 
        paymentIntentId: z.string(),
        tripId: z.string(), 
    })
})

export const PaymentValidation = {
    saveCard,
    authorizePayment,
    capturePayment, 
    refundPayment   
}