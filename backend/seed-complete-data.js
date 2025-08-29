const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database', 'healthcare_burnout.db');
const db = new Database(dbPath);

console.log('=== Complete Data Seeding ===');

try {
  // Clear existing data first
  console.log('Clearing existing data...');
  db.prepare('DELETE FROM alerts').run();
  db.prepare('DELETE FROM risk_scores').run();
  db.prepare('DELETE FROM work_hours').run();
  db.prepare('DELETE FROM staff').run();

  // Create comprehensive staff data with varied departments and roles
  const staffData = [
    // ICU Department - High Risk Staff
    {
      name: 'Dr. Sarah Martinez',
      email: 'sarah.martinez@hospital.com',
      department: 'ICU',
      role: 'Critical Care Physician',
      hire_date: '2019-03-15',
      riskProfile: 'high'
    },
    {
      name: 'Jennifer Walsh',
      email: 'jennifer.walsh@hospital.com',
      department: 'ICU',
      role: 'Senior ICU Nurse',
      hire_date: '2018-08-22',
      riskProfile: 'high'
    },
    {
      name: 'Dr. Marcus Thompson',
      email: 'marcus.thompson@hospital.com',
      department: 'ICU',
      role: 'Intensivist',
      hire_date: '2020-01-10',
      riskProfile: 'medium'
    },
    {
      name: 'Lisa Park',
      email: 'lisa.park@hospital.com',
      department: 'ICU',
      role: 'Charge Nurse',
      hire_date: '2021-07-18',
      riskProfile: 'medium'
    },
    {
      name: 'Kevin Martinez',
      email: 'kevin.martinez@hospital.com',
      department: 'ICU',
      role: 'Respiratory Therapist',
      hire_date: '2022-01-20',
      riskProfile: 'low'
    },

    // Emergency Department - Mixed Risk
    {
      name: 'Dr. James Wilson',
      email: 'james.wilson@hospital.com',
      department: 'Emergency',
      role: 'Emergency Physician',
      hire_date: '2019-11-05',
      riskProfile: 'high'
    },
    {
      name: 'Maria Garcia',
      email: 'maria.garcia@hospital.com',
      department: 'Emergency',
      role: 'Trauma Nurse',
      hire_date: '2020-02-14',
      riskProfile: 'high'
    },
    {
      name: 'Dr. Rachel Green',
      email: 'rachel.green@hospital.com',
      department: 'Emergency',
      role: 'Emergency Medicine',
      hire_date: '2021-06-12',
      riskProfile: 'medium'
    },
    {
      name: 'Sarah Williams',
      email: 'sarah.williams@hospital.com',
      department: 'Emergency',
      role: 'Emergency Nurse',
      hire_date: '2022-04-15',
      riskProfile: 'low'
    },

    // General Department - Lower Risk
    {
      name: 'Dr. David Kim',
      email: 'david.kim@hospital.com',
      department: 'General',
      role: 'Internal Medicine',
      hire_date: '2021-05-20',
      riskProfile: 'medium'
    },
    {
      name: 'Anna Smith',
      email: 'anna.smith@hospital.com',
      department: 'General',
      role: 'Registered Nurse',
      hire_date: '2020-09-12',
      riskProfile: 'low'
    },
    {
      name: 'Dr. Amanda Foster',
      email: 'amanda.foster@hospital.com',
      department: 'General',
      role: 'Family Medicine',
      hire_date: '2021-09-08',
      riskProfile: 'low'
    },
    {
      name: 'Thomas Johnson',
      email: 'thomas.johnson@hospital.com',
      department: 'General',
      role: 'Floor Nurse',
      hire_date: '2022-11-30',
      riskProfile: 'low'
    },
    {
      name: 'Dr. Michelle Lee',
      email: 'michelle.lee@hospital.com',
      department: 'General',
      role: 'General Practitioner',
      hire_date: '2020-05-25',
      riskProfile: 'medium'
    },
    {
      name: 'Robert Chen',
      email: 'robert.chen@hospital.com',
      department: 'General',
      role: 'Staff Nurse',
      hire_date: '2023-02-10',
      riskProfile: 'low'
    }
  ];

  // Insert staff
  console.log('Inserting staff members...');
  const insertStaff = db.prepare(`
    INSERT INTO staff (name, email, department, role, hire_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const staffIds = [];
  staffData.forEach(staff => {
    const result = insertStaff.run(staff.name, staff.email, staff.department, staff.role, staff.hire_date);
    staffIds.push({ id: result.lastInsertRowid, ...staff });
    console.log(`✅ Created: ${staff.name} (ID: ${result.lastInsertRowid})`);
  });

  // Generate work hours for the last 30 days
  console.log('\nGenerating work hours...');
  const insertWorkHours = db.prepare(`
    INSERT INTO work_hours (staff_id, date, hours_worked, overtime_hours)
    VALUES (?, ?, ?, ?)
  `);

  const today = new Date();
  const workHoursData = [];

  staffIds.forEach(staff => {
    for (let i = 0; i < 30; i++) {
      const workDate = new Date(today);
      workDate.setDate(today.getDate() - i);
      const dateString = workDate.toISOString().split('T')[0];

      let hoursWorked, overtimeHours;

      // Generate hours based on risk profile
      switch (staff.riskProfile) {
        case 'high':
          // High risk: Long hours, frequent overtime
          hoursWorked = Math.random() < 0.8 ? (10 + Math.random() * 4) : (8 + Math.random() * 2);
          overtimeHours = hoursWorked > 12 ? (hoursWorked - 8) : (hoursWorked > 8 ? hoursWorked - 8 : 0);
          hoursWorked = Math.min(hoursWorked, 8);
          break;
        case 'medium':
          // Medium risk: Moderate hours, some overtime
          hoursWorked = Math.random() < 0.6 ? (9 + Math.random() * 3) : (8 + Math.random() * 1);
          overtimeHours = hoursWorked > 10 ? (hoursWorked - 8) : (hoursWorked > 8 ? hoursWorked - 8 : 0);
          hoursWorked = Math.min(hoursWorked, 8);
          break;
        case 'low':
          // Low risk: Regular hours, minimal overtime
          hoursWorked = 7 + Math.random() * 2;
          overtimeHours = Math.random() < 0.2 ? (Math.random() * 2) : 0;
          break;
      }

      // Round to 1 decimal place
      hoursWorked = Math.round(hoursWorked * 10) / 10;
      overtimeHours = Math.round(overtimeHours * 10) / 10;

      // Skip some days randomly (days off)
      if (Math.random() < 0.15) continue;

      const result = insertWorkHours.run(staff.id, dateString, hoursWorked, overtimeHours);
      workHoursData.push({
        id: result.lastInsertRowid,
        staff_id: staff.id,
        date: dateString,
        hours_worked: hoursWorked,
        overtime_hours: overtimeHours
      });
    }
  });

  console.log(`✅ Generated ${workHoursData.length} work hour entries`);

  // Calculate and insert risk scores
  console.log('\nCalculating risk scores...');
  const insertRiskScore = db.prepare(`
    INSERT INTO risk_scores (staff_id, date, score, risk_level, factors)
    VALUES (?, ?, ?, ?, ?)
  `);

  const calculateRiskScore = (staffId, date) => {
    // Get work hours for the last 7 days from the given date
    const checkDate = new Date(date);
    const weekAgo = new Date(checkDate);
    weekAgo.setDate(checkDate.getDate() - 7);

    const recentWork = workHoursData.filter(wh => 
      wh.staff_id === staffId && 
      new Date(wh.date) >= weekAgo && 
      new Date(wh.date) <= checkDate
    );

    if (recentWork.length === 0) return null;

    // Calculate factors
    const totalHours = recentWork.reduce((sum, wh) => sum + wh.hours_worked + wh.overtime_hours, 0);
    const totalOvertime = recentWork.reduce((sum, wh) => sum + wh.overtime_hours, 0);
    const consecutiveDays = recentWork.length;
    const avgDailyHours = totalHours / Math.max(consecutiveDays, 1);

    // Weekend work check
    const weekendWork = recentWork.filter(wh => {
      const day = new Date(wh.date).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;

    // Base score calculation
    let baseScore = Math.min(avgDailyHours * 5, 40);
    
    // Add penalties
    const overtimePenalty = Math.min(totalOvertime * 2, 20);
    const consecutivePenalty = Math.min(consecutiveDays * 1.5, 15);
    const weekendPenalty = weekendWork * 5;

    const totalScore = Math.round(baseScore + overtimePenalty + consecutivePenalty + weekendPenalty);

    // Determine risk level
    let riskLevel;
    if (totalScore >= 71) riskLevel = 'High';
    else if (totalScore >= 41) riskLevel = 'Medium';
    else riskLevel = 'Low';

    return {
      score: totalScore,
      risk_level: riskLevel,
      factors: {
        baseScore: Math.round(baseScore),
        consecutiveDays: consecutivePenalty,
        overtimeHours: overtimePenalty,
        weeklyHours: Math.round(totalHours),
        weekendWork: weekendPenalty
      }
    };
  };

  // Generate risk scores for the last 14 days
  const riskScoresData = [];
  staffIds.forEach(staff => {
    for (let i = 0; i < 14; i++) {
      const scoreDate = new Date(today);
      scoreDate.setDate(today.getDate() - i);
      const dateString = scoreDate.toISOString().split('T')[0];

      const riskData = calculateRiskScore(staff.id, dateString);
      if (riskData) {
        const result = insertRiskScore.run(
          staff.id,
          dateString,
          riskData.score,
          riskData.risk_level,
          JSON.stringify(riskData.factors)
        );
        riskScoresData.push({
          id: result.lastInsertRowid,
          staff_id: staff.id,
          date: dateString,
          ...riskData
        });
      }
    }
  });

  console.log(`✅ Generated ${riskScoresData.length} risk score entries`);

  // Generate alerts for high-risk scores
  console.log('\nGenerating alerts for high-risk staff...');
  const insertAlert = db.prepare(`
    INSERT INTO alerts (staff_id, type, message, severity, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  let alertCount = 0;
  const highRiskScores = riskScoresData.filter(rs => rs.score >= 71);
  
  highRiskScores.forEach(riskScore => {
    const staff = staffIds.find(s => s.id === riskScore.staff_id);
    if (staff) {
      const message = `High burnout risk detected for ${staff.name}. Risk score: ${riskScore.score}. Immediate attention recommended.`;
      
      insertAlert.run(
        staff.id,
        'burnout_risk',
        message,
        'high',
        new Date(riskScore.date).toISOString()
      );
      alertCount++;
    }
  });

  console.log(`✅ Generated ${alertCount} high-risk alerts`);

  // Final summary
  console.log('\n=== Seeding Complete ===');
  
  const finalCounts = {
    staff: db.prepare('SELECT COUNT(*) as count FROM staff').get().count,
    workHours: db.prepare('SELECT COUNT(*) as count FROM work_hours').get().count,
    riskScores: db.prepare('SELECT COUNT(*) as count FROM risk_scores').get().count,
    alerts: db.prepare('SELECT COUNT(*) as count FROM alerts').get().count
  };

  console.log('Final counts:', finalCounts);

  // Show risk distribution
  const riskDistribution = db.prepare(`
    SELECT 
      s.department,
      rs.risk_level,
      COUNT(*) as count
    FROM staff s
    JOIN risk_scores rs ON s.id = rs.staff_id
    WHERE rs.date = (
      SELECT MAX(date) FROM risk_scores WHERE staff_id = s.id
    )
    GROUP BY s.department, rs.risk_level
    ORDER BY s.department, rs.risk_level
  `).all();

  console.log('\nRisk Distribution by Department:');
  console.table(riskDistribution);

  // Show high-risk staff
  const highRiskStaff = db.prepare(`
    SELECT 
      s.name,
      s.department,
      s.role,
      rs.score,
      rs.risk_level
    FROM staff s
    JOIN risk_scores rs ON s.id = rs.staff_id
    WHERE rs.date = (
      SELECT MAX(date) FROM risk_scores WHERE staff_id = s.id
    )
    AND rs.score >= 71
    ORDER BY rs.score DESC
  `).all();

  if (highRiskStaff.length > 0) {
    console.log('\nHigh-Risk Staff (Score >= 71):');
    console.table(highRiskStaff);
  }

} catch (error) {
  console.error('❌ Error during seeding:', error);
} finally {
  db.close();
}