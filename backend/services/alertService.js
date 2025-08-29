const db = require('../utils/database');
const { sendHighRiskAlert } = require('./emailService');

/**
 * Alert Service
 * Handles creation and management of burnout risk alerts
 */

/**
 * Create alert for high-risk staff member
 */
function createAlert(staffId, riskScore, message = null) {
  try {
    // Get staff information
    const staffQuery = db.prepare('SELECT name, department, role FROM staff WHERE id = ?');
    const staff = staffQuery.get(staffId);
    
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Generate alert message if not provided
    const alertMessage = message || generateAlertMessage(staff, riskScore);

    // Check if there's already an unresolved alert for this staff member
    const existingQuery = db.prepare(`
      SELECT id FROM alerts 
      WHERE staff_id = ? AND resolved = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const existingAlert = existingQuery.get(staffId);

    if (existingAlert) {
      // Update existing alert with new risk score
      const updateQuery = db.prepare(`
        UPDATE alerts 
        SET risk_score = ?, message = ?
        WHERE id = ?
      `);
      updateQuery.run(riskScore, alertMessage, existingAlert.id);
      
      // Send email notification for updated high-risk alert
      try {
        sendHighRiskAlert(staff, riskScore);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
      
      return existingAlert.id;
    } else {
      // Create new alert
      const insertQuery = db.prepare(`
        INSERT INTO alerts (staff_id, message, risk_score)
        VALUES (?, ?, ?)
      `);
      const result = insertQuery.run(staffId, alertMessage, riskScore);
      
      // Send email notification for new high-risk alert
      try {
        sendHighRiskAlert(staff, riskScore);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
      
      return result.lastInsertRowid;
    }
  } catch (error) {
    console.error('Error creating alert:', error);
    throw new Error('Failed to create alert');
  }
}

/**
 * Generate alert message based on staff info and risk score
 */
function generateAlertMessage(staff, riskScore) {
  const riskLevel = riskScore >= 71 ? 'HIGH' : riskScore >= 41 ? 'MEDIUM' : 'LOW';
  
  return `${riskLevel} RISK ALERT: ${staff.name} (${staff.department} - ${staff.role}) has a burnout risk score of ${riskScore}. Immediate attention recommended.`;
}

/**
 * Resolve alert
 */
function resolveAlert(alertId) {
  try {
    const updateQuery = db.prepare(`
      UPDATE alerts 
      SET resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = updateQuery.run(alertId);
    
    if (result.changes === 0) {
      throw new Error('Alert not found');
    }
    
    return true;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw new Error('Failed to resolve alert');
  }
}

/**
 * Get active (unresolved) alerts
 */
function getActiveAlerts() {
  try {
    const query = db.prepare(`
      SELECT 
        a.id,
        a.staff_id,
        a.message,
        a.risk_score,
        a.created_at,
        s.name as staff_name,
        s.department,
        s.role
      FROM alerts a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.resolved = FALSE
      ORDER BY a.risk_score DESC, a.created_at DESC
    `);
    
    return query.all();
  } catch (error) {
    console.error('Error getting active alerts:', error);
    throw new Error('Failed to get active alerts');
  }
}

/**
 * Get all alerts with pagination
 */
function getAllAlerts(page = 1, limit = 20, resolved = null) {
  try {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    
    if (resolved !== null) {
      whereClause = 'WHERE a.resolved = ?';
      params.push(resolved);
    }
    
    const query = db.prepare(`
      SELECT 
        a.id,
        a.staff_id,
        a.message,
        a.risk_score,
        a.resolved,
        a.resolved_at,
        a.created_at,
        s.name as staff_name,
        s.department,
        s.role
      FROM alerts a
      JOIN staff s ON a.staff_id = s.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    params.push(limit, offset);
    const alerts = query.all(...params);
    
    // Get total count for pagination
    const countQuery = db.prepare(`
      SELECT COUNT(*) as total
      FROM alerts a
      ${whereClause}
    `);
    
    const countParams = resolved !== null ? [resolved] : [];
    const { total } = countQuery.get(...countParams);
    
    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all alerts:', error);
    throw new Error('Failed to get alerts');
  }
}

/**
 * Check if alert should be created based on risk score
 */
function shouldCreateAlert(riskScore, previousRiskScore = null) {
  // Create alert if risk score is high (>= 71)
  if (riskScore >= 71) {
    // Only create if this is a new high risk or significant increase
    if (!previousRiskScore || previousRiskScore < 71 || riskScore > previousRiskScore + 10) {
      return true;
    }
  }
  
  return false;
}

/**
 * Process risk score change and create alert if needed
 */
function processRiskScoreChange(staffId, newRiskScore, previousRiskScore = null) {
  try {
    if (shouldCreateAlert(newRiskScore, previousRiskScore)) {
      const alertId = createAlert(staffId, newRiskScore);
      console.log(`Alert created for staff ${staffId} with risk score ${newRiskScore}`);
      return alertId;
    }
    
    return null;
  } catch (error) {
    console.error('Error processing risk score change:', error);
    throw error;
  }
}

/**
 * Get alert statistics
 */
function getAlertStats() {
  try {
    const query = db.prepare(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN resolved = FALSE THEN 1 END) as active_alerts,
        COUNT(CASE WHEN resolved = TRUE THEN 1 END) as resolved_alerts,
        COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as alerts_this_week
      FROM alerts
    `);
    
    return query.get();
  } catch (error) {
    console.error('Error getting alert stats:', error);
    throw new Error('Failed to get alert statistics');
  }
}

module.exports = {
  createAlert,
  resolveAlert,
  getActiveAlerts,
  getAllAlerts,
  shouldCreateAlert,
  processRiskScoreChange,
  getAlertStats,
  generateAlertMessage
};