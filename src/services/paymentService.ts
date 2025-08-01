import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Interfaces for payment data
export interface StripeStatus {
  stripeAccountId: string | null;
  stripeCustomerId: string | null;
}

export interface Payment {
  _id: Id<"payments">;
  _creationTime: number;
  club_id: Id<"clubs">;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_id: string;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentId: string;
}

// Hooks for payment operations
export const useUserStripeStatus = (userId: Id<"profiles">) => {
  return useQuery(api.paymentFunctions.getUserStripeStatus, { userId });
};

export const useInitiateStripeConnect = () => {
  return useAction(api.paymentFunctions.initiateStripeConnect);
};

export const useUpdateStripeAccountId = () => {
  return useMutation(api.paymentFunctions.updateStripeAccountId);
};

export const useUpdateStripeCustomerId = () => {
  return useMutation(api.paymentFunctions.updateStripeCustomerId);
};

export const useClubPayments = (clubId: Id<"clubs">) => {
  return useQuery(api.paymentFunctions.getClubPayments, { clubId });
};

export const useCreatePaymentIntent = () => {
  return useAction(api.paymentFunctions.createPaymentIntent);
};

// Utility functions for payment formatting
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Assuming amount is in cents
};

export const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'processing': 'Processing',
    'succeeded': 'Succeeded',
    'failed': 'Failed',
    'canceled': 'Canceled',
  };
  return statusMap[status] || status;
};

export const getPaymentStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'pending': 'text-yellow-600 dark:text-yellow-400',
    'processing': 'text-blue-600 dark:text-blue-400',
    'succeeded': 'text-success-600 dark:text-success-400',
    'failed': 'text-error-600 dark:text-error-400',
    'canceled': 'text-gray-600 dark:text-gray-400',
  };
  return colorMap[status] || 'text-gray-600 dark:text-gray-400';
}; 