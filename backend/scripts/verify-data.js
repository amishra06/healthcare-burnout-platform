#!/usr/bin/env node

/**
 * Script to verify and display sample data in the database
 */

require('dotenv').config();
const db = require('../config/database');

function verifyData() {
  console.log('Healthcare Burnout Prevention Platform - Data Verification');
  console.log('=========================================================\n');
  
  try {
    // Check managers
    console.log('MANAGERS:');
    console.log('---------');
    const managers = db.prepare('SELECT id, name, email FROM managers').all();
    managers.forEach(manager => {
      console.log(`${manager.id}: ${manager.name} (${manager.email})`);
    });
    
    // Check staff by department
    console.log('\nSTAFF BY DEPARTMENT:');
    console.log('--------------------');
    const departments = ['ICU', 'Emergency', 'General'];
    
    departments.forEach(dept => {
      console.log(`\n${dept} Department:`);
      const staff = db.prepare('SELECT id, name, role FROM staff WHERE department = ?').all(dept);
      staff.forEach(member => {
        console.log(`  ${member.id}: ${member.name} - ${member.role}`);
      });
    });
    
    // Check risk distribution
    console.log('\nRISK LEVEL DISTRIBUTION:');
    console.log('------------------------');
    const riskDistribution = db.prepare(`
      SELECT risk_level, COUNT(*) as count 
      FROM risk_scores 
      GROUP BY risk_level 
      ORDER BY 
        CASE risk_level 
          WHEN 'Low' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'High' THEN 3 
        END
    `).all();
    
    riskDistribution.forEach(risk => {
      console.log(`${risk.risk_level}: ${risk.count} staff members`);
    });
    
    // Show high-risk staff details
    console.log('\nHIGH-RISK STAFF DETAILS:');
    console.log('------------------------');
    const highRiskStaff = db.prepare(`
      SELECT s.name, s.department, rs.score, rs.factors
      FROM staff s
      JOIN risk_scores rs ON s.id = rs.staff_id
      WHERE rs.risk_level = 'High'
      ORDER BY rs.score DESC
    `).all();
    
    if (highRiskStaff.length > 0) {
      highRiskStaff.forEach(staff => {
        console.log(`${staff.name} (${staff.department}): Score ${staff.score}`);
        const factors = JSON.parse(staff.factors);
        console.log(`  Factors: Base(${factors.baseScore}) + Consecutive(${factors.consecutiveDays}) + Overtime(${factors.overtimeHours}) + Weekly(${factors.weeklyHours}) + Weekend(${factors.weekendWork})`);
      });
    } else {
      console.log('No high-risk staff found');
    }
    
    // Show recent work hours sample
    console.log('\nRECENT WORK HOURS SAMPLE (Last 3 days):');
    console.log('---------------------------------------');
    const recentWork = db.prepare(`
      SELECT s.name, s.department, wh.date, wh.hours_worked, wh.overtime_hours
      FROM work_hours wh
      JOIN staff s ON wh.staff_id = s.id
      WHERE wh.date >= date('now', '-3 days')
      ORDER BY wh.date DESC, s.name
      LIMIT 10
    `).all();
    
    recentWork.forEach(work => {
      console.log(`${work.date}: ${work.name} (${work.department}) - ${work.hours_worked}h + ${work.overtime_hours}h OT`);
    });
    
    // Show active alerts
    console.log('\nACTIVE ALERTS:');
    console.log('--------------');
    const alerts = db.prepare(`
      SELECT a.message, a.risk_score, a.created_at, s.name, s.department
      FROM alerts a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.resolved = FALSE
      ORDER BY a.risk_score DESC
    `).all();
    
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        const date = new Date(alert.created_at).toLocaleDateString();
        console.log(`${date}: ${alert.message} (${alert.name} - ${alert.department})`);
      });
    } else {
      console.log('No active alerts');
    }
    
    console.log('\n✅ Data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Data verification failed:', error.message);
    console.error(error.stack);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyData();
}

module.exports = { verifyData };