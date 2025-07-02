const request = require('supertest');
const admin = require('firebase-admin');
const { 
  getEmulatorUrl, 
  clearTestData, 
  createTestUser, 
  createTestHousehold,
  createTestJob 
} = require('./test-helpers');

describe('Vibeagent API Tests', () => {
  let baseURL;
  let db;

  beforeAll(() => {
    // Initialize admin SDK for testing
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'demo-project'
      });
    }
    db = admin.firestore();
    baseURL = getEmulatorUrl();
    console.log('Testing against:', baseURL);
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe('Health Check', () => {
    test('GET /api/health should return ok status', async () => {
      const response = await request(baseURL)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('User Endpoints', () => {
    const testPhone = '+11234567890';
    const testUser = {
      name: 'Test User',
      email: 'test@example.com'
    };

    test('GET /api/users/:phoneNumber should return 404 for non-existent user', async () => {
      const response = await request(baseURL)
        .get(`/api/users/${testPhone}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('POST /api/users should create new user', async () => {
      const response = await request(baseURL)
        .post('/api/users')
        .send({
          ...testUser,
          phone: '(123) 456-7890' // Test normalization
        })
        .expect(201);

      expect(response.body.id).toBe(testPhone);
      expect(response.body.name).toBe(testUser.name);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.phone).toBe(testPhone);
    });

    test('PUT /api/users/:phoneNumber should create/update user', async () => {
      const response = await request(baseURL)
        .put(`/api/users/1234567890`) // Test without country code
        .send(testUser)
        .expect(200);

      expect(response.body.id).toBe(testPhone);
      expect(response.body.phone).toBe(testPhone);
    });

    test('GET /api/users/:phoneNumber should return user with households and jobs', async () => {
      // Create test data
      await db.collection('users').doc(testPhone).set({
        ...testUser,
        phone: testPhone,
        household_ids: ['house1']
      });

      await db.collection('households').doc('house1').set({
        address: '123 Main St',
        timezone: 'America/New_York'
      });

      await db.collection('jobs').add({
        user_id: testPhone,
        household_id: 'house1',
        title: 'Test Job',
        status: 'open'
      });

      const response = await request(baseURL)
        .get(`/api/users/${testPhone}`)
        .expect(200);

      expect(response.body.user.id).toBe(testPhone);
      expect(response.body.households).toHaveLength(1);
      expect(response.body.households[0].address).toBe('123 Main St');
      expect(response.body.activeJobs).toHaveLength(1);
      expect(response.body.activeJobs[0].title).toBe('Test Job');
    });

    test('Phone number normalization should handle various formats', async () => {
      const formats = [
        '1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '11234567890',
        '+11234567890'
      ];

      for (const format of formats) {
        const response = await request(baseURL)
          .put(`/api/users/${format}`)
          .send({ name: 'Test' })
          .expect(200);

        expect(response.body.id).toBe(testPhone);
        expect(response.body.phone).toBe(testPhone);
      }
    });
  });

  describe('Household Endpoints', () => {
    const testHousehold = {
      address: '456 Oak Ave',
      timezone: 'America/Chicago',
      owner_user_id: '+11234567890'
    };

    test('POST /api/households should create new household', async () => {
      const response = await request(baseURL)
        .post('/api/households')
        .send(testHousehold)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.address).toBe(testHousehold.address);
      expect(response.body.timezone).toBe(testHousehold.timezone);
    });

    test('GET /api/households/:id should return household', async () => {
      const docRef = await db.collection('households').add(testHousehold);

      const response = await request(baseURL)
        .get(`/api/households/${docRef.id}`)
        .expect(200);

      expect(response.body.id).toBe(docRef.id);
      expect(response.body.address).toBe(testHousehold.address);
    });

    test('PUT /api/households/:id should update household', async () => {
      const updatedData = { address: '789 Pine St' };

      const response = await request(baseURL)
        .put('/api/households/house123')
        .send(updatedData)
        .expect(200);

      expect(response.body.id).toBe('house123');
      expect(response.body.address).toBe(updatedData.address);
    });

    test('GET /api/households/:id should return 404 for non-existent', async () => {
      const response = await request(baseURL)
        .get('/api/households/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Household not found');
    });
  });

  describe('Job Endpoints', () => {
    const testJob = {
      household_id: 'house123',
      user_id: '+11234567890',
      title: 'Fix plumbing',
      category: 'plumbing'
    };

    test('POST /api/jobs should create new job', async () => {
      const response = await request(baseURL)
        .post('/api/jobs')
        .send(testJob)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe(testJob.title);
      expect(response.body.status).toBe('open');
    });

    test('POST /api/jobs should validate required fields', async () => {
      const response = await request(baseURL)
        .post('/api/jobs')
        .send({ title: 'Incomplete job' })
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    test('GET /api/jobs/:id should return job', async () => {
      const docRef = await db.collection('jobs').add({
        ...testJob,
        status: 'in_progress'
      });

      const response = await request(baseURL)
        .get(`/api/jobs/${docRef.id}`)
        .expect(200);

      expect(response.body.id).toBe(docRef.id);
      expect(response.body.title).toBe(testJob.title);
    });

    test('PUT /api/jobs/:id should update job', async () => {
      const response = await request(baseURL)
        .put('/api/jobs/job123')
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.id).toBe('job123');
      expect(response.body.status).toBe('completed');
    });

    test('GET /api/jobs/:id should return 404 for non-existent', async () => {
      const response = await request(baseURL)
        .get('/api/jobs/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('Error Handling', () => {
    test('Invalid endpoints should return 404', async () => {
      const response = await request(baseURL)
        .get('/api/invalid')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    });

    test('Invalid phone numbers should return 400', async () => {
      const response = await request(baseURL)
        .get('/api/users/invalid-phone')
        .expect(400);

      expect(response.body.error).toBe('Invalid phone number');
    });
  });
});