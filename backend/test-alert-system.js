/**
 * Test script for alert system integration
 */

const db = require('./utils/database');
const dbConnection = require('./config/database');
const { updateStaffRiskScore } = require('./services/riskCalculation');
const { processRiskScoreChange, getActiveAlerts } = require('./services/alertService');
const { sendHighRiskAlert } = require('./services/emailService');

console.log('Testing Alert System Integration...\n');

try {
  // Test 1: Get a staff member with high risk potential
  console.log('1. Finding staff member for testing...');
  const staffQuery = dbConnection.prepare('SELECT * FROM staff LIMIT 1');
  const testStaff = staffQuery.get();
  
  if (!testStaff) {
    console.log('No staff found in database. Please run the seed script first.');
    process.exit(1);
  }
  
  console.log(`   Testing with: ${testStaff.name} (ID: ${testStaff.id})`);
  
  // Test 2: Create high-risk work hours to trigger alert
  console.log('\n2. Creating high-risk work hours...');
  const today = new Date().toISOString().split('T')[0];
  
  // Add multiple days of high overtime to trigger high risk
  const workHoursData = [
    { date: today, hours: 12, overtime: 4 },
    { date: getDateOffset(today, -1), hours: 14, overtime: 6 },
    { date: getDateOffset(today, -2), hours: 13, overtime: 5 },
    { date: getDateOffset(today, -3), hours: 12, overtime: 4 },
    { date: getDateOffset(today, -4), hours: 15, overtime: 7 }
  ];
  
  const insertWorkHours = dbConnection.prepare(`
    INSERT OR REPLACE INTO work_hours (staff_id, date, hours_worked, overtime_hours)
    VALUES (?, ?, ?, ?)
  `);
  
  workHoursData.forEach(wh => {
    insertWorkHours.run(testStaff.id, wh.date, wh.hours, wh.overtime);
    console.log(`   Added: ${wh.date} - ${wh.hours}h regular, ${wh.overtime}h overtime`);
  });
  
  // Test 3: Calculate risk score
  console.log('\n3. Calculating risk score...');
  const riskData = updateStaffRiskScore(testStaff.id, today);
  console.log(`   Risk Score: ${riskData.score}/100 (${riskData.riskLevel})`);
  console.log(`   Factors:`, JSON.stringify(riskData.factors, null, 2));
  
  // Test 4: Process risk score change and create alert
  console.log('\n4. Processing risk score change...');
  const alertId = processRiskScoreChange(testStaff.id, riskData.score);
  
  if (alertId) {
    console.log(`   ✅ Alert created with ID: ${alertId}`);
  } else {
    console.log(`   ℹ️  No alert created (risk score: ${riskData.score})`);
  }
  
  // Test 5: Get active alerts
  console.log('\n5. Checking active alerts...');
  const activeAlerts = getActiveAlerts();
  console.log(`   Active alerts count: ${activeAlerts.length}`);
  
  activeAlerts.forEach(alert => {
    console.log(`   - Alert ${alert.id}: ${alert.staff_name} (Score: ${alert.risk_score})`);
    console.log(`     Message: ${alert.message}`);
  });
  
  // Test 6: Test email notification
  console.log('\n6. Testing email notification...');
  if (riskData.score >= 71) {
    const emailResult = sendHighRiskAlert(testStaff, riskData.score, riskData.factors);
    console.log(`   Email notification: ${emailResult.message}`);
  } else {
    console.log('   No email sent (risk score below high-risk threshold)');
  }
  
  console.log('\n✅ Alert system integration test completed successfully!');
  
} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}

/**
 * Helper function to get date with offset
 */
function getDateOffset(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}