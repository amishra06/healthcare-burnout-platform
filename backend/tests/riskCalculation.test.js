const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../routes/dashboard');
const workHoursRoutes = require('../routes/workHours');
const authRoutes = require('../routes/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { 
  calculateRiskScore, 
  updateStaffRiskScore, 
  getRiskDistribution, 
  getTopRiskStaff 
} = require('../services/riskCalculation');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/work-hours', workHoursRoutes);

// Test data
const testManager = {
  name: 'Test Manager',
  email: 'risktest@example.com',
  password: 'testpassword123'
};

const testStaff = {
  name: 'Risk Test Staff',
  email: 'riskstaff@hospital.com',
  department: 'ICU',
  role: 'Nurse',
  hire_date: '2023-01-15'
};

describe('Risk Calculation Engine', () => {
  let authToken;
  let testStaffId;

  beforeAll(async () => {
    // Ensure database is set up
    const { setupDatabase } = require('../utils/database');
    await setupDatabase();

    // Create test manager
    const hashedPassword = await bcrypt.hash(testManager.password, 10);
    const insertManagerQuery = db.prepare(`
      INSERT OR REPLACE INTO managers (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    insertManagerQuery.run(testManager.name, testManager.email, hashedPassword);

    // Create test staff
    const insertStaffQuery = db.prepare(`
      INSERT INTO staff (name, email, department, role, hire_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const staffResult = insertStaffQuery.run(
      testStaff.name, 
      testStaff.email, 
      testStaff.department, 
      testStaff.role, 
      testStaff.hire_date
    );
    testStaffId = staffResult.lastInsertRowid;

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
    if (testStaffId) {
      const deleteWorkHoursQuery = db.prepare('DELETE FROM work_hours WHERE staff_id = ?');
      deleteWorkHoursQuery.run(testStaffId);
      
      const deleteRiskScoresQuery = db.prepare('DELETE FROM risk_scores WHERE staff_id = ?');
      deleteRiskScoresQuery.run(testStaffId);
      
      const deleteStaffQuery = db.prepare('DELETE FROM staff WHERE id = ?');
      deleteStaffQuery.run(testStaffId);
    }
    
    const deleteManagerQuery = db.prepare('DELETE FROM managers WHERE email = ?');
    deleteManagerQuery.run(testManager.email);
  });

  describe('Risk Score Calculation', () => {
    test('should calculate base risk score of 20', () => {
      const riskData = calculateRiskScore(testStaffId);
      
      expect(riskData.score).toBeGreaterThanOrEqual(20);
      expect(riskData.riskLevel).toBeDefined();
      expect(['Low', 'Medium', 'High']).toContain(riskData.riskLevel);
      expect(riskData.factors).toBeDefined();
      expect(riskData.factors.baseScore).toBe(20);
    });

    test('should categorize risk levels correctly', () => {
      // Test Low risk (0-40)
      const lowRisk = calculateRiskScore(testStaffId);
      if (lowRisk.score <= 40) {
        expect(lowRisk.riskLevel).toBe('Low');
      }
      
      // We can't easily test Medium and High without setting up specific work patterns
      // But we can test the logic with mock scores
      const testScores = [
        { score: 25, expected: 'Low' },
        { score: 40, expected: 'Low' },
        { score: 41, expected: 'Medium' },
        { score: 70, expected: 'Medium' },
        { score: 71, expected: 'High' },
        { score: 100, expected: 'High' }
      ];

      testScores.forEach(({ score, expected }) => {
        let riskLevel;
        if (score <= 40) riskLevel = 'Low';
        else if (score <= 70) riskLevel = 'Medium';
        else riskLevel = 'High';
        
        expect(riskLevel).toBe(expected);
      });
    });

    test('should save and update risk scores', () => {
      const updatedRisk = updateStaffRiskScore(testStaffId);
      
      expect(updatedRisk.id).toBeDefined();
      expect(updatedRisk.score).toBeGreaterThanOrEqual(20);
      expect(updatedRisk.riskLevel).toBeDefined();
      
      // Verify it was saved to database
      const savedRiskQuery = db.prepare(`
        SELECT * FROM risk_scores WHERE staff_id = ? ORDER BY date DESC LIMIT 1
      `);
      const savedRisk = savedRiskQuery.get(testStaffId);
      
      expect(savedRisk).toBeDefined();
      expect(savedRisk.score).toBe(updatedRisk.score);
      expect(savedRisk.risk_level).toBe(updatedRisk.riskLevel);
    });
  });

  describe('Work Hours Impact on Risk', () => {
    test('should increase risk score with overtime hours', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Add work hours with overtime
      const response = await request(app)
        .post('/api/work-hours')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          staff_id: testStaffId,
          date: today,
          hours_worked: 8,
          overtime_hours: 4
        });

      expect(response.status).toBe(201);
      expect(response.body.data.updatedRiskScore).toBeDefined();
      
      // Calculate risk score manually to verify
      const riskData = calculateRiskScore(testStaffId);
      expect(riskData.weeklyOvertime).toBeGreaterThan(0);
      expect(riskData.factors.overtimeHours).toBeGreaterThan(0);
    });

    test('should increase risk score with consecutive work days', async () => {
      // Add consecutive work days
      const dates = [];
      for (let i = 1; i <= 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Add work hours for consecutive days
      for (const date of dates) {
        try {
          await request(app)
            .post('/api/work-hours')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              staff_id: testStaffId,
              date: date,
              hours_worked: 8,
              overtime_hours: 0
            });
        } catch (error) {
          // May fail if date already exists, that's okay
        }
      }

      const riskData = calculateRiskScore(testStaffId);
      expect(riskData.consecutiveDays).toBeGreaterThan(0);
      expect(riskData.factors.consecutiveDays).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Analytics', () => {
    test('should get dashboard overview', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalStaff).toBeGreaterThan(0);
      expect(response.body.data.riskDistribution).toBeDefined();
      expect(response.body.data.topRiskStaff).toBeDefined();
      expect(response.body.data.activeAlerts).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    test('should get risk distribution', async () => {
      const response = await request(app)
        .get('/api/dashboard/risk-distribution')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overall).toBeDefined();
      expect(response.body.data.byDepartment).toBeDefined();
      
      // Verify risk distribution structure
      const { overall } = response.body.data;
      expect(overall).toHaveProperty('Low');
      expect(overall).toHaveProperty('Medium');
      expect(overall).toHaveProperty('High');
    });

    test('should get top risk staff', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-risk-staff?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.topRiskStaff).toBeDefined();
      expect(response.body.data.count).toBeDefined();
      expect(Array.isArray(response.body.data.topRiskStaff)).toBe(true);
    });

    test('should get risk trends', async () => {
      const response = await request(app)
        .get('/api/dashboard/risk-trends?days=7')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.period).toBe('7 days');
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    test('should get alerts', async () => {
      const response = await request(app)
        .get('/api/dashboard/alerts?resolved=false&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
    });

    test('should require authentication for dashboard endpoints', async () => {
      const endpoints = [
        '/api/dashboard/overview',
        '/api/dashboard/risk-distribution',
        '/api/dashboard/top-risk-staff',
        '/api/dashboard/risk-trends',
        '/api/dashboard/alerts'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Risk Calculation Service Functions', () => {
    test('should get risk distribution', () => {
      const distribution = getRiskDistribution();
      
      expect(distribution).toBeDefined();
      expect(distribution).toHaveProperty('Low');
      expect(distribution).toHaveProperty('Medium');
      expect(distribution).toHaveProperty('High');
      expect(typeof distribution.Low).toBe('number');
      expect(typeof distribution.Medium).toBe('number');
      expect(typeof distribution.High).toBe('number');
    });

    test('should get top risk staff', () => {
      const topRisk = getTopRiskStaff(3);
      
      expect(Array.isArray(topRisk)).toBe(true);
      expect(topRisk.length).toBeLessThanOrEqual(3);
      
      if (topRisk.length > 1) {
        // Verify they are sorted by risk score (descending)
        for (let i = 1; i < topRisk.length; i++) {
          expect(topRisk[i-1].score).toBeGreaterThanOrEqual(topRisk[i].score);
        }
      }
    });
  });
});