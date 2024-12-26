// Trip.validation: Module file for the Trip.validation functionality.

import { PaymentMethodType, TripStatus } from "@prisma/client";
import { z } from "zod";

const createTripValidationSchema = z.object({
    body: z.object({
        loadLocation: z.string({
            required_error: "Load location is required"
        }),

        unloadLocation: z.string({
            required_error: "Unload location is required"
        }),

        customerId: z.string({
            required_error: "Customer id is required"
        }),
        truckId: z.string({
            required_error: "Truck id is required"
        }),

        date: z.string({
            required_error: "Date is required"
        }).transform((date) => new Date(date)),

        time: z.string({
            required_error: "Time is required"
        }),
        productType: z.string({
            required_error: "Product type is required"
        }),
        productDetails: z.string().optional(),

        paymentMethodType: z.enum([PaymentMethodType.Online, PaymentMethodType.Offline] as [string, ...string[]]),

        totalCost: z.number({
            required_error: "Total cost is required"
        }),

        distance: z.number({
            required_error: "Distance is required"
        }),

        weight: z.number({
            required_error: "Weight is required"
        }),
        tags: z.array(z.string()).nonempty({ message: "At least one tag is required" }),
    })
});


const updateTripValidationSchema = z.object({
    body: z.object({
        loadLocation: z.string().optional(),
        unloadLocation: z.string().optional(),
        customerId: z.string().optional(),
        truckId: z.string().optional(),
        date: z.string().optional().transform((date) => date ? new Date(date) : undefined),
        time: z.string().optional(),
        productType: z.string().optional(),
        productDetails: z.string().optional(),
        paymentMethodType: z.enum([PaymentMethodType.Online, PaymentMethodType.Offline] as const).optional(),
        tripStatus: z.enum([TripStatus.Completed, TripStatus.Pending, TripStatus.Published, TripStatus.Cancelled, TripStatus.Confirmed] as const).optional(),   
        totalCost: z.number().optional(),
        distance: z.number().optional(),
        weight: z.number().optional(),
        tags: z.array(z.string()).nonempty({ message: "At least one tag is required" }).optional(),
        cancellationReason: z.string().optional(),
    }).strict({
        message: "Invalid request body",
    }),
});

export const TripValidation = {
    createTripValidationSchema,
    updateTripValidationSchema
};