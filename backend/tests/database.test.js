/**
 * Database setup and seeding tests
 */

const { initializeDatabase, checkTablesExist, getDatabaseStats, clearDatabase } = require('../utils/database');
const { seedDatabase, needsSeeding } = require('../database/seed');
const db = require('../config/database');

describe('Database Setup and Seeding', () => {
  beforeAll(async () => {
    // Clear database before tests
    clearDatabase();
  });

  afterAll(() => {
    // Clean up after tests
    clearDatabase();
  });

  describe('Database Schema', () => {
    test('should initialize database schema successfully', () => {
      const result = initializeDatabase();
      expect(result).toBe(true);
    });

    test('should have all required tables', () => {
      const tablesExist = checkTablesExist();
      expect(tablesExist).toBe(true);
    });

    test('should have correct table structure', () => {
      // Test managers table
      const managersColumns = db.prepare("PRAGMA table_info(managers)").all();
      const managerColumnNames = managersColumns.map(col => col.name);
      expect(managerColumnNames).toContain('id');
      expect(managerColumnNames).toContain('name');
      expect(managerColumnNames).toContain('email');
      expect(managerColumnNames).toContain('password_hash');

      // Test staff table
      const staffColumns = db.prepare("PRAGMA table_info(staff)").all();
      const staffColumnNames = staffColumns.map(col => col.name);
      expect(staffColumnNames).toContain('id');
      expect(staffColumnNames).toContain('name');
      expect(staffColumnNames).toContain('email');
      expect(staffColumnNames).toContain('department');
      expect(staffColumnNames).toContain('role');
      expect(staffColumnNames).toContain('hire_date');

      // Test work_hours table
      const workHoursColumns = db.prepare("PRAGMA table_info(work_hours)").all();
      const workHoursColumnNames = workHoursColumns.map(col => col.name);
      expect(workHoursColumnNames).toContain('staff_id');
      expect(workHoursColumnNames).toContain('date');
      expect(workHoursColumnNames).toContain('hours_worked');
      expect(workHoursColumnNames).toContain('overtime_hours');

      // Test risk_scores table
      const riskScoresColumns = db.prepare("PRAGMA table_info(risk_scores)").all();
      const riskScoresColumnNames = riskScoresColumns.map(col => col.name);
      expect(riskScoresColumnNames).toContain('staff_id');
      expect(riskScoresColumnNames).toContain('score');
      expect(riskScoresColumnNames).toContain('risk_level');
      expect(riskScoresColumnNames).toContain('factors');

      // Test alerts table
      const alertsColumns = db.prepare("PRAGMA table_info(alerts)").all();
      const alertsColumnNames = alertsColumns.map(col => col.name);
      expect(alertsColumnNames).toContain('staff_id');
      expect(alertsColumnNames).toContain('message');
      expect(alertsColumnNames).toContain('risk_score');
      expect(alertsColumnNames).toContain('resolved');
    });
  });

  describe('Database Seeding', () => {
    test('should detect empty database needs seeding', () => {
      const needs = needsSeeding();
      expect(needs).toBe(true);
    });

    test('should seed database successfully', async () => {
      const result = await seedDatabase();
      expect(result).toBe(true);
    });

    test('should have correct number of records after seeding', () => {
      const stats = getDatabaseStats();
      expect(stats).toBeTruthy();
      expect(stats.managers).toBe(2);
      expect(stats.staff).toBe(15);
      expect(stats.risk_scores).toBe(15);
      expect(stats.work_hours).toBeGreaterThan(100); // Should have lots of work hour records
    });

    test('should have staff distributed across departments', () => {
      const departments = db.prepare(`
        SELECT department, COUNT(*) as count 
        FROM staff 
        GROUP BY department
      `).all();

      expect(departments).toHaveLength(3);
      
      const deptCounts = {};
      departments.forEach(dept => {
        deptCounts[dept.department] = dept.count;
      });

      expect(deptCounts.ICU).toBe(5);
      expect(deptCounts.Emergency).toBe(5);
      expect(deptCounts.General).toBe(5);
    });

    test('should have risk scores with proper levels', () => {
      const riskLevels = db.prepare(`
        SELECT risk_level, COUNT(*) as count 
        FROM risk_scores 
        GROUP BY risk_level
      `).all();

      const levels = riskLevels.map(r => r.risk_level);
      expect(levels).toContain('Low');
      expect(levels).toContain('Medium');
      expect(levels).toContain('High');
    });

    test('should have work hours within valid ranges', () => {
      const invalidHours = db.prepare(`
        SELECT COUNT(*) as count 
        FROM work_hours 
        WHERE hours_worked < 0 OR hours_worked > 24 OR overtime_hours < 0
      `).get();

      expect(invalidHours.count).toBe(0);
    });

    test('should have alerts for high-risk staff', () => {
      const highRiskCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM risk_scores 
        WHERE risk_level = 'High'
      `).get();

      const alertCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM alerts 
        WHERE resolved = FALSE
      `).get();

      // Should have alerts for high-risk staff
      if (highRiskCount.count > 0) {
        expect(alertCount.count).toBeGreaterThan(0);
      }
    });

    test('should not need seeding after initial seed', () => {
      const needs = needsSeeding();
      expect(needs).toBe(false);
    });
  });

  describe('Data Integrity', () => {
    test('should have valid foreign key relationships', () => {
      // Test work_hours -> staff relationship
      const orphanedWorkHours = db.prepare(`
        SELECT COUNT(*) as count 
        FROM work_hours wh 
        LEFT JOIN staff s ON wh.staff_id = s.id 
        WHERE s.id IS NULL
      `).get();
      expect(orphanedWorkHours.count).toBe(0);

      // Test risk_scores -> staff relationship
      const orphanedRiskScores = db.prepare(`
        SELECT COUNT(*) as count 
        FROM risk_scores rs 
        LEFT JOIN staff s ON rs.staff_id = s.id 
        WHERE s.id IS NULL
      `).get();
      expect(orphanedRiskScores.count).toBe(0);

      // Test alerts -> staff relationship
      const orphanedAlerts = db.prepare(`
        SELECT COUNT(*) as count 
        FROM alerts a 
        LEFT JOIN staff s ON a.staff_id = s.id 
        WHERE s.id IS NULL
      `).get();
      expect(orphanedAlerts.count).toBe(0);
    });

    test('should have unique constraints working', () => {
      // Test unique email constraint for staff
      expect(() => {
        db.prepare(`
          INSERT INTO staff (name, email, department, role, hire_date)
          VALUES ('Test User', 'emily.rodriguez@hospital.com', 'ICU', 'Test Role', '2023-01-01')
        `).run();
      }).toThrow();

      // Test unique email constraint for managers
      expect(() => {
        db.prepare(`
          INSERT INTO managers (name, email, password_hash)
          VALUES ('Test Manager', 'sarah.johnson@hospital.com', 'test-hash')
        `).run();
      }).toThrow();
    });

    test('should have check constraints working', () => {
      // Test hours_worked constraint
      expect(() => {
        db.prepare(`
          INSERT INTO work_hours (staff_id, date, hours_worked, overtime_hours)
          VALUES (1, '2023-01-01', 25, 0)
        `).run();
      }).toThrow();

      // Test risk score constraint
      expect(() => {
        db.prepare(`
          INSERT INTO risk_scores (staff_id, date, score, risk_level, factors)
          VALUES (1, '2023-01-01', 150, 'High', '{}')
        `).run();
      }).toThrow();
    });
  });
});