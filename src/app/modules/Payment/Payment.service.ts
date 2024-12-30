// Payment.service: Module file for the Payment.service functionality.

import { Customer, DriverTripApplicationStatus, Payment, TripStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IStripeSaveWithCustomerInfo } from "./Payment.interface";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { isValidAmount } from "./Payment.utils";
import { stripe } from "../../../shared/stripe";



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

  // Create a PaymentIntent with the specified PaymentMethod

  // create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: "usd",
    customer: stripeCustomerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    capture_method: "manual", // Authorize the payment without capturing
  });

  // add payment to database with pending status
  const paymentData = {
    customerId: customerId,
    stripeCustomerId: stripeCustomerId,
    driverId: driverId,
    tripId: tripId,
    amount: amount,
    paymentIntentId: paymentIntent.id,
    status: "Pending",
  }

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
  return paymentIntent;
};

// Step 3: Capture the Payment
const capturePaymentRequestToStripe = async (paymentIntentId: string) => {

  // Capture the authorized payment using the PaymentIntent ID
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

  // update payment status to completed
  const payment = await prisma.payment.update({
    where: {
      paymentIntentId: paymentIntentId,
    },
    data: {
      status: "Completed",
    },
  });

  // update trip status to completed
  await prisma.trip.update({
    where: {
      id: payment.tripId,
    },
    data: {
      tripStatus: TripStatus.Completed,
    },
  });

  // update driver trip application status to completed
  const driver = await prisma.trip.findUnique({
    where: {
      id: payment.tripId,
    },
    select: {
      assignedDriverId: true,
    },
  })


  await prisma.driverTripApplication.update({
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

  return paymentIntent;
};

// Step 4: Get Customer Saved Cards
const getCustomerSavedCardsFromStripe = async (stripeCustomerId: string) => {

  // List all payment methods for the customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
  });

  return { paymentMethodId: paymentMethods.data[0].id };

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

export const paymentService = {
  saveCardWithCustomerInfoIntoStripe,
  authorizedPaymentWithSaveCardFromStripe,
  capturePaymentRequestToStripe,
  getCustomerSavedCardsFromStripe,
  refundPaymentToCustomer
}