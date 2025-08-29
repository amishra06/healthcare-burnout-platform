const db = require('../config/database');

/**
 * Risk Calculation Service
 * Implements the burnout risk scoring algorithm as defined in requirements
 */

/**
 * Calculate burnout risk score for a staff member
 * Algorithm:
 * - Base score: 20 points
 * - Consecutive work days: +10 points per day (max 30)
 * - Overtime hours this week: +15 points per hour (max 25)
 * - Weekly hours > 60: +20 points
 * - Weekend work this month: +5 points per weekend (max 15)
 * 
 * Risk levels:
 * - Low: 0-40
 * - Medium: 41-70
 * - High: 71-100
 */
function calculateRiskScore(staffId, targetDate = null) {
  try {
    const date = targetDate || new Date().toISOString().split('T')[0];
    
    let score = 20; // Base score
    const factors = {
      baseScore: 20,
      consecutiveDays: 0,
      overtimeHours: 0,
      weeklyHours: 0,
      weekendWork: 0
    };

    // Calculate consecutive work days (max +30)
    const consecutiveDays = getConsecutiveWorkDays(staffId, date);
    const consecutivePoints = Math.min(consecutiveDays * 10, 30);
    factors.consecutiveDays = consecutivePoints;
    score += consecutivePoints;

    // Calculate overtime hours this week (max +25)
    const weeklyOvertime = getWeeklyOvertimeHours(staffId, date);
    const overtimePoints = Math.min(weeklyOvertime * 15, 25);
    factors.overtimeHours = overtimePoints;
    score += overtimePoints;

    // Check if >60 hours worked this week (+20)
    const weeklyHours = getWeeklyTotalHours(staffId, date);
    if (weeklyHours > 60) {
      factors.weeklyHours = 20;
      score += 20;
    }

    // Calculate weekend work this month (max +15)
    const weekendDays = getMonthlyWeekendWork(staffId, date);
    const weekendPoints = Math.min(weekendDays * 5, 15);
    factors.weekendWork = weekendPoints;
    score += weekendPoints;

    // Ensure score doesn't exceed 100
    score = Math.min(score, 100);

    // Determine risk level
    let riskLevel;
    if (score <= 40) riskLevel = 'Low';
    else if (score <= 70) riskLevel = 'Medium';
    else riskLevel = 'High';

    return { 
      score, 
      riskLevel, 
      factors,
      calculatedDate: date,
      weeklyHours,
      weeklyOvertime,
      consecutiveDays,
      weekendDays
    };
  } catch (error) {
    console.error('Error calculating risk score:', error);
    throw new Error('Failed to calculate risk score');
  }
}

/**
 * Get consecutive work days ending on or before the target date
 */
function getConsecutiveWorkDays(staffId, targetDate) {
  try {
    const query = db.prepare(`
      SELECT date, hours_worked 
      FROM work_hours 
      WHERE staff_id = ? AND date <= ? AND hours_worked > 0
      ORDER BY date DESC
      LIMIT 30
    `);
    
    const workDays = query.all(staffId, targetDate);
    
    if (workDays.length === 0) return 0;
    
    let consecutiveDays = 0;
    let currentDate = new Date(targetDate);
    
    for (const workDay of workDays) {
      const workDate = new Date(workDay.date);
      
      // Check if this work day is consecutive
      if (workDate.getTime() === currentDate.getTime()) {
        consecutiveDays++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Gap found, stop counting
        break;
      }
    }
    
    return consecutiveDays;
  } catch (error) {
    console.error('Error getting consecutive work days:', error);
    return 0;
  }
}

/**
 * Get total overtime hours for the week containing the target date
 */
function getWeeklyOvertimeHours(staffId, targetDate) {
  try {
    const { weekStart, weekEnd } = getWeekBounds(targetDate);
    
    const query = db.prepare(`
      SELECT COALESCE(SUM(overtime_hours), 0) as total_overtime
      FROM work_hours 
      WHERE staff_id = ? AND date >= ? AND date <= ?
    `);
    
    const result = query.get(staffId, weekStart, weekEnd);
    return result.total_overtime || 0;
  } catch (error) {
    console.error('Error getting weekly overtime hours:', error);
    return 0;
  }
}

/**
 * Get total hours worked for the week containing the target date
 */
function getWeeklyTotalHours(staffId, targetDate) {
  try {
    const { weekStart, weekEnd } = getWeekBounds(targetDate);
    
    const query = db.prepare(`
      SELECT COALESCE(SUM(hours_worked + COALESCE(overtime_hours, 0)), 0) as total_hours
      FROM work_hours 
      WHERE staff_id = ? AND date >= ? AND date <= ?
    `);
    
    const result = query.get(staffId, weekStart, weekEnd);
    return result.total_hours || 0;
  } catch (error) {
    console.error('Error getting weekly total hours:', error);
    return 0;
  }
}

/**
 * Get number of weekends worked in the month containing the target date
 */
function getMonthlyWeekendWork(staffId, targetDate) {
  try {
    const { monthStart, monthEnd } = getMonthBounds(targetDate);
    
    const query = db.prepare(`
      SELECT date, hours_worked
      FROM work_hours 
      WHERE staff_id = ? AND date >= ? AND date <= ? AND hours_worked > 0
    `);
    
    const workDays = query.all(staffId, monthStart, monthEnd);
    
    let weekendsWorked = 0;
    const weekendsInMonth = new Set();
    
    workDays.forEach(workDay => {
      const date = new Date(workDay.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend day
        // Get the Sunday of this weekend to avoid double counting
        const sunday = new Date(date);
        sunday.setDate(date.getDate() - dayOfWeek);
        const weekendKey = sunday.toISOString().split('T')[0];
        weekendsInMonth.add(weekendKey);
      }
    });
    
    return weekendsInMonth.size;
  } catch (error) {
    console.error('Error getting monthly weekend work:', error);
    return 0;
  }
}

/**
 * Get week bounds (Monday to Sunday) for a given date
 */
function getWeekBounds(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  
  // Calculate Monday of this week (day 1)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  
  // Calculate Sunday of this week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0]
  };
}

/**
 * Get month bounds for a given date
 */
function getMonthBounds(dateString) {
  const date = new Date(dateString);
  
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return {
    monthStart: monthStart.toISOString().split('T')[0],
    monthEnd: monthEnd.toISOString().split('T')[0]
  };
}

/**
 * Save or update risk score in database
 */
function saveRiskScore(staffId, riskData) {
  try {
    const { score, riskLevel, factors, calculatedDate } = riskData;
    
    // Check if risk score already exists for this date
    const existingQuery = db.prepare(`
      SELECT id FROM risk_scores 
      WHERE staff_id = ? AND date = ?
    `);
    const existing = existingQuery.get(staffId, calculatedDate);
    
    if (existing) {
      // Update existing risk score
      const updateQuery = db.prepare(`
        UPDATE risk_scores 
        SET score = ?, risk_level = ?, factors = ?
        WHERE staff_id = ? AND date = ?
      `);
      updateQuery.run(score, riskLevel, JSON.stringify(factors), staffId, calculatedDate);
      return existing.id;
    } else {
      // Insert new risk score
      const insertQuery = db.prepare(`
        INSERT INTO risk_scores (staff_id, date, score, risk_level, factors)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insertQuery.run(staffId, calculatedDate, score, riskLevel, JSON.stringify(factors));
      return result.lastInsertRowid;
    }
  } catch (error) {
    console.error('Error saving risk score:', error);
    throw new Error('Failed to save risk score');
  }
}

/**
 * Calculate and save risk score for a staff member
 */
function updateStaffRiskScore(staffId, targetDate = null) {
  try {
    const riskData = calculateRiskScore(staffId, targetDate);
    const riskScoreId = saveRiskScore(staffId, riskData);
    
    return {
      id: riskScoreId,
      ...riskData
    };
  } catch (error) {
    console.error('Error updating staff risk score:', error);
    throw error;
  }
}

/**
 * Get current risk scores for all staff
 */
function getAllCurrentRiskScores() {
  try {
    const query = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.department,
        s.role,
        rs.score,
        rs.risk_level,
        rs.factors,
        rs.date as risk_date
      FROM staff s
      LEFT JOIN risk_scores rs ON s.id = rs.staff_id 
        AND rs.date = (
          SELECT MAX(date) 
          FROM risk_scores rs2 
          WHERE rs2.staff_id = s.id
        )
      ORDER BY rs.score DESC NULLS LAST, s.name
    `);
    
    return query.all();
  } catch (error) {
    console.error('Error getting all current risk scores:', error);
    throw new Error('Failed to get current risk scores');
  }
}

/**
 * Get risk distribution statistics
 */
function getRiskDistribution() {
  try {
    const query = db.prepare(`
      SELECT 
        risk_level,
        COUNT(*) as count
      FROM (
        SELECT DISTINCT
          s.id,
          COALESCE(rs.risk_level, 'Low') as risk_level
        FROM staff s
        LEFT JOIN risk_scores rs ON s.id = rs.staff_id 
          AND rs.date = (
            SELECT MAX(date) 
            FROM risk_scores rs2 
            WHERE rs2.staff_id = s.id
          )
      ) risk_summary
      GROUP BY risk_level
    `);
    
    const results = query.all();
    
    // Ensure all risk levels are represented
    const distribution = { Low: 0, Medium: 0, High: 0 };
    results.forEach(result => {
      distribution[result.risk_level] = result.count;
    });
    
    return distribution;
  } catch (error) {
    console.error('Error getting risk distribution:', error);
    throw new Error('Failed to get risk distribution');
  }
}

/**
 * Get top N highest risk staff members
 */
function getTopRiskStaff(limit = 5) {
  try {
    const query = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.department,
        s.role,
        COALESCE(rs.score, 20) as score,
        COALESCE(rs.risk_level, 'Low') as risk_level,
        rs.factors,
        rs.date as risk_date
      FROM staff s
      LEFT JOIN risk_scores rs ON s.id = rs.staff_id 
        AND rs.date = (
          SELECT MAX(date) 
          FROM risk_scores rs2 
          WHERE rs2.staff_id = s.id
        )
      ORDER BY COALESCE(rs.score, 20) DESC, s.name
      LIMIT ?
    `);
    
    return query.all(limit);
  } catch (error) {
    console.error('Error getting top risk staff:', error);
    throw new Error('Failed to get top risk staff');
  }
}

/**
 * Get risk score history for a staff member
 */
function getStaffRiskHistory(staffId, days = 30) {
  try {
    const query = db.prepare(`
      SELECT 
        date,
        score,
        risk_level,
        factors
      FROM risk_scores
      WHERE staff_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date DESC
    `);
    
    return query.all(staffId, days);
  } catch (error) {
    console.error('Error getting staff risk history:', error);
    throw new Error('Failed to get staff risk history');
  }
}

module.exports = {
  calculateRiskScore,
  updateStaffRiskScore,
  saveRiskScore,
  getAllCurrentRiskScores,
  getRiskDistribution,
  getTopRiskStaff,
  getStaffRiskHistory,
  getConsecutiveWorkDays,
  getWeeklyOvertimeHours,
  getWeeklyTotalHours,
  getMonthlyWeekendWork
};