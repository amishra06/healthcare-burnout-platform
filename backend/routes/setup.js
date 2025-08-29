const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const router = express.Router();

/**
 * POST /api/setup/database
 * Initialize database schema and seed data
 */
router.post('/database', async (req, res) => {
  try {
    console.log('Initializing database schema...');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    statements.forEach(statement => {
      if (statement.trim()) {
        db.exec(statement);
      }
    });
    
    console.log('Database schema created successfully');
    
    // Check if managers already exist
    const managersQuery = db.prepare('SELECT COUNT(*) as count FROM managers');
    const managersCount = managersQuery.get();
    
    if (managersCount.count === 0) {
      console.log('Seeding managers...');
      
      // Create sample managers
      const sampleManagers = [
        {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@hospital.com',
          password: 'manager123'
        },
        {
          name: 'Michael Chen',
          email: 'michael.chen@hospital.com',
          password: 'manager123'
        }
      ];
      
      const insertManager = db.prepare(`
        INSERT INTO managers (name, email, password_hash)
        VALUES (?, ?, ?)
      `);
      
      for (const manager of sampleManagers) {
        const hashedPassword = await bcrypt.hash(manager.password, 10);
        insertManager.run(manager.name, manager.email, hashedPassword);
      }
      
      console.log('Managers seeded successfully');
    }
    
    // Check if staff already exist
    const staffQuery = db.prepare('SELECT COUNT(*) as count FROM staff');
    const staffCount = staffQuery.get();
    
    if (staffCount.count === 0) {
      console.log('Seeding comprehensive staff data with work hours and risk scores...');
      
      // Run the comprehensive seeding script
      try {
        const { execSync } = require('child_process');
        const seedScriptPath = path.join(__dirname, '../seed-complete-data.js');
        execSync(`node "${seedScriptPath}"`, { stdio: 'inherit' });
        console.log('Comprehensive data seeding completed successfully');
      } catch (seedError) {
        console.error('Error running comprehensive seeding, falling back to basic staff creation:', seedError.message);
        
        // Fallback to basic staff creation
        const basicStaff = [
          { name: 'Dr. Sarah Martinez', email: 'sarah.martinez@hospital.com', department: 'ICU', role: 'Critical Care Physician', hire_date: '2019-03-15' },
          { name: 'Jennifer Walsh', email: 'jennifer.walsh@hospital.com', department: 'ICU', role: 'Senior ICU Nurse', hire_date: '2018-08-22' },
          { name: 'Dr. James Wilson', email: 'james.wilson@hospital.com', department: 'Emergency', role: 'Emergency Physician', hire_date: '2019-11-05' },
          { name: 'Maria Garcia', email: 'maria.garcia@hospital.com', department: 'Emergency', role: 'Trauma Nurse', hire_date: '2020-02-14' },
          { name: 'Dr. David Kim', email: 'david.kim@hospital.com', department: 'General', role: 'Internal Medicine', hire_date: '2021-05-20' },
          { name: 'Anna Smith', email: 'anna.smith@hospital.com', department: 'General', role: 'Registered Nurse', hire_date: '2020-09-12' }
        ];
        
        const insertStaff = db.prepare(`INSERT INTO staff (name, email, department, role, hire_date) VALUES (?, ?, ?, ?, ?)`);
        basicStaff.forEach(staff => {
          insertStaff.run(staff.name, staff.email, staff.department, staff.role, staff.hire_date);
        });
      }
    }
    
    // Get final counts
    const finalManagersCount = db.prepare('SELECT COUNT(*) as count FROM managers').get();
    const finalStaffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get();
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        managers: finalManagersCount.count,
        staff: finalStaffCount.count,
        loginCredentials: {
          email: 'sarah.johnson@hospital.com',
          password: 'manager123'
        }
      }
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_INIT_ERROR',
        message: 'Failed to initialize database',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/setup/status
 * Check database setup status
 */
router.get('/status', (req, res) => {
  try {
    const tables = ['managers', 'staff', 'work_hours', 'risk_scores', 'alerts'];
    const status = {};
    
    tables.forEach(table => {
      try {
        const query = db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
        const result = query.get();
        status[table] = { exists: true, count: result.count };
      } catch (error) {
        status[table] = { exists: false, error: error.message };
      }
    });
    
    res.json({
      success: true,
      data: {
        database: 'connected',
        tables: status
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_STATUS_ERROR',
        message: 'Failed to check database status',
        details: error.message
      }
    });
  }
});

module.exports = router;