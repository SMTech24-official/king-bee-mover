// Customer.service: Module file for the Customer.service functionality.

import { Customer } from "@prisma/client";
import prisma from "../../../shared/prisma";

const createCustomer = async (customerData: Customer) => {
  const customer = await prisma.customer.create({
    data: customerData,
  });
  return customer;
};

export const CustomerService = {
  createCustomer,
};
