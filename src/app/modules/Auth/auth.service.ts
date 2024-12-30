import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import * as bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import emailSender from "./emailSender";
import httpStatus from "http-status";
import { User, UserRole } from "@prisma/client";
import { removeObjectProperty } from "../../../helpars/utils";
import { Twilio } from "twilio";

// user login
const loginUser = async (payload: { email: string; password: string, fcmToken: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    }
  });

  if (!userData?.email) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found! with this email " + payload.email
    );
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
  }

  if (payload.fcmToken) {
    await prisma.user.update({
      where: { id: userData.id },
      data: { fcmToken: payload.fcmToken },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      fcmToken: userData.fcmToken || null,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { token: accessToken };
};

// user register
const registerUser = async (payload: { email: string; password: string; phoneNumber: string; role: UserRole }): Promise<{ data: Omit<User, "password">, token: string }> => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: payload.email },
        { phoneNumber: payload.phoneNumber }
      ]
    }
  })

  if (user) {
    throw new ApiError(httpStatus.BAD_REQUEST, `User already exists with this email ${payload.email} or phone number ${payload.phoneNumber}`);
  }

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));

  const userData = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword
    },
  });

  const userDataExceptPassword = removeObjectProperty(userData, "password");

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      fcmToken: userData.fcmToken || null,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );
  return { data: userDataExceptPassword, token: accessToken };
}

// change password
const changePassword = async (
  userToken: string,
  newPassword: string,
  oldPassword: string
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken?.id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user?.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: {
      id: decodedToken.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return { message: "Password changed successfully" };
};

// forgot password
const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  const resetPassToken = jwtHelpers.generateToken(
    { email: userData.email, role: userData.role, id: userData.id },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string
  );

  const resetPassLink =
    config.reset_pass_link + `?userId=${userData.id}&token=${resetPassToken}`;


  await emailSender(
    "Reset Your Password",
    userData.email,
    `
     <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear User</p>
          
          <p>We received a request to reset your password. Click the button below to reset your password:</p>
          
          <a href="${resetPassLink}" style="text-decoration: none;">
            <button style="background-color: #007BFF; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
              Reset Password
            </button>
          </a>
          
          <p>If you did not request a password reset, please ignore this email or contact support if you have any concerns.</p>
          
          <p>Thank you,<br>Dream 2 Drive</p>
</div>
      `
  );
  return { message: "Reset password link sent via your email successfully" };
};

// reset password
const resetPassword = async (token: string, payload: { password: string }) => {
  const isValidToken = jwtHelpers.verifyToken(
    token,
    config.jwt.reset_pass_secret as Secret
  );

  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id: isValidToken.id,
    },
  });

  // hash password
  const password = await bcrypt.hash(payload.password, 12);

  // update into database
  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password,
    },
  });
  return { message: "Password reset successfully" };
};

// send otp
const sendOtp = async (phoneNumber: string) =>  {
  const client = new Twilio(config.twilio.account_sid, config.twilio.auth_token);
  const OTP_EXPIRY_TIME = 2 * 60 * 1000;

  if (!phoneNumber) {
    throw new ApiError(httpStatus.NOT_FOUND, "Phone number is required");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const expiry = new Date(Date.now() + OTP_EXPIRY_TIME);

  // Store OTP in database using Prisma
  const isStoredOtp = await prisma.oTP.upsert({
    where: { phoneNumber },
    update: { otpCode: otp, expiry },
    create: { phoneNumber, otpCode: otp, expiry },
  });

  if (!isStoredOtp) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to store OTP in the database."
    );
  }

  // Send OTP via Twilio SMS
  const result = await client.messages.create({
    body: `Your OTP code is ${otp}. It will expire in 2 minutes.`,
    from: config.twilio.phone_number,
    to: phoneNumber,
  });

  const formateRes = {
    body: result.body,
    from: result.from,
    to: result.to,
    status: result.status,
    sid: result.sid,
    dateCreated: result.dateCreated,
  };
  return formateRes;
};

// verify number
const verifyOtp = async (payload: { phoneNumber: string, otp: string }) => {
  const { phoneNumber, otp } = payload; 
  if (!phoneNumber || !otp) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Phone number and OTP are required"
    );
  }

  const storedOtp = await prisma.oTP.findUnique({
    where: { phoneNumber },
  });

  if (!storedOtp) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "OTP not found. Please request a new one.' "
    );
  }

  if (new Date() > storedOtp.expiry) {
    throw new ApiError(
      httpStatus.EXPECTATION_FAILED,
      "OTP has expired. Please request a new one."
    );
  }

  if (storedOtp.otpCode !== otp) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid OTP. Please check the code and try again."
    );
  }

  return { phoneNumber };
};

export const AuthServices = {
  loginUser,
  registerUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
  sendOtp
};
