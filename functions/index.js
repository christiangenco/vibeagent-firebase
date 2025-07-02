const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  return `+${cleaned}`;
}

// === USERS ===
app.get('/api/users/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.params.phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    
    const userDoc = await db.collection('users').doc(phoneNumber).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = { id: userDoc.id, ...userDoc.data() };
    
    const households = await Promise.all(
      (user.household_ids || []).map(id => 
        db.collection('households').doc(id).get()
          .then(doc => doc.exists ? { id: doc.id, ...doc.data() } : null)
          .catch(() => null)
      )
    );
    
    const activeJobsSnapshot = await db.collection('jobs')
      .where('user_id', '==', phoneNumber)
      .where('status', 'in', ['open', 'in_progress', 'awaiting_user'])
      .get();
    
    const activeJobs = activeJobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({
      user,
      households: households.filter(h => h !== null),
      activeJobs
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.params.phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    
    const userData = {
      ...req.body,
      phone: phoneNumber,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(phoneNumber).set(userData, { merge: true });
    
    res.json({ id: phoneNumber, ...userData });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.body.phone);
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const userData = {
      ...req.body,
      phone: phoneNumber,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(phoneNumber).set(userData);
    
    res.status(201).json({ id: phoneNumber, ...userData });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === HOUSEHOLDS ===
app.get('/api/households/:householdId', async (req, res) => {
  try {
    const doc = await db.collection('households').doc(req.params.householdId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Household not found' });
    }
    
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/households/:householdId', async (req, res) => {
  try {
    const { householdId } = req.params;
    const householdData = {
      ...req.body,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('households').doc(householdId).set(householdData, { merge: true });
    
    res.json({ id: householdId, ...householdData });
  } catch (error) {
    console.error('Error updating household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/households', async (req, res) => {
  try {
    const householdData = {
      ...req.body,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('households').add(householdData);
    
    res.status(201).json({ id: docRef.id, ...householdData });
  } catch (error) {
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === JOBS ===
app.get('/api/jobs/:jobId', async (req, res) => {
  try {
    const doc = await db.collection('jobs').doc(req.params.jobId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = {
      ...req.body,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('jobs').doc(jobId).set(jobData, { merge: true });
    
    res.json({ id: jobId, ...jobData });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      status: req.body.status || 'open',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (!jobData.household_id || !jobData.user_id || !jobData.title) {
      return res.status(400).json({ 
        error: 'Missing required fields: household_id, user_id, and title are required' 
      });
    }
    
    const docRef = await db.collection('jobs').add(jobData);
    
    res.status(201).json({ id: docRef.id, ...jobData });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

exports.api = functions.https.onRequest(app);

// Test function that saves request data to Firestore
exports.test = functions.https.onRequest(async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }
  
  try {
    const testData = {
      queryParams: request.query,
      body: request.body,
      method: request.method,
      headers: request.headers,
      url: request.url,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('tests').add(testData);
    
    response.status(200).json({
      id: docRef.id,
      ...testData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving test data:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});