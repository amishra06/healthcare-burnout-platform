const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Test data
const testManager = {
  name: 'Test Manager',
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('Authentication Routes', () => {
  beforeAll(async () => {
    // Ensure database is set up
    const { setupDatabase } = require('../utils/database');
    await setupDatabase();

    // Create test manager
    const hashedPassword = await bcrypt.hash(testManager.password, 10);
    const insertQuery = db.prepare(`
      INSERT OR REPLACE INTO managers (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    insertQuery.run(testManager.name, testManager.email, hashedPassword);
  });

  afterAll(() => {
    // Clean up test data
    const deleteQuery = db.prepare('DELETE FROM managers WHERE email = ?');
    deleteQuery.run(testManager.email);
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testManager.email,
          password: testManager.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.manager.email).toBe(testManager.email);
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: testManager.password
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testManager.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testManager.password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/verify', () => {
    let authToken;

    beforeAll(async () => {
      // Get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testManager.email,
          password: testManager.password
        });
      authToken = loginResponse.body.data.token;
    });

    test('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.manager.email).toBe(testManager.email);
    });

    test('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});