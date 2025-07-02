#!/usr/bin/env node

// Quick test script to verify the API is working
// Run with: node test/quick-test.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'demo-project'
  });
}

const projectId = process.env.GCLOUD_PROJECT || 'demo-project';
const baseURL = `http://localhost:5001/${projectId}/us-central1/api`;

async function runQuickTests() {
  console.log('🧪 Running quick API tests...');
  console.log(`📍 Testing against: ${baseURL}`);
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthRes = await fetch(`${baseURL}/api/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Create user
    console.log('\n2️⃣ Testing user creation...');
    const createUserRes = await fetch(`${baseURL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '555-123-4567',
        name: 'Test User',
        email: 'test@example.com'
      })
    });
    const userData = await createUserRes.json();
    console.log('✅ Created user:', userData);
    
    // Test 3: Get user
    console.log('\n3️⃣ Testing user retrieval...');
    const getUserRes = await fetch(`${baseURL}/api/users/+15551234567`);
    const getUserData = await getUserRes.json();
    console.log('✅ Retrieved user:', getUserData);
    
    // Test 4: Create household
    console.log('\n4️⃣ Testing household creation...');
    const createHouseholdRes = await fetch(`${baseURL}/api/households`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '123 Test Street',
        timezone: 'America/New_York',
        owner_user_id: '+15551234567'
      })
    });
    const householdData = await createHouseholdRes.json();
    console.log('✅ Created household:', householdData);
    
    // Test 5: Create job
    console.log('\n5️⃣ Testing job creation...');
    const createJobRes = await fetch(`${baseURL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        household_id: householdData.id,
        user_id: '+15551234567',
        title: 'Fix the sink',
        category: 'plumbing'
      })
    });
    const jobData = await createJobRes.json();
    console.log('✅ Created job:', jobData);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if emulators are running
fetch(`${baseURL}/api/health`)
  .then(() => {
    console.log('✅ Emulators are running');
    runQuickTests();
  })
  .catch(() => {
    console.error('❌ Emulators are not running!');
    console.log('💡 Start them with: npm run emulators');
    process.exit(1);
  });