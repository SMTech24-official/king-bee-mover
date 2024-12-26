// Driver.validation: Module file for the Driver.validation functionality.
import { UserAccountStatus } from "@prisma/client";
import { z } from "zod";

const createDriverSchema = z.object({
    userId: z.string({
        required_error: 'userId is required',
    }),
    name: z.string({
        required_error: 'name is required',
    }),
});

const updateDriverSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        profileImage: z.string().optional(),
        nationalIdFront: z.string().optional(),
        nationalIdBack: z.string().optional(),
        licenseFront: z.string().optional(),
        licenseBack: z.string().optional(),
        insurance: z.boolean().optional(),
        insuranceFront: z.string().optional(),
        insuranceBack: z.string().optional(),
        accountStatus: z.enum([UserAccountStatus.Pending, UserAccountStatus.Processing, UserAccountStatus.Verified]).optional(),
    })
}).strict({
    message: "Invalid request body",
});

export const DriverValidation = {
    createDriverSchema,
    updateDriverSchema,
}