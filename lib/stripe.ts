import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

// Client-side Stripe instance
let stripePromise: Promise<any>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Pricing configuration
export const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Up to 5 file conversions per day',
      'Basic file formats',
      'Standard quality',
      'Local processing'
    ],
    limits: {
      dailyConversions: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    }
  },
  PRO: {
    name: 'Pro',
    price: 9.99,
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited file conversions',
      'All file formats',
      'High quality output',
      'Batch processing',
      'Priority support',
      'Advanced settings'
    ],
    limits: {
      dailyConversions: -1, // Unlimited
      maxFileSize: 100 * 1024 * 1024, // 100MB
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 29.99,
    priceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Custom file size limits'
    ],
    limits: {
      dailyConversions: -1, // Unlimited
      maxFileSize: 1024 * 1024 * 1024, // 1GB
    }
  }
};

export type PricingPlan = keyof typeof PRICING_PLANS;
