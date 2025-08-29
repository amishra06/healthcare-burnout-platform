/**
 * Email Service
 * Handles email notifications for burnout risk alerts
 * Currently implements console logging for demo purposes
 */

/**
 * Send high-risk alert email notification
 */
function sendHighRiskAlert(staffInfo, riskScore, factors = null) {
  try {
    const emailContent = generateHighRiskEmailContent(staffInfo, riskScore, factors);
    
    // For demo purposes, log to console instead of sending actual email
    console.log('\n=== EMAIL NOTIFICATION ===');
    console.log('TO:', getManagerEmail());
    console.log('SUBJECT:', emailContent.subject);
    console.log('BODY:');
    console.log(emailContent.body);
    console.log('========================\n');
    
    // In production, this would use a service like Nodemailer, SendGrid, etc.
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransporter(config);
    // await transporter.sendMail({
    //   from: process.env.FROM_EMAIL,
    //   to: getManagerEmail(),
    //   subject: emailContent.subject,
    //   html: emailContent.htmlBody,
    //   text: emailContent.body
    // });
    
    return {
      success: true,
      message: 'High-risk alert notification sent (console logged for demo)'
    };
    
  } catch (error) {
    console.error('Error sending high-risk alert email:', error);
    return {
      success: false,
      message: 'Failed to send email notification'
    };
  }
}

/**
 * Send alert resolution notification
 */
function sendAlertResolutionNotification(staffInfo, previousRiskScore, currentRiskScore) {
  try {
    const emailContent = generateResolutionEmailContent(staffInfo, previousRiskScore, currentRiskScore);
    
    // For demo purposes, log to console
    console.log('\n=== EMAIL NOTIFICATION ===');
    console.log('TO:', getManagerEmail());
    console.log('SUBJECT:', emailContent.subject);
    console.log('BODY:');
    console.log(emailContent.body);
    console.log('========================\n');
    
    return {
      success: true,
      message: 'Alert resolution notification sent (console logged for demo)'
    };
    
  } catch (error) {
    console.error('Error sending resolution email:', error);
    return {
      success: false,
      message: 'Failed to send resolution notification'
    };
  }
}

/**
 * Send consolidated high-risk alert for multiple staff
 */
function sendConsolidatedHighRiskAlert(staffList) {
  try {
    const emailContent = generateConsolidatedEmailContent(staffList);
    
    // For demo purposes, log to console
    console.log('\n=== CONSOLIDATED EMAIL NOTIFICATION ===');
    console.log('TO:', getManagerEmail());
    console.log('SUBJECT:', emailContent.subject);
    console.log('BODY:');
    console.log(emailContent.body);
    console.log('=====================================\n');
    
    return {
      success: true,
      message: 'Consolidated high-risk alert sent (console logged for demo)'
    };
    
  } catch (error) {
    console.error('Error sending consolidated alert email:', error);
    return {
      success: false,
      message: 'Failed to send consolidated alert'
    };
  }
}

/**
 * Generate email content for high-risk alert
 */
function generateHighRiskEmailContent(staffInfo, riskScore, factors) {
  const subject = `🚨 HIGH RISK ALERT: ${staffInfo.name} - Burnout Risk Score ${riskScore}`;
  
  const factorsText = factors ? generateFactorsText(factors) : '';
  
  const body = `
URGENT: High Burnout Risk Alert

Staff Member: ${staffInfo.name}
Department: ${staffInfo.department}
Role: ${staffInfo.role}
Current Risk Score: ${riskScore}/100 (HIGH RISK)

${factorsText}

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
  `.trim();

  return {
    subject,
    body,
    htmlBody: body.replace(/\n/g, '<br>')
  };
}

/**
 * Generate email content for alert resolution
 */
function generateResolutionEmailContent(staffInfo, previousRiskScore, currentRiskScore) {
  const subject = `✅ RESOLVED: ${staffInfo.name} - Risk Level Improved`;
  
  const body = `
Burnout Risk Alert Resolution

Staff Member: ${staffInfo.name}
Department: ${staffInfo.department}
Role: ${staffInfo.role}

Previous Risk Score: ${previousRiskScore}/100
Current Risk Score: ${currentRiskScore}/100

The high-risk alert for this staff member has been resolved.
Risk score has decreased below the high-risk threshold.

Continue monitoring to ensure sustained improvement.

Healthcare Burnout Prevention System
Generated: ${new Date().toLocaleString()}
  `.trim();

  return {
    subject,
    body,
    htmlBody: body.replace(/\n/g, '<br>')
  };
}

/**
 * Generate email content for consolidated alerts
 */
function generateConsolidatedEmailContent(staffList) {
  const subject = `🚨 MULTIPLE HIGH RISK ALERTS - ${staffList.length} Staff Members`;
  
  const staffDetails = staffList.map(staff => 
    `- ${staff.name} (${staff.department}): Risk Score ${staff.riskScore}/100`
  ).join('\n');
  
  const body = `
URGENT: Multiple High Burnout Risk Alerts

${staffList.length} staff members have reached high burnout risk levels:

${staffDetails}

IMMEDIATE ACTIONS RECOMMENDED:
- Review department workload distribution
- Consider temporary staffing adjustments
- Implement immediate rest periods for high-risk staff
- Schedule emergency team meeting
- Evaluate current scheduling practices

This consolidated alert indicates potential systemic workload issues.
Please take immediate action to prevent multiple burnout cases.

Healthcare Burnout Prevention System
Generated: ${new Date().toLocaleString()}
  `.trim();

  return {
    subject,
    body,
    htmlBody: body.replace(/\n/g, '<br>')
  };
}

/**
 * Generate text description of risk factors
 */
function generateFactorsText(factors) {
  const factorDescriptions = [];
  
  if (factors.consecutiveDays > 0) {
    const days = factors.consecutiveDays / 10;
    factorDescriptions.push(`- Working ${days} consecutive days (+${factors.consecutiveDays} points)`);
  }
  
  if (factors.overtimeHours > 0) {
    const hours = factors.overtimeHours / 15;
    factorDescriptions.push(`- ${hours.toFixed(1)} overtime hours this week (+${factors.overtimeHours} points)`);
  }
  
  if (factors.weeklyHours > 0) {
    factorDescriptions.push(`- Working more than 60 hours this week (+${factors.weeklyHours} points)`);
  }
  
  if (factors.weekendWork > 0) {
    const weekends = factors.weekendWork / 5;
    factorDescriptions.push(`- Worked ${weekends} weekends this month (+${factors.weekendWork} points)`);
  }
  
  if (factorDescriptions.length > 0) {
    return `CONTRIBUTING RISK FACTORS:\n${factorDescriptions.join('\n')}\n`;
  }
  
  return '';
}

/**
 * Get manager email address (in production, this would come from database)
 */
function getManagerEmail() {
  return process.env.MANAGER_EMAIL || 'manager@hospital.com';
}

/**
 * Validate email configuration
 */
function validateEmailConfig() {
  // In production, validate SMTP settings, API keys, etc.
  return {
    valid: true,
    message: 'Email service configured for console logging (demo mode)'
  };
}

module.exports = {
  sendHighRiskAlert,
  sendAlertResolutionNotification,
  sendConsolidatedHighRiskAlert,
  validateEmailConfig
};