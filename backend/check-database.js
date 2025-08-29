/**
 * Quick database check script
 */

const db = require('./config/database');

console.log('🔍 Checking database setup...\n');

try {
  // Check if managers table exists and has data
  console.log('1. Checking managers table...');
  const managersQuery = db.prepare('SELECT COUNT(*) as count FROM managers');
  const managersCount = managersQuery.get();
  console.log(`   Managers in database: ${managersCount.count}`);
  
  if (managersCount.count > 0) {
    const managersListQuery = db.prepare('SELECT id, name, email FROM managers');
    const managers = managersListQuery.all();
    console.log('   Available managers:');
    managers.forEach(manager => {
      console.log(`   - ${manager.name} (${manager.email})`);
    });
  }
  
  // Check if staff table exists and has data
  console.log('\n2. Checking staff table...');
  const staffQuery = db.prepare('SELECT COUNT(*) as count FROM staff');
  const staffCount = staffQuery.get();
  console.log(`   Staff in database: ${staffCount.count}`);
  
  // Check if other tables exist
  console.log('\n3. Checking other tables...');
  const tables = ['work_hours', 'risk_scores', 'alerts'];
  tables.forEach(table => {
    try {
      const query = db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
      const result = query.get();
      console.log(`   ${table}: ${result.count} records`);
    } catch (error) {
      console.log(`   ${table}: ❌ Table not found or error`);
    }
  });
  
  console.log('\n✅ Database check completed!');
  
  if (managersCount.count === 0) {
    console.log('\n⚠️  No managers found! You may need to run the seed script.');
    console.log('   Try running: node scripts/setup-database.js');
  } else {
    console.log('\n🔑 Login credentials:');
    console.log('   Email: sarah.johnson@hospital.com');
    console.log('   Password: manager123');
  }
  
} catch (error) {
  console.error('❌ Database check failed:', error.message);
  console.log('\n💡 This might mean the database schema is not initialized.');
  console.log('   Try running: node scripts/setup-database.js');
}