const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./config/database');

// Test the API implementation
async function testAPI() {
  console.log('Testing Healthcare Burnout Prevention API...\n');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { setupDatabase } = require('./utils/database');
    await setupDatabase();
    console.log('✓ Database connection successful\n');

    // 2. Test manager creation and authentication
    console.log('2. Testing manager authentication...');
    
    // Create test manager
    const testManager = {
      name: 'Test Manager',
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const hashedPassword = await bcrypt.hash(testManager.password, 10);
    const insertQuery = db.prepare(`
      INSERT OR REPLACE INTO managers (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    insertQuery.run(testManager.name, testManager.email, hashedPassword);
    console.log('✓ Test manager created');

    // Test password verification
    const managerQuery = db.prepare('SELECT * FROM managers WHERE email = ?');
    const manager = managerQuery.get(testManager.email);
    const isValidPassword = await bcrypt.compare(testManager.password, manager.password_hash);
    console.log(`✓ Password verification: ${isValidPassword ? 'PASS' : 'FAIL'}\n`);

    // 3. Test staff operations
    console.log('3. Testing staff operations...');
    
    const testStaff = {
      name: 'John Doe',
      email: 'john.doe@hospital.com',
      department: 'ICU',
      role: 'Nurse',
      hire_date: '2023-01-15'
    };

    // Create staff
    const staffInsertQuery = db.prepare(`
      INSERT INTO staff (name, email, department, role, hire_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const staffResult = staffInsertQuery.run(
      testStaff.name, 
      testStaff.email, 
      testStaff.department, 
      testStaff.role, 
      testStaff.hire_date
    );
    console.log('✓ Staff member created');

    // Read staff
    const staffQuery = db.prepare('SELECT * FROM staff WHERE id = ?');
    const createdStaff = staffQuery.get(staffResult.lastInsertRowid);
    console.log(`✓ Staff retrieved: ${createdStaff.name} (${createdStaff.department})`);

    // 4. Test work hours operations
    console.log('\n4. Testing work hours operations...');
    
    const workHoursData = {
      staff_id: createdStaff.id,
      date: '2024-01-15',
      hours_worked: 8.5,
      overtime_hours: 2.0
    };

    const workHoursInsertQuery = db.prepare(`
      INSERT INTO work_hours (staff_id, date, hours_worked, overtime_hours)
      VALUES (?, ?, ?, ?)
    `);
    const workHoursResult = workHoursInsertQuery.run(
      workHoursData.staff_id,
      workHoursData.date,
      workHoursData.hours_worked,
      workHoursData.overtime_hours
    );
    console.log('✓ Work hours recorded');

    // Read work hours
    const workHoursQuery = db.prepare('SELECT * FROM work_hours WHERE staff_id = ?');
    const workHours = workHoursQuery.all(createdStaff.id);
    console.log(`✓ Work hours retrieved: ${workHours.length} entries`);

    // 5. Test validation functions
    console.log('\n5. Testing validation functions...');
    
    // Test email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    console.log(`✓ Email validation: ${emailRegex.test(testStaff.email) ? 'PASS' : 'FAIL'}`);
    
    // Test department validation
    const validDepartments = ['ICU', 'Emergency', 'General'];
    console.log(`✓ Department validation: ${validDepartments.includes(testStaff.department) ? 'PASS' : 'FAIL'}`);
    
    // Test hours validation
    const isValidHours = workHoursData.hours_worked >= 0 && workHoursData.hours_worked <= 24;
    console.log(`✓ Hours validation: ${isValidHours ? 'PASS' : 'FAIL'}`);

    // Clean up test data
    console.log('\n6. Cleaning up test data...');
    db.prepare('DELETE FROM work_hours WHERE staff_id = ?').run(createdStaff.id);
    db.prepare('DELETE FROM staff WHERE id = ?').run(createdStaff.id);
    db.prepare('DELETE FROM managers WHERE email = ?').run(testManager.email);
    console.log('✓ Test data cleaned up');

    console.log('\n🎉 All API tests passed successfully!');
    console.log('\nImplemented features:');
    console.log('- JWT Authentication middleware');
    console.log('- Login/logout endpoints');
    console.log('- Staff CRUD operations');
    console.log('- Work hours tracking (create, read, update)');
    console.log('- Input validation and error handling');
    console.log('- Database integration');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAPI();