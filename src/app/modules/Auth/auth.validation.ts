import { UserRole } from "@prisma/client";
import { z } from "zod";

// *!register user zod schema
const RegisterValidationSchema = z.object({
  email: z.string({
    required_error: "Email is required"
  }).email({
    message: "Invalid email address"
  }),
  password: z.string({
    required_error: "Password is required"
  }).min(8, {
    message: "Password must be at least 8 characters"
  }),
  phoneNumber: z.string({
    required_error: "Phone number is required"
  }).min(10, {
    message: "Phone number must be at least 10 characters"
  }),
  role: z.enum([UserRole.Customer, UserRole.Driver, UserRole.Admin] as [string, ...string[]]),
});

// *!login user zod schema
const LoginValidationSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
});

// *!send otp zod schema
const SendOtpValidationSchema = z.object({
  phoneNumber: z
    .string({required_error: "Phone number is required"})
    .min(10, {
    message: 'Phone number must be at least 10 characters',
  })
    .refine(value => /^\+?1?\d{10}$/g.test(value), {    // check USA phone number format
    message: 'Invalid USA phone number format',
  }),
});

// *!verify otp zod schema
const VerifyOtpValidationSchema = z.object({
  phoneNumber: z
  .string({required_error: "Phone number is required"})
  .min(10, {
    message: 'Phone number must be at least 10 characters',
  })
  .refine(value => /^\+?1?\d{10}$/g.test(value), {    // check USA phone number format
    message: 'Invalid USA phone number format',
  }),

  otp: z
  .string({required_error: "OTP is required"})
  .min(6, {
    message: 'OTP must be at least 6 characters',
  }),
});

// *!change password zod schema
const changePasswordValidationSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const authValidation = {
  RegisterValidationSchema,
  LoginValidationSchema,
  SendOtpValidationSchema,
  VerifyOtpValidationSchema,
  changePasswordValidationSchema,
}
