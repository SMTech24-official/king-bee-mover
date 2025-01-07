import { UserAccountStatus, UserCreatedBy, UserRole } from "@prisma/client";
import { z } from "zod";


const RegisterUserValidationSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" }),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
});

const UserLoginValidationSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
});

const UserUpdateValidationSchema = z.object({
  role: z.enum([UserRole.Admin, UserRole.Customer, UserRole.Driver]).optional(),
  phoneNumber: z.string().optional(),
  accountStatus: z.enum([UserAccountStatus.Pending, UserAccountStatus.Processing, UserAccountStatus.Verified]).optional(),
  createdBy: z.enum([UserCreatedBy.Manual, UserCreatedBy.Social]).optional(),
});

export const UserValidation = {
  RegisterUserValidationSchema,
  UserLoginValidationSchema,
  UserUpdateValidationSchema,
};

