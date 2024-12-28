// Payment.service: Module file for the Payment.service functionality.

import { Customer, Payment, TripStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import Stripe from "stripe";
import config from "../../../config";
import { IStripeSaveWithCustomerInfo } from "./Payment.interface";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { isValidAmount } from "./Payment.utils";

const stripe = new Stripe(config.stripe_key as string, {
  apiVersion: "2024-06-20",
});

// Step 1: Create a Customer and Save the Card into Stripe
const saveCardWithCustomerInfoIntoStripe = async (
  payload: IStripeSaveWithCustomerInfo,
  userId: string
) => {
  try {
    const { name, email, paymentMethodId, address } = payload;

    // Create a new Stripe customer
    const customer = await stripe.customers.create({
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
      customer: customer.id,
    });

    // Set PaymentMethod as Default
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // update profile with customerId
    await prisma.customer.update({
      where: {
        id: userId,
      },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return {
      stripeCustomerId: customer.id,
      paymentMethodId: paymentMethodId,
    };

  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

// Step 2: Authorize the Payment Using Saved Card
const authorizedPaymentWithSaveCardFromStripe = async (payload: {
  amount: number;
  customerId: string;
  paymentMethodId: string;
  stripeCustomerId: string;
  tripId: string;
  driverId: string;
}) => {
  try {
    const { amount, customerId, paymentMethodId, stripeCustomerId, tripId, driverId } = payload;

    if (!isValidAmount(amount)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Amount '${amount}' is not a valid amount`
      );
    }

    // Create a PaymentIntent with the specified PaymentMethod

    // add payment to database with pending status
    const paymentData = {
      customerId: customerId,
      stripeCustomerId: stripeCustomerId,
      driverId: driverId,
      tripId: tripId,
      amount: amount,
      status: "Pending",
    }

    const [paymentIntent, _ ] = await Promise.all([

      // create payment intent
      await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        capture_method: "manual", // Authorize the payment without capturing
      }),

      // add payment to database with pending status
      await prisma.payment.create({
        data: paymentData,
      }),

      // update trip status to confirmed
      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          tripStatus: TripStatus.Confirmed,
        },
      }),

    ]);
    
    return paymentIntent;

  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

// Step 3: Capture the Payment
const capturePaymentRequestToStripe = async (payload: {
  paymentIntentId: string;
  tripId: string;
}) => {
  try {
    const { paymentIntentId, tripId } = payload;

    // Capture the authorized payment using the PaymentIntent ID
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    // update payment status to completed
    await prisma.payment.update({
      where: {
        id: paymentIntentId,
      },
      data: {
        status: "Completed",
      },
    });

    return paymentIntent;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};






export const paymentService = {
  saveCardWithCustomerInfoIntoStripe,
  authorizedPaymentWithSaveCardFromStripe,
  capturePaymentRequestToStripe
}
