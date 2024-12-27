import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { UserValidation } from "../User/user.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { authValidation } from "./auth.validation";

const router = express.Router();

// user login route
router.post(
  "/login",
  validateRequest(authValidation.LoginValidationSchema),
  AuthController.loginUser
);

// user register route
router.post(
  '/register',
  validateRequest(authValidation.RegisterValidationSchema),
  AuthController.registerUser
)

// send otp
router.post(
  '/send-otp',
  validateRequest(authValidation.SendOtpValidationSchema),
  AuthController.sendOtp
)

// verify otp
router.post(
  '/verify-otp', 
  validateRequest(authValidation.VerifyOtpValidationSchema),
  AuthController.verifyOtp
)

// user logout route
router.post("/logout",
  auth(),
 AuthController.logoutUser);

// change password
router.put(
  "/change-password",
  auth(),
  validateRequest(authValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

// forgot password
router.post(
  '/forgot-password',
  AuthController.forgotPassword
);

// reset password
router.post(
  '/reset-password',
  AuthController.resetPassword
)

export const AuthRoutes = router;
