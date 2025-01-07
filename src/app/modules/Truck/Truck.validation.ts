// Truck.validation: Module file for the Truck.validation functionality.
import { z } from "zod";

const addTruckSchema = z.object({
    name: z.string({
        required_error: 'name is required',
    }),
    length: z.number({
        required_error: 'length is required',
    }),
    width: z.number({
        required_error: 'width is required',
    }),
    height: z.number({
        required_error: 'height is required',
    }),
    type: z.string({
        required_error: 'type is required',
    }),
    capacity: z.number({
        required_error: 'capacity is required',
    }),
});

const updateTruckSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'name is required',
        }).optional(),
        length: z.number({
            required_error: 'length is required',
        }).optional(),
        width: z.number({
            required_error: 'width is required',
        }).optional(),
        height: z.number({
            required_error: 'height is required',
        }).optional(),
        type: z.string().optional(),
        capacity: z.number().optional(),
    }).strict({
        message: "Invalid request body",
    })
})


export const TruckValidation = {
    addTruckSchema,
    updateTruckSchema,
};