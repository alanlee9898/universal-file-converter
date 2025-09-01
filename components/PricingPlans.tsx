'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '@/lib/stripe';

interface PricingPlansProps {
  currentPlan?: PricingPlan;
  onSelectPlan: (plan: PricingPlan) => void;
  loading?: boolean;
}

export function PricingPlans({ currentPlan = 'FREE', onSelectPlan, loading = false }: PricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(currentPlan);

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    onSelectPlan(plan);
  };

  const getPlanIcon = (plan: PricingPlan) => {
    switch (plan) {
      case 'FREE':
        return <Zap className="w-6 h-6 text-blue-500" />;
      case 'PRO':
        return <Crown className="w-6 h-6 text-purple-500" />;
      case 'ENTERPRISE':
        return <Star className="w-6 h-6 text-yellow-500" />;
      default:
        return <Zap className="w-6 h-6 text-blue-500" />;
    }
  };

  const isPopular = (plan: PricingPlan) => plan === 'PRO';

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground">
          Unlock the full potential of Universal File Converter
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {(Object.keys(PRICING_PLANS) as PricingPlan[]).map((planKey) => {
          const plan = PRICING_PLANS[planKey];
          const isCurrentPlan = currentPlan === planKey;
          const isSelected = selectedPlan === planKey;
          const popular = isPopular(planKey);

          return (
            <Card
              key={planKey}
              className={`relative transition-all duration-300 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${popular ? 'border-primary' : ''}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(planKey)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {planKey === 'FREE' && 'Perfect for trying out the service'}
                  {planKey === 'PRO' && 'Best for regular users'}
                  {planKey === 'ENTERPRISE' && 'For power users and businesses'}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(planKey)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full ${
                    popular
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                  variant={popular ? 'default' : 'secondary'}
                >
                  {loading ? (
                    'Processing...'
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : planKey === 'FREE' ? (
                    'Get Started'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>

                {isCurrentPlan && (
                  <div className="mt-2 text-center">
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All plans include secure local processing and no data collection.</p>
        <p>Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
}
