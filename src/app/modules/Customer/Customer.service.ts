// Customer.service: Module file for the Customer.service functionality.

import { Customer, Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";

const createCustomer = async (customerData: Customer, file: Express.Multer.File) => {
  const doesUserExist =  await prisma.user.findUnique({
    where: {
      id: customerData.userId,
    },
  });

  if(!doesUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const isCustomerExist = !!await prisma.customer.findUnique({
    where: {
      userId: customerData.userId,
    },
  });

  if(isCustomerExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Customer account already created with this userid");
  }   // there is a problem here. need to fix it later.

  if(!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Profile image is required");
  }

  const {Location} = await fileUploader.uploadToDigitalOcean(file);

  customerData.profileImage = Location;

  const customer = await prisma.customer.create({
    data: customerData,
  });
  
  return customer;
};

// get all customers
const getAllCustomer = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  
  const whereConditons: Prisma.CustomerWhereInput = { };

  const result = await prisma.customer.findMany({
      where: whereConditons,
      skip,
      take: limit,
      include: {
        user: true,
      },
      orderBy:
          options.sortBy && options.sortOrder
              ? {
                  [options.sortBy]: options.sortOrder,
              }
              : {
                  createdAt: "desc",
              },
  });

  const total = await prisma.customer.count({
      where: whereConditons,
  });

  if (!result || result.length === 0) {
      throw new ApiError(404, "No active customers found");
  }

  return {
      meta: {
          page,
          limit,
          total,
      },
      data: result,
  };
};

// get a customer
const getCustomer = async (id:string) => {
  const customer = await prisma.customer.findUnique({
    where: {
      id: id,
    },
    include: {
      user: true,
    },
  });

  if(!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  } 

  return customer;
};

// update a customer
const updateCustomer = async (id:string, customerData: Partial<Omit<Customer, "userId" | "id">>) => {
  const customer = await prisma.customer.update({
    where: {
      id: id,
    },
    data: customerData,
  });
  return customer;
};

// delete a customer
const deleteCustomer = async (id:string) => {
  const isExistCustomer = await prisma.customer.findUnique({
    where: {
      id: id,
    },
    select: {
      userId: true,
    }
  });

  if(!isExistCustomer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }

  // delete from customer and user table
  await prisma.$transaction(async (tx) => {
    // delete customer
    await tx.customer.delete({
      where: {
        id: id,
      },
    });

    // delete user
    await tx.user.delete({
      where: {
        id: isExistCustomer.userId,
      },
    });
  });
};

export const CustomerService = {
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getAllCustomer,
};