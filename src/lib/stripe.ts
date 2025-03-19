import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export const PLANS = {
  FREE: {
    name: '無料プラン',
    price: 0,
    apiCalls: 1,
    stripePriceId: '',
  },
  BASIC: {
    name: 'ベーシックプラン',
    price: 2000, // $20
    apiCalls: 5,
    stripePriceId: 'price_basic', // This will be replaced with actual Stripe price ID
  },
  PREMIUM: {
    name: 'プレミアムプラン',
    price: 10000, // $100
    apiCalls: 25,
    stripePriceId: 'price_premium', // This will be replaced with actual Stripe price ID
  },
};

export type PlanType = keyof typeof PLANS;
