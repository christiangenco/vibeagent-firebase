# Testing Guide for Vibeagent API

## Setup

All test dependencies are already installed. The test suite uses:
- **Jest** - Testing framework
- **Supertest** - HTTP assertions
- **Firebase Emulators** - Local Firebase services

## Running Tests

### Method 1: Automatic (Recommended)
```bash
npm run test:emulator
```
This automatically starts emulators, runs tests, and shuts down.

### Method 2: Manual
1. Start emulators in one terminal:
   ```bash
   npm run emulators
   ```

2. Run tests in another terminal:
   ```bash
   npm test
   ```

### Method 3: Quick Test
```bash
# Start emulators first, then:
node test/quick-test.js
```

## Test Scripts

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run emulators` - Start Firebase emulators
- `npm run test:emulator` - Run tests with automatic emulator management

## Test Structure

```
test/
├── api.test.js       # Main API test suite
├── test-helpers.js   # Helper functions for tests
├── quick-test.js     # Quick integration test
└── setup.js          # Jest setup file
```

## Writing Tests

Example test:
```javascript
test('POST /api/users should create new user', async () => {
  const response = await request(baseURL)
    .post('/api/users')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-123-4567'
    })
    .expect(201);

  expect(response.body.id).toBe('+15551234567');
  expect(response.body.name).toBe('Test User');
});
```

## Emulator URLs

- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

## Troubleshooting

1. **Port conflicts**: Kill processes using the ports:
   ```bash
   lsof -ti:5001,8080,5000,4000 | xargs kill -9
   ```

2. **Emulators not starting**: Check Firebase CLI is installed:
   ```bash
   firebase --version
   ```

3. **Tests timing out**: Increase timeout in `test/setup.js`

## Best Practices

1. Clear test data between tests
2. Use test helpers for common operations
3. Test both success and error cases
4. Verify phone number normalization
5. Check response status codes