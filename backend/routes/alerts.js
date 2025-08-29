const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const { 
  getActiveAlerts, 
  getAllAlerts, 
  resolveAlert, 
  getAlertStats 
} = require('../services/alertService');

const router = express.Router();

/**
 * GET /api/alerts
 * Get alerts with filtering and pagination
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const { resolved, page = 1, limit = 20 } = req.query;
    
    // Convert resolved parameter to boolean or null
    let resolvedFilter = null;
    if (resolved === 'true') resolvedFilter = true;
    else if (resolved === 'false') resolvedFilter = false;
    
    const result = getAllAlerts(parseInt(page), parseInt(limit), resolvedFilter);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ALERTS_ERROR',
        message: 'Failed to retrieve alerts'
      }
    });
  }
});

/**
 * GET /api/alerts/active
 * Get only active (unresolved) alerts
 */
router.get('/active', authenticateToken, (req, res) => {
  try {
    const activeAlerts = getActiveAlerts();
    
    res.json({
      success: true,
      data: {
        alerts: activeAlerts,
        count: activeAlerts.length
      }
    });
    
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ALERTS_ERROR',
        message: 'Failed to retrieve active alerts'
      }
    });
  }
});

/**
 * PUT /api/alerts/:id/resolve
 * Resolve an alert
 */
router.put('/:id/resolve', authenticateToken, validateId, (req, res) => {
  try {
    const { id } = req.params;
    
    const success = resolveAlert(parseInt(id));
    
    if (success) {
      res.json({
        success: true,
        data: {
          message: 'Alert resolved successfully'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }
    
  } catch (error) {
    console.error('Resolve alert error:', error);
    
    if (error.message === 'Alert not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'ALERTS_ERROR',
          message: 'Failed to resolve alert'
        }
      });
    }
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = getAlertStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ALERTS_ERROR',
        message: 'Failed to retrieve alert statistics'
      }
    });
  }
});

module.exports = router;