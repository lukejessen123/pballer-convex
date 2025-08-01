import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Query to get user's Stripe account status
export const getUserStripeStatus = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db.get(userId);
    return {
      stripeAccountId: profile?.stripe_account_id || null,
      stripeCustomerId: profile?.stripe_customer_id || null,
    };
  },
});

// Action to initiate Stripe Connect
export const initiateStripeConnect = action({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    // This would typically call Stripe's API to create a Connect account
    // For now, we'll return a placeholder URL
    // In production, you would:
    // 1. Call Stripe's API to create a Connect account
    // 2. Store the account ID in the user's profile
    // 3. Return the authorization URL
    
    const stripeConnectUrl = `${process.env.STRIPE_CONNECT_URL || 'https://connect.stripe.com/oauth/authorize'}?client_id=${process.env.STRIPE_CLIENT_ID}&response_type=code&scope=read_write&state=${userId}`;
    
    return { url: stripeConnectUrl };
  },
});

// Mutation to update user's Stripe account ID
export const updateStripeAccountId = mutation({
  args: { 
    userId: v.id("profiles"), 
    stripeAccountId: v.string() 
  },
  handler: async (ctx, { userId, stripeAccountId }) => {
    await ctx.db.patch(userId, {
      stripe_account_id: stripeAccountId,
    });
  },
});

// Mutation to update user's Stripe customer ID
export const updateStripeCustomerId = mutation({
  args: { 
    userId: v.id("profiles"), 
    stripeCustomerId: v.string() 
  },
  handler: async (ctx, { userId, stripeCustomerId }) => {
    await ctx.db.patch(userId, {
      stripe_customer_id: stripeCustomerId,
    });
  },
});

// Query to get payment history for a club
export const getClubPayments = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, { clubId }) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_club", (q) => q.eq("club_id", clubId))
      .collect();
    
    return payments;
  },
});

// Action to create a payment intent (for future use)
export const createPaymentIntent = action({
  args: { 
    amount: v.number(),
    currency: v.string(),
    clubId: v.id("clubs"),
    description: v.string(),
  },
  handler: async (ctx, { amount, currency, clubId, description }) => {
    // This would integrate with Stripe's API to create a payment intent
    // For now, return a placeholder
    // In production, you would:
    // 1. Call Stripe's API to create a payment intent
    // 2. Store the payment record in the database
    // 3. Return the client secret
    
    return {
      clientSecret: "placeholder_client_secret",
      paymentId: "placeholder_payment_id",
    };
  },
}); 