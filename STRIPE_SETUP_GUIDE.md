# Stripe Payment Integration Setup Guide

This guide will help you set up and test the Stripe payment integration for the Universal File Converter app.

## Prerequisites

1. **Stripe Account**: Create a free account at [stripe.com](https://stripe.com)
2. **Environment Variables**: Set up your Stripe keys
3. **Webhook Endpoint**: Configure webhook handling

## Step 1: Get Your Stripe Keys

1. Log into your Stripe Dashboard
2. Go to **Developers** > **API Keys**
3. Copy your **Publishable key** and **Secret key** (use test keys for development)

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy from .env.local.example and fill in your actual keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Create Stripe Products and Prices

In your Stripe Dashboard:

1. Go to **Products** > **Add Product**
2. Create products for each plan:

### Pro Plan
- Name: "Universal File Converter Pro"
- Price: $9.99/month
- Copy the Price ID and update `lib/stripe.ts`

### Enterprise Plan
- Name: "Universal File Converter Enterprise"  
- Price: $29.99/month
- Copy the Price ID and update `lib/stripe.ts`

## Step 4: Update Price IDs

Edit `lib/stripe.ts` and replace the placeholder price IDs:

```typescript
export const PRICING_PLANS = {
  // ... existing code
  PRO: {
    // ... existing fields
    priceId: 'price_1234567890abcdef', // Replace with your actual Pro price ID
  },
  ENTERPRISE: {
    // ... existing fields  
    priceId: 'price_0987654321fedcba', // Replace with your actual Enterprise price ID
  }
};
```

## Step 5: Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your `.env.local`

## Step 6: Test the Integration

### Testing Locally

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000
3. You should see the usage tracker and upgrade options

### Test Payment Flow

1. Click "Upgrade" or try to exceed free plan limits
2. Select a paid plan (Pro or Enterprise)
3. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`

### Test Card Details
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## Step 7: Test Webhook Handling

For local webhook testing, use Stripe CLI:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret from the CLI output to your `.env.local`

## Features to Test

### ✅ Free Plan Limits
- [ ] Upload files and verify 5 conversions/day limit
- [ ] Try to upload file larger than 10MB
- [ ] Verify upgrade prompt appears when limits are reached

### ✅ Payment Flow
- [ ] Click upgrade and select Pro plan
- [ ] Complete payment with test card
- [ ] Verify subscription is created in Stripe Dashboard
- [ ] Check that limits are updated in the app

### ✅ Subscription Management
- [ ] Visit `/dashboard` page
- [ ] View subscription details and usage statistics
- [ ] Test billing portal link (manage payment methods)
- [ ] Test subscription cancellation

### ✅ Usage Tracking
- [ ] Perform conversions and verify usage updates
- [ ] Check daily usage resets at midnight
- [ ] Verify weekly usage chart in dashboard

### ✅ Premium Features
- [ ] Upload larger files with Pro/Enterprise plan
- [ ] Verify unlimited conversions work
- [ ] Test advanced settings access

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Check that your `.env.local` file has the correct Stripe keys
   - Ensure you're using test keys for development

2. **Webhook Signature Verification Failed**
   - Verify webhook secret in `.env.local` matches Stripe Dashboard
   - For local testing, use Stripe CLI webhook secret

3. **Payment Intent Creation Failed**
   - Check that price IDs in `lib/stripe.ts` match your Stripe products
   - Verify API keys have correct permissions

4. **CORS Errors**
   - Ensure `NEXT_PUBLIC_APP_URL` is set correctly
   - Check that webhook URL is accessible

### Debug Mode

Enable debug logging by adding to your `.env.local`:
```bash
STRIPE_DEBUG=true
```

## Production Deployment

Before going live:

1. **Switch to Live Keys**: Replace test keys with live keys
2. **Update Webhook URL**: Point to your production domain
3. **Test with Real Cards**: Use small amounts for testing
4. **Enable Billing Portal**: Configure in Stripe Dashboard
5. **Set Up Monitoring**: Monitor webhook delivery and payment failures

## Security Considerations

- Never expose secret keys in client-side code
- Always verify webhook signatures
- Use HTTPS in production
- Implement proper error handling
- Log payment events for debugging

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: Available in Dashboard
- Test your integration thoroughly before going live
