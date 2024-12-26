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

export const DriverTripApplicationValidation = {
    createDriverTripApplicationValidation
}