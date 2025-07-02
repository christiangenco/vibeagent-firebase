const admin = require('firebase-admin');

// Helper to get the correct emulator URL based on project configuration
function getEmulatorUrl() {
  const projectId = process.env.GCLOUD_PROJECT || 'demo-project';
  const functionsPort = process.env.FUNCTIONS_EMULATOR_PORT || '5001';
  return `http://localhost:${functionsPort}/${projectId}/us-central1/api`;
}

// Helper to clear all test data
async function clearTestData() {
  const db = admin.firestore();
  const collections = ['users', 'households', 'jobs', 'tests'];
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

// Helper to create test data
async function createTestUser(phoneNumber, data = {}) {
  const db = admin.firestore();
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: phoneNumber,
    household_ids: [],
    ...data
  };
  
  await db.collection('users').doc(phoneNumber).set(userData);
  return userData;
}

async function createTestHousehold(id, data = {}) {
  const db = admin.firestore();
  const householdData = {
    address: '123 Test St',
    timezone: 'America/New_York',
    owner_user_id: '+11234567890',
    user_ids: ['+11234567890'],
    ...data
  };
  
  await db.collection('households').doc(id).set(householdData);
  return { id, ...householdData };
}

async function createTestJob(data = {}) {
  const db = admin.firestore();
  const jobData = {
    household_id: 'test-household',
    user_id: '+11234567890',
    title: 'Test Job',
    status: 'open',
    category: 'general',
    ...data
  };
  
  const docRef = await db.collection('jobs').add(jobData);
  return { id: docRef.id, ...jobData };
}

module.exports = {
  getEmulatorUrl,
  clearTestData,
  createTestUser,
  createTestHousehold,
  createTestJob
};