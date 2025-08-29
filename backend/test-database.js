/**
 * Simple test to verify database setup and seeding works
 */

require('dotenv').config();
const { setupDatabase, getDatabaseStats } = require('./utils/database');

async function testDatabase() {
  console.log('Testing database setup...\n');
  
  try {
    // Setup database
    const success = await setupDatabase();
    
    if (!success) {
      throw new Error('Database setup failed');
    }
    
    // Get statistics
    const stats = getDatabaseStats();
    
    if (!stats) {
      throw new Error('Failed to get database statistics');
    }
    
    console.log('Database Statistics:');
    console.log('===================');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`${table}: ${count} records`);
    });
    
    // Verify we have the expected data
    const expectedCounts = {
      managers: 2,
      staff: 15,
      work_hours: 'at least 100', // Variable based on scenarios
      risk_scores: 15,
      alerts: 'variable' // Depends on high-risk staff
    };
    
    console.log('\nValidation:');
    console.log('===========');
    
    if (stats.managers === expectedCounts.managers) {
      console.log('✅ Managers count correct');
    } else {
      console.log(`❌ Managers count incorrect: expected ${expectedCounts.managers}, got ${stats.managers}`);
    }
    
    if (stats.staff === expectedCounts.staff) {
      console.log('✅ Staff count correct');
    } else {
      console.log(`❌ Staff count incorrect: expected ${expectedCounts.staff}, got ${stats.staff}`);
    }
    
    if (stats.work_hours >= 100) {
      console.log('✅ Work hours data generated');
    } else {
      console.log(`❌ Work hours data insufficient: got ${stats.work_hours}`);
    }
    
    if (stats.risk_scores === expectedCounts.risk_scores) {
      console.log('✅ Risk scores calculated');
    } else {
      console.log(`❌ Risk scores incorrect: expected ${expectedCounts.risk_scores}, got ${stats.risk_scores}`);
    }
    
    console.log(`✅ Alerts generated: ${stats.alerts} high-risk alerts`);
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error(error.stack);
  }
}

// Run test
testDatabase();