import { UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
  const payload: any = {
    email: "admin@gmail.com",
    phoneNumber: "1234567890",
    password: "12345678",
    role: UserRole.Admin,
    fcmToken: "sdlfkjasdflsdjflsdl",
  };

  const isExistUser = !!await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
 
  if (isExistUser) return;

  await prisma.user.create({
    data: payload,
  });
};
