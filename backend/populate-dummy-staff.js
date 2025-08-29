const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database', 'healthcare_burnout.db');
const db = new Database(dbPath);

console.log('=== Populating Dummy Staff ===');

try {
  // Check current staff count
  const staffCount = db.prepare("SELECT COUNT(*) as count FROM staff").get();
  console.log(`Current staff count: ${staffCount.count}`);

  if (staffCount.count > 0) {
    console.log('Staff already exist. Showing current staff:');
    const existingStaff = db.prepare("SELECT id, name, email, department, role FROM staff").all();
    console.table(existingStaff);
    return;
  }

  // Create dummy staff data
  const dummyStaff = [
    {
      name: 'Dr. Emily Rodriguez',
      email: 'emily.rodriguez@hospital.com',
      department: 'ICU',
      role: 'ICU Physician',
      hire_date: '2020-03-15'
    },
    {
      name: 'Jennifer Walsh',
      email: 'jennifer.walsh@hospital.com',
      department: 'ICU',
      role: 'Senior Nurse',
      hire_date: '2019-08-22'
    },
    {
      name: 'Dr. Marcus Thompson',
      email: 'marcus.thompson@hospital.com',
      department: 'ICU',
      role: 'ICU Physician',
      hire_date: '2021-01-10'
    },
    {
      name: 'Lisa Park',
      email: 'lisa.park@hospital.com',
      department: 'ICU',
      role: 'Charge Nurse',
      hire_date: '2020-07-18'
    },
    {
      name: 'Dr. James Wilson',
      email: 'james.wilson@hospital.com',
      department: 'Emergency',
      role: 'Emergency Physician',
      hire_date: '2019-11-05'
    },
    {
      name: 'Maria Garcia',
      email: 'maria.garcia@hospital.com',
      department: 'Emergency',
      role: 'Emergency Nurse',
      hire_date: '2020-02-14'
    },
    {
      name: 'Dr. David Kim',
      email: 'david.kim@hospital.com',
      department: 'General',
      role: 'General Physician',
      hire_date: '2021-05-20'
    },
    {
      name: 'Anna Smith',
      email: 'anna.smith@hospital.com',
      department: 'General',
      role: 'Registered Nurse',
      hire_date: '2020-09-12'
    },
    {
      name: 'Dr. Robert Chen',
      email: 'robert.chen@hospital.com',
      department: 'ICU',
      role: 'Critical Care Specialist',
      hire_date: '2018-12-03'
    },
    {
      name: 'Sarah Williams',
      email: 'sarah.williams@hospital.com',
      department: 'Emergency',
      role: 'Trauma Nurse',
      hire_date: '2022-04-15'
    }
  ];

  // Insert dummy staff
  const insertQuery = db.prepare(`
    INSERT INTO staff (name, email, department, role, hire_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  console.log('Inserting dummy staff...');
  
  let successCount = 0;
  for (const staff of dummyStaff) {
    try {
      const result = insertQuery.run(
        staff.name,
        staff.email,
        staff.department,
        staff.role,
        staff.hire_date
      );
      console.log(`✅ Created: ${staff.name} (ID: ${result.lastInsertRowid})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to create ${staff.name}:`, error.message);
    }
  }

  console.log(`\n🎉 Successfully created ${successCount} staff members!`);

  // Show final staff list
  const finalStaff = db.prepare("SELECT id, name, email, department, role FROM staff").all();
  console.log('\nFinal staff list:');
  console.table(finalStaff);

} catch (error) {
  console.error('❌ Error during staff population:', error);
} finally {
  db.close();
}