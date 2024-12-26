// Customer.validation: Module file for the Customer.validation functionality.
import { UserAccountStatus } from "@prisma/client";
import { z } from "zod";

const createCustomerSchema = z.object({
    name: z.string({
        required_error: 'name is required',
    }),
    userId: z.string({
        required_error: 'userId is required',
    }),
    companyName: z.string().optional(),
});


const updateCustomerSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        companyName: z.string().optional(),
        profileImage: z.string().optional(),
        accountStatus: z.enum([
            UserAccountStatus.Pending,
            UserAccountStatus.Processing,
            UserAccountStatus.Verified]).optional(),
    }).strict({
        message: "Invalid request body",
    })
});

export const CustomerValidation = {
    createCustomerSchema,
    updateCustomerSchema,
}
