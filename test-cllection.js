#!/usr/bin/env node

/**
 * Test Script for Production Collection Endpoint
 * 
 * This script tests the payment collection initiation endpoint
 * on the production HexAI Payment Gateway.
 * 
 * Usage: node test-collection.js
 */

// const API_KEY = 'hexai_bx6hn9kq46r'; // HexAI
// const API_KEY = 'hexai_pba1qb16rxe'; // LE.SS
const API_KEY = 'hexai_d3hau0k0vws'; //Base10
const API_BASE_URL = 'https://hpg-backend-6kzwb.ondigitalocean.app/api/v1';
const AMOUNT = '10.00'; // D30.00 in Dalasi
const CURRENCY = 'GMD';

// Generate unique client reference
const CLIENT_REFERENCE = `TEST-${Date.now()}`;

// Test payload
const payload = {
  amount: AMOUNT,
  currency: CURRENCY,
  client_reference: CLIENT_REFERENCE,
  success_url: 'https://base10.gm/',
  error_url: 'https://hpg-frontend-m3vhq.ondigitalocean.app/payment/error',
  customer_name: 'Test Customer',
  customer_mobile: '+2203456789'
};

console.log('🧪 Testing Production Collection Endpoint\n');
console.log('📋 Configuration:');
console.log(`   API URL: ${API_BASE_URL}/collections/initiate`);
console.log(`   Amount: ${AMOUNT} ${CURRENCY}`);
console.log(`   Reference: ${CLIENT_REFERENCE}`);
console.log(`   API Key: ${API_KEY.substring(0, 15)}...`);
console.log('\n📤 Initiating payment collection...\n');

fetch(`${API_BASE_URL}/collections/initiate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'x-hexai-key': API_KEY
  },
  body: JSON.stringify(payload)
})
  .then(async response => {
    const data = await response.json();
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);
    
    if (response.ok) {
      console.log('✅ SUCCESS! Payment initiated\n');
      console.log('📦 Response Data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data?.redirect_url) {
        console.log('\n🔗 Payment URL:');
        console.log(data.data.redirect_url);
        console.log('\n💡 Open this URL to complete the payment');
      }
      
      console.log('\n📝 Transaction Details:');
      console.log(`   Transaction ID: ${data.data?.transaction_id}`);
      console.log(`   Client Reference: ${data.data?.client_reference}`);
      console.log(`   Gross Amount: D${data.data?.amount}`);
      console.log(`   Commission: D${data.data?.commission}`);
      console.log(`   Net Amount: D${data.data?.net_amount}`);
      console.log(`   Status: ${data.data?.status}`);
    } else {
      console.log('❌ ERROR! Payment initiation failed\n');
      console.log('📦 Error Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (response.status === 401) {
        console.log('\n⚠️  Authentication failed. Please check the API key.');
      } else if (response.status === 400) {
        console.log('\n⚠️  Invalid request. Check the payload structure.');
      }
    }
  })
  .catch(error => {
    console.log('❌ NETWORK ERROR!\n');
    console.error('Error details:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  });
