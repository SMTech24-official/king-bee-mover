import { DriverTripApplicationStatus } from "@prisma/client";
import { z } from "zod";

const createDriverTripApplicationValidation = z.object({
    body: z.object({
        tripId: z.string({
            required_error: "Trip id is required"
        }),
        driverId: z.string({
            required_error: "Driver id is required"
        }),
    })
});


const assignDriverToTripValidation = z.object({
    body: z.object({
        tripId: z.string({
            required_error: "Trip id is required"
        }),
        status: z.enum([...Object.values(DriverTripApplicationStatus)] as [string, ...string[]])
    })
});


export const DriverTripApplicationValidation = {
    createDriverTripApplicationValidation,
    assignDriverToTripValidation
}