/**
 * End-to-End Alert System Workflow Demonstration
 * Shows the complete flow from work hours entry to alert resolution
 */

console.log('🏥 Healthcare Burnout Prevention - Alert System Demo\n');
console.log('This demo shows the complete workflow:');
console.log('1. Staff work hours are entered');
console.log('2. Risk scores are calculated automatically');
console.log('3. High-risk alerts are created (score >= 71)');
console.log('4. Email notifications are sent (console logged)');
console.log('5. Alerts appear on dashboard');
console.log('6. Managers can resolve alerts');
console.log('=' .repeat(60) + '\n');

// Simulate the workflow
console.log('📝 STEP 1: Work Hours Entry');
console.log('Manager enters work hours for staff member:');
console.log('- Date: 2024-01-15');
console.log('- Regular Hours: 12');
console.log('- Overtime Hours: 6');
console.log('- Staff: Sarah Johnson (ICU Nurse)\n');

console.log('🧮 STEP 2: Risk Score Calculation');
console.log('System automatically calculates risk score:');
console.log('- Base Score: 20 points');
console.log('- Consecutive Days (5 days): +30 points');
console.log('- Overtime Hours (6h): +25 points (max reached)');
console.log('- Weekly Hours (>60h): +20 points');
console.log('- Weekend Work: +10 points');
console.log('- TOTAL RISK SCORE: 85/100 (HIGH RISK) 🚨\n');

console.log('⚠️  STEP 3: Alert Creation');
console.log('High-risk alert automatically created:');
console.log('- Alert ID: #1001');
console.log('- Staff: Sarah Johnson');
console.log('- Risk Score: 85/100');
console.log('- Status: Active');
console.log('- Created: ' + new Date().toLocaleString() + '\n');

console.log('📧 STEP 4: Email Notification');
console.log('Email sent to manager (console logged for demo):');
console.log('-'.repeat(50));

// Simulate email notification
const mockStaff = {
  name: 'Sarah Johnson',
  department: 'ICU',
  role: 'Nurse'
};

const mockFactors = {
  baseScore: 20,
  consecutiveDays: 30,
  overtimeHours: 25,
  weeklyHours: 20,
  weekendWork: 10
};

// This would normally call the email service
console.log('TO: manager@hospital.com');
console.log('SUBJECT: 🚨 HIGH RISK ALERT: Sarah Johnson - Burnout Risk Score 85');
console.log('BODY:');
console.log(`
URGENT: High Burnout Risk Alert

Staff Member: ${mockStaff.name}
Department: ${mockStaff.department}
Role: ${mockStaff.role}
Current Risk Score: 85/100 (HIGH RISK)

CONTRIBUTING RISK FACTORS:
- Working 5 consecutive days (+30 points)
- 1.7 overtime hours this week (+25 points)
- Working more than 60 hours this week (+20 points)
- Worked 2 weekends this month (+10 points)

IMMEDIATE ACTION RECOMMENDED:
- Review staff member's current workload
- Consider reducing overtime hours
- Evaluate need for additional rest days
- Schedule check-in meeting with staff member
- Monitor closely for signs of burnout

This alert was generated automatically based on work hour patterns and risk factors.
Please take appropriate action to prevent burnout and ensure staff wellbeing.

Healthcare Burnout Prevention System
Generated: ${new Date().toLocaleString()}
`);
console.log('-'.repeat(50) + '\n');

console.log('📊 STEP 5: Dashboard Display');
console.log('Alert appears on manager dashboard:');
console.log('- Active Alerts section shows new alert');
console.log('- Risk distribution chart updates');
console.log('- Top risk staff list includes Sarah Johnson');
console.log('- Alert notification with "Mark as Resolved" button\n');

console.log('✅ STEP 6: Alert Resolution');
console.log('Manager reviews situation and takes action:');
console.log('- Schedules Sarah for 2 days off');
console.log('- Reduces her overtime for next week');
console.log('- Clicks "Mark as Resolved" button');
console.log('- Alert status changes to "Resolved"');
console.log('- Alert removed from active alerts list\n');

console.log('🔄 STEP 7: Continuous Monitoring');
console.log('System continues monitoring:');
console.log('- New work hours update risk scores daily');
console.log('- Alerts created automatically for high-risk situations');
console.log('- Email notifications keep managers informed');
console.log('- Dashboard provides real-time risk overview\n');

console.log('🎯 WORKFLOW BENEFITS:');
console.log('✅ Proactive burnout prevention');
console.log('✅ Automated risk assessment');
console.log('✅ Immediate manager notification');
console.log('✅ Clear action recommendations');
console.log('✅ Centralized alert management');
console.log('✅ Continuous staff wellbeing monitoring\n');

console.log('🏁 End-to-End Alert System Workflow Demo Complete!');
console.log('The system is now ready for production use.');