import { DriverTripApplicationStatus, PaymentStatus, Prisma, TripStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IStripeSaveWithCustomerInfo } from "./Payment.interface";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { isValidAmount } from "./Payment.utils";
import { stripe } from "../../../shared/stripe";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";

// Step 1: Create a Customer and Save the Card into Stripe
const saveCardWithCustomerInfoIntoStripe = async (
  payload: IStripeSaveWithCustomerInfo,
  userId: string
) => {
  const { name, email, paymentMethodId, address } = payload;

  // Create a new Stripe customer
  const stripeCustomer = await stripe.customers.create({
    name: name,
    email: email,
    address: {
      city: address.city,
      postal_code: address.postal_code,
      country: address.country,
    },
  });

  // Attach PaymentMethod to the Customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: stripeCustomer.id,
  });

  // Set PaymentMethod as Default
  await stripe.customers.update(stripeCustomer.id, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  // update profile with customerId
  await prisma.customer.update({
    where: {
      userId: userId,
    },

    data: {
      stripeCustomerId: stripeCustomer.id,
      paymentMethodId: paymentMethodId,
    },
  });

  return {
    stripeCustomerId: stripeCustomer.id,
    paymentMethodId: paymentMethodId,
  };
}

// Step 2: Authorize the Payment Using Saved Card
const authorizedPaymentWithSaveCardFromStripe = async (payload: {
  amount: number;
  customerId: string;
  paymentMethodId: string;
  stripeCustomerId: string;
  tripId: string;
  driverId: string;
}) => {
  const { amount, customerId, paymentMethodId, stripeCustomerId, tripId, driverId } = payload;
  if (!isValidAmount(amount)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Amount '${amount}' is not a valid amount`
    );
  }

  // create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: "usd",
    customer: stripeCustomerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    transfer_group: `tripId_${tripId}`,
    capture_method: "manual", // Authorize the payment without capturing
  });

  // add payment to database with pending status
  const paymentData = {
    customerId: customerId,
    stripeCustomerId: stripeCustomerId,
    driverId: driverId,
    tripId: tripId,
    amount: amount,
    applicationFeeAmount: Math.round(amount * 0.2 * 100),
    paymentIntentId: paymentIntent?.id,
    paymentMethodId: paymentMethodId,
    status: PaymentStatus.Pending,
  }

  let retries = 0;
  while (retries < 3) {
    try {
      await prisma.$transaction(async (tx) => {
        // add payment to database with pending status
        await tx.payment.create({
          data: paymentData,
        });

        // update trip status to confirmed
        await tx.trip.update({
          where: {
            id: tripId,
          },
          data: {
            tripStatus: TripStatus.Confirmed,
          },
        })
      });

      break;
    } catch (err) {
      console.log('error from transaction: retries', retries, err);
      if ((err as any)?.code === "P2010") {
        retries++;
        continue;
      }
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update payment on local database");
    }
  }

  return { paymentIntentId: paymentIntent.id };
};

// Step 3: Capture the Payment
const capturePaymentRequestToStripe = async (payload: {
  paymentIntentId: string
  driverAccountId: string
  totalAmount: number
  tripId: string
}) => {
  const { paymentIntentId, driverAccountId, totalAmount, tripId } = payload;

  let driverShare = 0;
  // capture payment and transfer to driver
  try {
    // Capture the authorized payment using the PaymentIntent ID
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    // Split the payment 
    driverShare = Math.round(totalAmount * 0.8 * 100); // 80% to driver convert into cents

    if (paymentIntent.status === "succeeded") {
      await stripe.transfers.create({
        amount: driverShare,
        currency: 'usd',
        destination: driverAccountId, // Driver's connected account ID
        transfer_group: `tripId_${tripId}`,
      });
    }

  } catch (err) {
    console.log("err", err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to capture payment");
  }

  let retries = 0;

  while (retries < 3) {
    try {
      // update payment information in database
      await prisma.$transaction(async (tx) => {
        // update payment status to completed
        const payment = await tx.payment.update({
          where: {
            paymentIntentId: paymentIntentId,
          },
          data: {
            status: PaymentStatus.Confirmed,
          },
        });

        // update driver account balance
        await tx.driver.update({
          where: {
            stripeAccountId: driverAccountId,
          },
          data: {
            totalEarnings: {
              increment: Math.round(driverShare / 100), // convert into dollars
            },
          },
        });

        // update trip status to completed
        await tx.trip.update({
          where: {
            id: payment.tripId,
          },
          data: {
            tripStatus: TripStatus.Completed,
          },
        });

        // update driver trip application status to completed
        const driver = await tx.trip.findUnique({
          where: {
            id: payment.tripId,
          },
          select: {
            assignedDriverId: true,
          },
        })

        console.log("driver from payment service", driver);

        // update driver trip application status to completed
        await tx.driverTripApplication.update({
          where: {
            tripId_driverId: {
              tripId: payment.tripId,
              driverId: driver?.assignedDriverId!,
            },
          },
          data: {
            status: DriverTripApplicationStatus.Completed,
          },
        });
      }, { timeout: 15000 });
      break;
    } catch (err) {
      if ((err as any)?.code === "P2010") {
        console.log('error from transaction: retries', retries, err);
        retries++;
        continue;
      }

      console.log("err from capture payment", err);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update  capture payment status on local database");
    }
  }

  return paymentIntentId;
};

// Step 4: Get Customer Saved Cards
const getCustomerSavedCardsFromStripe = async (stripeCustomerId: string) => {

  // List all payment methods for the customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
  });
  return { paymentMethodId: paymentMethods };
};

// Step 5: Refund amount to customer in the stripe
const refundPaymentToCustomer = async (payload: {
  paymentIntentId: string;
}) => {
  // Refund the payment intent
  const refund = await stripe.refunds.create({
    payment_intent: payload?.paymentIntentId,
  });
  return refund;
};

// Step 6: get driver account details
const getDriverAccountDetailsFromStripe = async (stripeAccountId: string) => {
  const account = await stripe.accounts.retrieve(stripeAccountId);
  return account;
};

const getAllPayments = async (option: IPaginationOptions, params: { status: PaymentStatus, startDate: string, endDate: string }) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(option);
  const { startDate, endDate, ...restParams } = params || {};
  const andConditions: Prisma.PaymentWhereInput[] = [];

  if (startDate) {
    andConditions.push({
      timestamp: {
        gte: new Date(startDate)
      }
    })
  };

  if (endDate) {
    andConditions.push({
      timestamp: {
        lte: new Date(endDate)
      }
    })
  };

  if (startDate && endDate) {
    andConditions.push({
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  if (Object.keys(restParams).length > 0) {
    andConditions.push({
      AND: Object.keys(restParams).map((key) => ({
        [key]: { equals: (restParams as any)[key] },
      })),
    });
  }

  const whereConditions: Prisma.PaymentWhereInput = { AND: andConditions };

  const payments = await prisma.payment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      customer: {
        include: {
          user: {
            select: {
              phoneNumber: true
            }
          }
        }
      }
    },
    orderBy:
      sortBy && sortOrder
        ? {
          [sortBy]: sortOrder,
        }
        : {
          createdAt: "desc",
        },
  },
  );


  const updatedPayment = payments.map((payment) => {
    const obj: any = { ...payment };
    obj["phoneNumber"] = payment.customer?.user?.phoneNumber;
    obj["name"] = payment?.customer?.name;
    delete obj["customer"];
    return obj;
  })

  const total = await prisma.payment.count({
    where: whereConditions,
  });

  if (!total) {
    throw new ApiError(httpStatus.NOT_FOUND, "No payments found");
  }

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: updatedPayment,
  };
}


const getPayment = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: id
    },
    include: {
      trip: true
    }
  })

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  };

  const customer = await stripe.customers.retrieve(payment.stripeCustomerId!);

  const paymentMethods = await stripe.paymentMethods.list({
    customer: payment.stripeCustomerId!,
    type: "card",
  });


  const card = paymentMethods.data[0];

  console.log("card", card);

  if (Object.keys(card).length > 0) {
    const cardDetails = {
      email: (customer as any).email, // Customer email
      nameOnCard: card.billing_details.name || 'N/A', // Name on card
      cardBrand: (card.card as any).brand, // Card brand (e.g., Visa, Mastercard)
      last4: (card.card as any).last4, // Last 4 digits of the card
      expMonth: (card.card as any).exp_month, // Expiration month
      expYear: (card.card as any).exp_year, // Expiration year
    };
    // @ts-ignore
    payment["cardDetails"] = cardDetails;
  }
  return payment;
}

const paymentSummary = async (n?: number) => {

  let completedPayment = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.Confirmed
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true
    }
  });
   

  const pendingPayment = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.Pending
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true
    }
  });

  const cencelledPayments = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.Cancelled
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true
    }
  });

  const driverPayouts = await prisma.driver.aggregate({
    _sum: {
      totalEarnings: true
    },
    _count: {
      id: true
    }
  });


  const applicationEarnings = await prisma.payment.aggregate({
    _sum: {
      applicationFeeAmount: true
    },
    _count: {
      id: true
    }
  })

  const obj = {
    completedPaymentAmount: completedPayment._sum.amount,
    completedPaymentCount: completedPayment._count.id,

    pendingPaymentAmount: pendingPayment._sum.amount,
    pendingPaymentCount: pendingPayment._count.id,

    cencelledPaymentsAmount: cencelledPayments._sum.amount,
    cencelledPaymentsCount: cencelledPayments._count.id,

    driverPayoutsAmount: driverPayouts._sum.totalEarnings,
    driverPayoutsCount: driverPayouts._count.id,

    applicationEarnings: applicationEarnings._sum.applicationFeeAmount,
    applicationEarningsCount: applicationEarnings._count.id
  }



  return obj;
}


const lastNMonthPayment = async (n: number) => {
  const currentDate = new Date();
  const aggregates = [];

  // Loop through the last n months
  for (let i = 0; i < n; i++) {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

    try {
      // Aggregate payments for each month
      const monthlyAggregate = await prisma.payment.aggregate({
        where: {
          status: PaymentStatus.Confirmed,
          createdAt: {
            gte: startOfMonth.toISOString(), // Start of current month
            lte: endOfMonth.toISOString(),   // End of previous month
          },
        },
        _sum: {
          amount: true,
        },
      });

      aggregates.push({
        month: startOfMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' }), // Format month
        sum: monthlyAggregate._sum.amount || 0, // Sum of payments for the month
      });

    } catch (error) {
      console.error(`Error aggregating payments for month ${startOfMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}:`, error);
      throw error;
    }
  }

  // Calculate total sum across all months
  const totalSum = aggregates.reduce((total, monthAggregate) => total + monthAggregate.sum, 0);

  console.log('Monthly aggregates:', aggregates);
  console.log('Total sum:', totalSum);

  return {
    totalSum,
    monthlySums: aggregates
  }

}


export const paymentService = {
  saveCardWithCustomerInfoIntoStripe,
  authorizedPaymentWithSaveCardFromStripe,
  capturePaymentRequestToStripe,
  getCustomerSavedCardsFromStripe,
  refundPaymentToCustomer,
  getDriverAccountDetailsFromStripe,
  getAllPayments,
  getPayment,
  paymentSummary, 
  lastNMonthPayment
}