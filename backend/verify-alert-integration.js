/**
 * Verification script for alert system integration
 * Checks if all components are properly connected
 */

console.log('Verifying Alert System Integration...\n');

// Test 1: Check if all required modules can be imported
console.log('1. Testing module imports...');
try {
  const alertService = require('./services/alertService');
  const emailService = require('./services/emailService');
  const riskCalculation = require('./services/riskCalculation');
  
  console.log('   ✅ Alert service imported successfully');
  console.log('   ✅ Email service imported successfully');
  console.log('   ✅ Risk calculation service imported successfully');
} catch (error) {
  console.error('   ❌ Module import failed:', error.message);
  process.exit(1);
}

// Test 2: Check if alert service functions are available
console.log('\n2. Testing alert service functions...');
try {
  const alertService = require('./services/alertService');
  
  const requiredFunctions = [
    'createAlert',
    'resolveAlert', 
    'getActiveAlerts',
    'getAllAlerts',
    'processRiskScoreChange',
    'getAlertStats'
  ];
  
  requiredFunctions.forEach(func => {
    if (typeof alertService[func] === 'function') {
      console.log(`   ✅ ${func} function available`);
    } else {
      console.log(`   ❌ ${func} function missing`);
    }
  });
} catch (error) {
  console.error('   ❌ Alert service test failed:', error.message);
}

// Test 3: Check if email service functions are available
console.log('\n3. Testing email service functions...');
try {
  const emailService = require('./services/emailService');
  
  const requiredFunctions = [
    'sendHighRiskAlert',
    'sendAlertResolutionNotification',
    'sendConsolidatedHighRiskAlert',
    'validateEmailConfig'
  ];
  
  requiredFunctions.forEach(func => {
    if (typeof emailService[func] === 'function') {
      console.log(`   ✅ ${func} function available`);
    } else {
      console.log(`   ❌ ${func} function missing`);
    }
  });
  
  // Test email configuration
  const config = emailService.validateEmailConfig();
  console.log(`   ℹ️  Email config: ${config.message}`);
  
} catch (error) {
  console.error('   ❌ Email service test failed:', error.message);
}

// Test 4: Check if alert routes exist
console.log('\n4. Testing alert routes...');
try {
  const alertRoutes = require('./routes/alerts');
  console.log('   ✅ Alert routes imported successfully');
} catch (error) {
  console.error('   ❌ Alert routes import failed:', error.message);
}

// Test 5: Test email notification (console output)
console.log('\n5. Testing email notification output...');
try {
  const { sendHighRiskAlert } = require('./services/emailService');
  
  const mockStaff = {
    name: 'Test Staff',
    department: 'ICU',
    role: 'Nurse'
  };
  
  const result = sendHighRiskAlert(mockStaff, 85);
  console.log(`   Result: ${result.message}`);
  
} catch (error) {
  console.error('   ❌ Email notification test failed:', error.message);
}

// Test 6: Check work hours integration
console.log('\n6. Testing work hours integration...');
try {
  const workHoursRoute = require('./routes/workHours');
  console.log('   ✅ Work hours routes imported successfully');
  
  // Check if processRiskScoreChange is imported in work hours
  const fs = require('fs');
  const workHoursContent = fs.readFileSync('./routes/workHours.js', 'utf8');
  
  if (workHoursContent.includes('processRiskScoreChange')) {
    console.log('   ✅ processRiskScoreChange integrated in work hours route');
  } else {
    console.log('   ❌ processRiskScoreChange not found in work hours route');
  }
  
} catch (error) {
  console.error('   ❌ Work hours integration test failed:', error.message);
}

console.log('\n✅ Alert system integration verification completed!');
console.log('\nThe alert system should now:');
console.log('- Create alerts when risk scores reach 71+');
console.log('- Send email notifications (console logged for demo)');
console.log('- Provide API endpoints for alert management');
console.log('- Integrate with work hours updates');
console.log('- Display alerts on the dashboard');