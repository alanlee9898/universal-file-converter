'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, AlertTriangle } from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '@/lib/stripe';
import { UserSubscription, UserUsage, getRemainingConversions, formatFileSize } from '@/lib/subscription';

interface UsageTrackerProps {
  subscription: UserSubscription | null;
  usage: UserUsage | null;
  onUpgrade: () => void;
  className?: string;
}

export function UsageTracker({ subscription, usage, onUpgrade, className }: UsageTrackerProps) {
  const currentPlan = subscription?.plan || 'FREE';
  const plan = PRICING_PLANS[currentPlan];
  const remaining = getRemainingConversions(subscription, usage);
  const usedConversions = usage?.conversions || 0;

  const getUsagePercentage = () => {
    if (plan.limits.dailyConversions === -1) return 0; // Unlimited
    return Math.min(100, (usedConversions / plan.limits.dailyConversions) * 100);
  };

  const isNearLimit = () => {
    if (plan.limits.dailyConversions === -1) return false;
    return getUsagePercentage() >= 80;
  };

  const isAtLimit = () => {
    if (plan.limits.dailyConversions === -1) return false;
    return remaining === 0;
  };

  const getPlanIcon = () => {
    switch (currentPlan) {
      case 'PRO':
        return <Crown className="w-4 h-4 text-purple-500" />;
      case 'ENTERPRISE':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      default:
        return <Zap className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPlanBadgeColor = () => {
    switch (currentPlan) {
      case 'PRO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ENTERPRISE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {getPlanIcon()}
              Current Plan
            </CardTitle>
            <Badge className={getPlanBadgeColor()}>
              {plan.name}
            </Badge>
          </div>
          {currentPlan !== 'ENTERPRISE' && (
            <Button onClick={onUpgrade} size="sm" variant="outline">
              Upgrade
            </Button>
          )}
        </div>
        <CardDescription>
          Track your daily usage and plan limits
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Conversions Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Daily Conversions</span>
            <span className="text-sm text-muted-foreground">
              {usedConversions}
              {plan.limits.dailyConversions !== -1 && ` / ${plan.limits.dailyConversions}`}
            </span>
          </div>
          
          {plan.limits.dailyConversions !== -1 ? (
            <>
              <Progress 
                value={getUsagePercentage()} 
                className={`h-2 ${isNearLimit() ? 'bg-red-100' : 'bg-gray-100'}`}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {remaining} remaining today
                </span>
                {isNearLimit() && !isAtLimit() && (
                  <span className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Near limit
                  </span>
                )}
                {isAtLimit() && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Limit reached
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-green-600 font-medium">
              ✨ Unlimited conversions
            </div>
          )}
        </div>

        {/* File Size Limit */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Max File Size</span>
            <span className="text-sm text-muted-foreground">
              {formatFileSize(plan.limits.maxFileSize)}
            </span>
          </div>
        </div>

        {/* Plan Features Preview */}
        {currentPlan === 'FREE' && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              Upgrade to unlock:
            </div>
            <ul className="text-xs space-y-1">
              <li>• Unlimited daily conversions</li>
              <li>• Larger file size limits</li>
              <li>• Advanced settings</li>
              <li>• Priority support</li>
            </ul>
          </div>
        )}

        {/* Upgrade CTA for near/at limit */}
        {isAtLimit() && currentPlan === 'FREE' && (
          <div className="pt-2 border-t">
            <Button onClick={onUpgrade} className="w-full" size="sm">
              Upgrade for Unlimited Conversions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
