'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  CreditCard, 
  Download, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '@/lib/stripe';
import { UserSubscription, UserUsage, getRemainingConversions, formatFileSize } from '@/lib/subscription';

interface SubscriptionManagerProps {
  subscription: UserSubscription | null;
  usage: UserUsage | null;
  onUpgrade: () => void;
  onManageBilling: () => void;
  onCancelSubscription: () => void;
}

export function SubscriptionManager({
  subscription,
  usage,
  onUpgrade,
  onManageBilling,
  onCancelSubscription,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);

  const currentPlan = subscription?.plan || 'FREE';
  const plan = PRICING_PLANS[currentPlan];
  const remaining = getRemainingConversions(subscription, usage);
  const usedConversions = usage?.conversions || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trialing':
        return 'bg-blue-500';
      case 'past_due':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'trialing':
        return <Calendar className="w-4 h-4" />;
      case 'past_due':
        return <AlertTriangle className="w-4 h-4" />;
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getUsagePercentage = () => {
    if (plan.limits.dailyConversions === -1) return 0; // Unlimited
    return (usedConversions / plan.limits.dailyConversions) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan: {plan.name}
                {subscription && (
                  <Badge className={getStatusColor(subscription.status)}>
                    {getStatusIcon(subscription.status)}
                    {subscription.status}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {currentPlan === 'FREE' 
                  ? 'You are currently on the free plan'
                  : `$${plan.price}/month`
                }
              </CardDescription>
            </div>
            {currentPlan !== 'ENTERPRISE' && (
              <Button onClick={onUpgrade} variant="outline">
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Plan Features</h4>
              <ul className="text-sm space-y-1">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {subscription && (
              <div>
                <h4 className="font-medium mb-2">Billing Information</h4>
                <div className="text-sm space-y-1">
                  <p>Current period: {formatDate(subscription.currentPeriodStart)}</p>
                  <p>Renews: {formatDate(subscription.currentPeriodEnd)}</p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-red-600">Cancels at period end</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Today&apos;s Usage
          </CardTitle>
          <CardDescription>
            Track your daily conversion usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Conversions Used</span>
                <span>
                  {usedConversions}
                  {plan.limits.dailyConversions !== -1 && ` / ${plan.limits.dailyConversions}`}
                </span>
              </div>
              {plan.limits.dailyConversions !== -1 ? (
                <Progress value={getUsagePercentage()} className="h-2" />
              ) : (
                <div className="text-sm text-green-600 font-medium">Unlimited conversions</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Remaining Today:</span>
                <div className="font-medium">
                  {remaining === null ? 'Unlimited' : remaining}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Max File Size:</span>
                <div className="font-medium">
                  {formatFileSize(plan.limits.maxFileSize)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Management */}
      {subscription && subscription.plan !== 'FREE' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing Management
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={onManageBilling} variant="outline">
                Update Payment Method
              </Button>
              <Button 
                onClick={onCancelSubscription} 
                variant="destructive"
                disabled={loading}
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {subscription?.status === 'past_due' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your payment is past due. Please update your payment method to continue using the service.
          </AlertDescription>
        </Alert>
      )}

      {subscription?.cancelAtPeriodEnd && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your subscription will be canceled at the end of the current billing period on{' '}
            {formatDate(subscription.currentPeriodEnd)}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
