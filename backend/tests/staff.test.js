const request = require('supertest');
const express = require('express');
const staffRoutes = require('../routes/staff');
const authRoutes = require('../routes/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);

// Test data
const testManager = {
  name: 'Test Manager',
  email: 'test@example.com',
  password: 'testpassword123'
};

const testStaff = {
  name: 'John Doe',
  email: 'john.doe@hospital.com',
  department: 'ICU',
  role: 'Nurse',
  hire_date: '2023-01-15'
};

describe('Staff Routes', () => {
  let authToken;
  let createdStaffId;

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

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testManager.email,
        password: testManager.password
      });
    authToken = loginResponse.body.data.token;
  });

  afterAll(() => {
    // Clean up test data
    if (createdStaffId) {
      const deleteStaffQuery = db.prepare('DELETE FROM staff WHERE id = ?');
      deleteStaffQuery.run(createdStaffId);
    }
    const deleteManagerQuery = db.prepare('DELETE FROM managers WHERE email = ?');
    deleteManagerQuery.run(testManager.email);
  });

  describe('POST /api/staff', () => {
    test('should create new staff member', async () => {
      const response = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testStaff);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.name).toBe(testStaff.name);
      expect(response.body.data.staff.email).toBe(testStaff.email);
      expect(response.body.data.staff.department).toBe(testStaff.department);

      createdStaffId = response.body.data.staff.id;
    });

    test('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testStaff);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test',
          // missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate department values', async () => {
      const response = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testStaff,
          email: 'different@email.com',
          department: 'InvalidDepartment'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/staff', () => {
    test('should get staff list', async () => {
      const response = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.staff)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter by department', async () => {
      const response = await request(app)
        .get('/api/staff?department=ICU')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // All returned staff should be from ICU department
      response.body.data.staff.forEach(staff => {
        expect(staff.department).toBe('ICU');
      });
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/staff');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('GET /api/staff/:id', () => {
    test('should get staff details', async () => {
      const response = await request(app)
        .get(`/api/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.id).toBe(createdStaffId);
      expect(response.body.data.workHours).toBeDefined();
      expect(response.body.data.riskHistory).toBeDefined();
    });

    test('should return 404 for non-existent staff', async () => {
      const response = await request(app)
        .get('/api/staff/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STAFF_NOT_FOUND');
    });
  });

  describe('PUT /api/staff/:id', () => {
    test('should update staff member', async () => {
      const updates = {
        name: 'John Updated',
        role: 'Senior Nurse'
      };

      const response = await request(app)
        .put(`/api/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.name).toBe(updates.name);
      expect(response.body.data.staff.role).toBe(updates.role);
    });

    test('should return 404 for non-existent staff', async () => {
      const response = await request(app)
        .put('/api/staff/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STAFF_NOT_FOUND');
    });
  });
});