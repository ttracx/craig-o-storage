import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Free",
    storage: 5 * 1024 * 1024 * 1024, // 5GB
    price: 0,
  },
  pro: {
    name: "Pro",
    storage: 100 * 1024 * 1024 * 1024, // 100GB
    price: 14,
    priceId: process.env.STRIPE_PRICE_ID!,
  },
};
