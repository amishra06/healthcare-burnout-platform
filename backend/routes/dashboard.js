const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  getRiskDistribution, 
  getTopRiskStaff, 
  getAllCurrentRiskScores 
} = require('../services/riskCalculation');
const db = require('../config/database');

const router = express.Router();

/**
 * GET /api/dashboard/overview
 * Get dashboard overview with risk distribution, top risk staff, and active alerts
 */
router.get('/overview', authenticateToken, (req, res) => {
  try {
    // Get total staff count
    const totalStaffQuery = db.prepare('SELECT COUNT(*) as count FROM staff');
    const totalStaffResult = totalStaffQuery.get();
    const totalStaff = totalStaffResult.count;

    // Get risk distribution
    const riskDistribution = getRiskDistribution();

    // Get top 5 highest risk staff
    const topRiskStaff = getTopRiskStaff(5);

    // Get active alerts (unresolved alerts)
    const activeAlertsQuery = db.prepare(`
      SELECT 
        a.id,
        a.message,
        a.risk_score,
        a.created_at,
        s.id as staff_id,
        s.name as staff_name,
        s.department
      FROM alerts a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.resolved = FALSE
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    const activeAlerts = activeAlertsQuery.all();

    res.json({
      success: true,
      data: {
        totalStaff,
        riskDistribution,
        topRiskStaff,
        activeAlerts,
        summary: {
          highRiskCount: riskDistribution.High || 0,
          mediumRiskCount: riskDistribution.Medium || 0,
          lowRiskCount: riskDistribution.Low || 0,
          activeAlertsCount: activeAlerts.length
        }
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to load dashboard overview'
      }
    });
  }
});

/**
 * GET /api/dashboard/risk-distribution
 * Get detailed risk distribution statistics
 */
router.get('/risk-distribution', authenticateToken, (req, res) => {
  try {
    const riskDistribution = getRiskDistribution();
    
    // Get risk distribution by department
    const departmentRiskQuery = db.prepare(`
      SELECT 
        s.department,
        COALESCE(rs.risk_level, 'Low') as risk_level,
        COUNT(*) as count
      FROM staff s
      LEFT JOIN risk_scores rs ON s.id = rs.staff_id 
        AND rs.date = (
          SELECT MAX(date) 
          FROM risk_scores rs2 
          WHERE rs2.staff_id = s.id
        )
      GROUP BY s.department, COALESCE(rs.risk_level, 'Low')
      ORDER BY s.department, risk_level
    `);
    
    const departmentRiskData = departmentRiskQuery.all();
    
    // Transform department data into a more usable format
    const departmentRisk = {};
    departmentRiskData.forEach(row => {
      if (!departmentRisk[row.department]) {
        departmentRisk[row.department] = { Low: 0, Medium: 0, High: 0 };
      }
      departmentRisk[row.department][row.risk_level] = row.count;
    });

    res.json({
      success: true,
      data: {
        overall: riskDistribution,
        byDepartment: departmentRisk
      }
    });

  } catch (error) {
    console.error('Risk distribution error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to get risk distribution'
      }
    });
  }
});

/**
 * GET /api/dashboard/top-risk-staff
 * Get top N highest risk staff members
 */
router.get('/top-risk-staff', authenticateToken, (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topRiskStaff = getTopRiskStaff(parseInt(limit));

    res.json({
      success: true,
      data: {
        topRiskStaff,
        count: topRiskStaff.length
      }
    });

  } catch (error) {
    console.error('Top risk staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to get top risk staff'
      }
    });
  }
});

/**
 * GET /api/dashboard/risk-trends
 * Get risk trend data over time
 */
router.get('/risk-trends', authenticateToken, (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Get daily risk score averages
    const trendQuery = db.prepare(`
      SELECT 
        date,
        AVG(score) as avg_score,
        COUNT(*) as staff_count,
        SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risk_count,
        SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium_risk_count,
        SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low_risk_count
      FROM risk_scores
      WHERE date >= date('now', '-' || ? || ' days')
      GROUP BY date
      ORDER BY date DESC
    `);
    
    const trendData = trendQuery.all(days);

    res.json({
      success: true,
      data: {
        trends: trendData,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Risk trends error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to get risk trends'
      }
    });
  }
});

/**
 * GET /api/dashboard/alerts
 * Get alerts with filtering options
 */
router.get('/alerts', authenticateToken, (req, res) => {
  try {
    const { resolved = 'false', limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        a.id,
        a.message,
        a.risk_score,
        a.resolved,
        a.resolved_at,
        a.created_at,
        s.id as staff_id,
        s.name as staff_name,
        s.department,
        s.role
      FROM alerts a
      JOIN staff s ON a.staff_id = s.id
    `;
    
    const params = [];
    
    if (resolved !== 'all') {
      query += ' WHERE a.resolved = ?';
      params.push(resolved === 'true');
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const alertsQuery = db.prepare(query);
    const alerts = alertsQuery.all(...params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM alerts a';
    const countParams = [];
    
    if (resolved !== 'all') {
      countQuery += ' WHERE a.resolved = ?';
      countParams.push(resolved === 'true');
    }
    
    const countResult = db.prepare(countQuery).get(...countParams);
    const totalCount = countResult.count;

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + alerts.length) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Dashboard alerts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to get alerts'
      }
    });
  }
});

module.exports = router;