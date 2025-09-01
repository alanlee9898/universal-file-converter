#!/usr/bin/env node

/**
 * Stripe Integration Test Script
 * 
 * This script tests the Stripe payment integration endpoints
 * to ensure everything is working correctly.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

console.log('🧪 Starting Stripe Integration Tests...\n');

// Test utilities
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, path, method = 'GET', data = null, expectedStatus = 200) {
  try {
    console.log(`🔍 Testing ${name}...`);
    const result = await makeRequest(path, method, data);
    
    if (result.status === expectedStatus) {
      console.log(`✅ ${name} - Status: ${result.status}`);
      return { success: true, data: result.data };
    } else {
      console.log(`❌ ${name} - Expected: ${expectedStatus}, Got: ${result.status}`);
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      return { success: false, data: result.data };
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const results = [];

  // Test 1: Create Payment Intent
  console.log('📋 Test 1: Create Payment Intent');
  const paymentIntentTest = await testEndpoint(
    'Create Payment Intent',
    '/api/stripe/create-payment-intent',
    'POST',
    {
      priceId: 'price_test_123',
      plan: 'PRO'
    }
  );
  results.push(paymentIntentTest);

  // Test 2: Create Subscription
  console.log('\n📋 Test 2: Create Subscription');
  const subscriptionTest = await testEndpoint(
    'Create Subscription',
    '/api/stripe/create-subscription',
    'POST',
    {
      priceId: 'price_test_123',
      plan: 'PRO',
      customerEmail: 'test@example.com',
      paymentMethodId: 'pm_card_visa'
    }
  );
  results.push(subscriptionTest);

  // Test 3: Get Subscription Status
  console.log('\n📋 Test 3: Get Subscription Status');
  const statusTest = await testEndpoint(
    'Get Subscription Status',
    '/api/stripe/subscription-status?customerId=test_customer',
    'GET'
  );
  results.push(statusTest);

  // Test 4: Cancel Subscription
  console.log('\n📋 Test 4: Cancel Subscription');
  const cancelTest = await testEndpoint(
    'Cancel Subscription',
    '/api/stripe/cancel-subscription',
    'POST',
    {
      subscriptionId: 'sub_test_123',
      cancelAtPeriodEnd: true
    }
  );
  results.push(cancelTest);

  // Test 5: Billing Portal
  console.log('\n📋 Test 5: Billing Portal');
  const billingTest = await testEndpoint(
    'Create Billing Portal Session',
    '/api/stripe/billing-portal',
    'POST',
    {
      customerId: 'cus_test_123'
    }
  );
  results.push(billingTest);

  // Test 6: Webhook Endpoint
  console.log('\n📋 Test 6: Webhook Endpoint');
  const webhookTest = await testEndpoint(
    'Webhook Endpoint',
    '/api/stripe/webhook',
    'POST',
    {
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_test' } }
    },
    400 // Expected to fail due to signature verification
  );
  results.push(webhookTest);

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Your Stripe integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the setup guide and try again.');
  }

  return { passed, total, results };
}

// Validate environment setup
function validateEnvironment() {
  console.log('🔧 Validating Environment Setup...\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease check your .env.local file and the setup guide.');
    return false;
  }

  console.log('✅ All required environment variables are set');
  
  // Check if keys look valid
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!pubKey.startsWith('pk_')) {
    console.log('⚠️  Publishable key should start with "pk_"');
  }
  
  if (!secretKey.startsWith('sk_')) {
    console.log('⚠️  Secret key should start with "sk_"');
  }
  
  if (pubKey.includes('test') && secretKey.includes('test')) {
    console.log('✅ Using test keys (recommended for development)');
  } else if (!pubKey.includes('test') && !secretKey.includes('test')) {
    console.log('⚠️  Using live keys - make sure this is intentional');
  } else {
    console.log('❌ Mismatched key types (one test, one live)');
    return false;
  }

  return true;
}

// Main execution
async function main() {
  console.log('🚀 Universal File Converter - Stripe Integration Test\n');
  
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  console.log('\n🧪 Running API Tests...\n');
  
  try {
    const testResults = await runTests();
    
    // Write results to file
    const resultsFile = path.join(__dirname, '../test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
    
    process.exit(testResults.passed === testResults.total ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, validateEnvironment };
