const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database', 'healthcare_burnout.db');
const db = new Database(dbPath);

console.log('=== Database Diagnosis ===');

try {
  // Check if staff table exists and get its structure
  console.log('\n1. Checking staff table structure:');
  const tableInfo = db.prepare("PRAGMA table_info(staff)").all();
  console.log(tableInfo);

  // Check current staff count
  console.log('\n2. Current staff count:');
  const staffCount = db.prepare("SELECT COUNT(*) as count FROM staff").get();
  console.log(`Staff count: ${staffCount.count}`);

  // Show existing staff if any
  if (staffCount.count > 0) {
    console.log('\n3. Existing staff:');
    const existingStaff = db.prepare("SELECT id, name, email, department, role, hire_date FROM staff LIMIT 5").all();
    console.table(existingStaff);
  }

  // Test staff creation with proper data types
  console.log('\n4. Testing staff creation:');
  
  const testStaff = {
    name: 'Test Doctor',
    email: 'test.doctor@hospital.com',
    department: 'ICU',
    role: 'Test Physician',
    hire_date: '2024-01-15'  // String format
  };

  // Check if test staff already exists
  const existingTest = db.prepare('SELECT id FROM staff WHERE email = ?').get(testStaff.email);
  
  if (existingTest) {
    console.log('Test staff already exists, deleting first...');
    db.prepare('DELETE FROM staff WHERE email = ?').run(testStaff.email);
  }

  // Try to insert test staff
  const insertQuery = db.prepare(`
    INSERT INTO staff (name, email, department, role, hire_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  console.log('Attempting to insert test staff...');
  console.log('Data types:', {
    name: typeof testStaff.name,
    email: typeof testStaff.email,
    department: typeof testStaff.department,
    role: typeof testStaff.role,
    hire_date: typeof testStaff.hire_date
  });

  const result = insertQuery.run(
    testStaff.name,
    testStaff.email,
    testStaff.department,
    testStaff.role,
    testStaff.hire_date
  );

  console.log('✅ Staff creation successful!');
  console.log('Insert result:', result);

  // Verify the inserted staff
  const newStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid);
  console.log('Created staff:', newStaff);

  // Clean up test data
  db.prepare('DELETE FROM staff WHERE email = ?').run(testStaff.email);
  console.log('Test data cleaned up');

} catch (error) {
  console.error('❌ Error during diagnosis:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
} finally {
  db.close();
}