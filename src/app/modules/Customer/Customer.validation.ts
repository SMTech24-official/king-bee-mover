// Customer.validation: Module file for the Customer.validation functionality.
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
    name: z.string().optional(),
    companyName: z.string().optional(),
    profileImage: z.string().optional(),
});

export const CustomerValidation = {
    createCustomerSchema,
    updateCustomerSchema,
}

// {
//     "name":"customer1", 
//     "companyName":"company1",
//     "userId":"af4e1e2d-71e8-4f3d-8ffc-8b83d58b5ef5", 
// }