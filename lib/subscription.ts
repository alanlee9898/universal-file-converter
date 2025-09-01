import { PRICING_PLANS, PricingPlan } from './stripe';

// User subscription interface
export interface UserSubscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: PricingPlan;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Usage tracking interface
export interface UserUsage {
  userId: string;
  date: string; // YYYY-MM-DD format
  conversions: number;
  totalFileSize: number;
}

// Check if user can perform conversion
export function canUserConvert(
  subscription: UserSubscription | null,
  dailyUsage: UserUsage | null,
  fileSize: number
): { allowed: boolean; reason?: string } {
  const plan = subscription?.plan || 'FREE';
  const planLimits = PRICING_PLANS[plan].limits;

  // Check file size limit
  if (fileSize > planLimits.maxFileSize) {
    return {
      allowed: false,
      reason: `File size exceeds ${formatFileSize(planLimits.maxFileSize)} limit for ${PRICING_PLANS[plan].name} plan`
    };
  }

  // Check daily conversion limit (only for non-unlimited plans)
  if (planLimits.dailyConversions !== -1) {
    const currentConversions = dailyUsage?.conversions || 0;
    if (currentConversions >= planLimits.dailyConversions) {
      return {
        allowed: false,
        reason: `Daily conversion limit of ${planLimits.dailyConversions} reached for ${PRICING_PLANS[plan].name} plan`
      };
    }
  }

  // Check subscription status
  if (subscription && subscription.status !== 'active' && subscription.status !== 'trialing') {
    return {
      allowed: false,
      reason: 'Subscription is not active. Please update your payment method.'
    };
  }

  return { allowed: true };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get remaining conversions for the day
export function getRemainingConversions(
  subscription: UserSubscription | null,
  dailyUsage: UserUsage | null
): number | null {
  const plan = subscription?.plan || 'FREE';
  const planLimits = PRICING_PLANS[plan].limits;
  
  if (planLimits.dailyConversions === -1) {
    return null; // Unlimited
  }
  
  const used = dailyUsage?.conversions || 0;
  return Math.max(0, planLimits.dailyConversions - used);
}
