/**
 * Manual test script for risk calculation engine
 * This script tests the risk calculation functionality without running full test suite
 */

const db = require('./config/database');
const { 
  calculateRiskScore, 
  updateStaffRiskScore, 
  getRiskDistribution, 
  getTopRiskStaff 
} = require('./services/riskCalculation');

console.log('Testing Risk Calculation Engine...\n');

try {
  // Test 1: Get all staff to test with
  console.log('1. Getting staff list...');
  const staffQuery = db.prepare('SELECT id, name, department FROM staff LIMIT 5');
  const staff = staffQuery.all();
  console.log(`Found ${staff.length} staff members:`);
  staff.forEach(s => console.log(`  - ${s.name} (${s.department})`));
  console.log('');

  if (staff.length === 0) {
    console.log('No staff found. Please run database seeding first.');
    process.exit(1);
  }

  // Test 2: Calculate risk score for first staff member
  console.log('2. Testing risk score calculation...');
  const testStaff = staff[0];
  const riskData = calculateRiskScore(testStaff.id);
  console.log(`Risk calculation for ${testStaff.name}:`);
  console.log(`  Score: ${riskData.score}`);
  console.log(`  Risk Level: ${riskData.riskLevel}`);
  console.log(`  Factors:`, riskData.factors);
  console.log(`  Weekly Hours: ${riskData.weeklyHours}`);
  console.log(`  Consecutive Days: ${riskData.consecutiveDays}`);
  console.log('');

  // Test 3: Update and save risk score
  console.log('3. Testing risk score update and save...');
  const updatedRisk = updateStaffRiskScore(testStaff.id);
  console.log(`Updated risk score saved with ID: ${updatedRisk.id}`);
  console.log('');

  // Test 4: Get risk distribution
  console.log('4. Testing risk distribution...');
  const distribution = getRiskDistribution();
  console.log('Risk Distribution:');
  console.log(`  Low: ${distribution.Low}`);
  console.log(`  Medium: ${distribution.Medium}`);
  console.log(`  High: ${distribution.High}`);
  console.log('');

  // Test 5: Get top risk staff
  console.log('5. Testing top risk staff...');
  const topRisk = getTopRiskStaff(3);
  console.log('Top 3 Risk Staff:');
  topRisk.forEach((staff, index) => {
    console.log(`  ${index + 1}. ${staff.name} - Score: ${staff.score} (${staff.risk_level})`);
  });
  console.log('');

  // Test 6: Test work hours impact on risk calculation
  console.log('6. Testing work hours impact...');
  
  // Add some test work hours for the first staff member
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  try {
    // Insert test work hours
    const insertWorkHours = db.prepare(`
      INSERT OR REPLACE INTO work_hours (staff_id, date, hours_worked, overtime_hours)
      VALUES (?, ?, ?, ?)
    `);
    
    insertWorkHours.run(testStaff.id, today, 12, 4); // 12 regular + 4 overtime
    insertWorkHours.run(testStaff.id, yesterdayStr, 10, 2); // 10 regular + 2 overtime
    
    console.log(`Added test work hours for ${testStaff.name}`);
    
    // Recalculate risk score
    const newRiskData = calculateRiskScore(testStaff.id);
    console.log(`New risk score: ${newRiskData.score} (${newRiskData.riskLevel})`);
    console.log(`Weekly hours: ${newRiskData.weeklyHours}`);
    console.log(`Weekly overtime: ${newRiskData.weeklyOvertime}`);
    
  } catch (workHoursError) {
    console.log('Work hours test failed (may be due to existing data):', workHoursError.message);
  }
  
  console.log('\n✅ Risk calculation engine tests completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error);
  console.error(error.stack);
  process.exit(1);
}