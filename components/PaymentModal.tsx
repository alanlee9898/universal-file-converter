'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PricingPlans } from './PricingPlans';
import { CheckoutForm } from './CheckoutForm';
import { PricingPlan } from '@/lib/stripe';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plan: PricingPlan) => void;
  currentPlan?: PricingPlan;
  triggerReason?: 'upgrade' | 'limit_reached' | 'premium_feature';
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentPlan = 'FREE',
  triggerReason = 'upgrade'
}: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    if (plan === 'FREE') {
      onSuccess(plan);
      onClose();
    } else {
      setShowCheckout(true);
    }
  };

  const handleCheckoutSuccess = () => {
    if (selectedPlan) {
      onSuccess(selectedPlan);
    }
    onClose();
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  const handleClose = () => {
    onClose();
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  const getModalTitle = () => {
    switch (triggerReason) {
      case 'limit_reached':
        return 'Daily Limit Reached';
      case 'premium_feature':
        return 'Premium Feature';
      default:
        return 'Upgrade Your Plan';
    }
  };

  const getModalDescription = () => {
    switch (triggerReason) {
      case 'limit_reached':
        return 'You\'ve reached your daily conversion limit. Upgrade to continue converting files.';
      case 'premium_feature':
        return 'This feature is available for Pro and Enterprise users. Upgrade to unlock advanced capabilities.';
      default:
        return 'Choose a plan that works best for your file conversion needs.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {getModalTitle()}
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            {getModalDescription()}
          </p>
        </DialogHeader>

        <div className="mt-6">
          {showCheckout && selectedPlan ? (
            <div className="flex flex-col items-center">
              <CheckoutForm
                selectedPlan={selectedPlan}
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
              />
            </div>
          ) : (
            <Tabs defaultValue="plans" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="plans">Choose Plan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="plans" className="mt-6">
                <PricingPlans
                  currentPlan={currentPlan}
                  onSelectPlan={handleSelectPlan}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
