const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateWorkHours, 
  validateWorkHoursUpdate, 
  validateId 
} = require('../middleware/validation');
const { updateStaffRiskScore } = require('../services/riskCalculation');
const { processRiskScoreChange } = require('../services/alertService');

const router = express.Router();

/**
 * POST /api/work-hours
 * Create new work hours entry
 */
router.post('/', authenticateToken, validateWorkHours, (req, res) => {
  try {
    const { staff_id, date, hours_worked, overtime_hours = 0 } = req.body;

    // Verify staff exists
    const staffQuery = db.prepare('SELECT id, name FROM staff WHERE id = ?');
    const staff = staffQuery.get(staff_id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found'
        }
      });
    }

    // Check if work hours already exist for this date
    const existingQuery = db.prepare('SELECT id FROM work_hours WHERE staff_id = ? AND date = ?');
    const existing = existingQuery.get(staff_id, date);

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'WORK_HOURS_EXIST',
          message: 'Work hours already recorded for this date. Use PUT to update.'
        }
      });
    }

    // Insert work hours
    const insertQuery = db.prepare(`
      INSERT INTO work_hours (staff_id, date, hours_worked, overtime_hours)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertQuery.run(staff_id, date, hours_worked, overtime_hours);

    // Get the created work hours entry
    const newWorkHoursQuery = db.prepare('SELECT * FROM work_hours WHERE id = ?');
    const newWorkHours = newWorkHoursQuery.get(result.lastInsertRowid);

    // Update risk score for the staff member
    let updatedRiskScore = null;
    let alertCreated = false;
    try {
      updatedRiskScore = updateStaffRiskScore(staff_id, date);
      
      // Check if alert should be created for high risk
      if (updatedRiskScore && updatedRiskScore.score >= 71) {
        try {
          const alertId = processRiskScoreChange(staff_id, updatedRiskScore.score);
          if (alertId) {
            alertCreated = true;
            console.log(`Alert created for staff ${staff_id} with risk score ${updatedRiskScore.score}`);
          }
        } catch (alertError) {
          console.error('Failed to create alert:', alertError);
        }
      }
    } catch (riskError) {
      console.error('Failed to update risk score:', riskError);
      // Continue with response even if risk calculation fails
    }

    res.status(201).json({
      success: true,
      data: {
        workHour: newWorkHours,
        updatedRiskScore: updatedRiskScore ? updatedRiskScore.score : null,
        alertCreated,
        message: 'Work hours recorded successfully'
      }
    });

  } catch (error) {
    console.error('Create work hours error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to record work hours'
      }
    });
  }
});

/**
 * GET /api/work-hours/:staff_id
 * Get work hours for a specific staff member
 */
router.get('/:staff_id', authenticateToken, validateId, (req, res) => {
  try {
    const { staff_id } = req.params;
    const { start_date, end_date, limit = 100 } = req.query;

    // Verify staff exists
    const staffQuery = db.prepare('SELECT id, name FROM staff WHERE id = ?');
    const staff = staffQuery.get(staff_id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found'
        }
      });
    }

    // Build query with optional date filtering
    let query = 'SELECT * FROM work_hours WHERE staff_id = ?';
    const params = [staff_id];

    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY date DESC LIMIT ?';
    params.push(parseInt(limit));

    const workHoursQuery = db.prepare(query);
    const workHours = workHoursQuery.all(...params);

    // Calculate summary statistics
    const totalHours = workHours.reduce((sum, wh) => sum + wh.hours_worked, 0);
    const totalOvertime = workHours.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0);
    const averageDaily = workHours.length > 0 ? totalHours / workHours.length : 0;

    res.json({
      success: true,
      data: {
        staff: {
          id: staff.id,
          name: staff.name
        },
        workHours,
        summary: {
          totalEntries: workHours.length,
          totalHours: Math.round(totalHours * 100) / 100,
          totalOvertime: Math.round(totalOvertime * 100) / 100,
          averageDaily: Math.round(averageDaily * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Get work hours error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve work hours'
      }
    });
  }
});

/**
 * PUT /api/work-hours/:id
 * Update existing work hours entry
 */
router.put('/:id', authenticateToken, validateId, validateWorkHoursUpdate, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if work hours entry exists
    const existingQuery = db.prepare(`
      SELECT wh.*, s.name as staff_name 
      FROM work_hours wh 
      JOIN staff s ON wh.staff_id = s.id 
      WHERE wh.id = ?
    `);
    const existing = existingQuery.get(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORK_HOURS_NOT_FOUND',
          message: 'Work hours entry not found'
        }
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (updates.hours_worked !== undefined) {
      updateFields.push('hours_worked = ?');
      updateValues.push(updates.hours_worked);
    }

    if (updates.overtime_hours !== undefined) {
      updateFields.push('overtime_hours = ?');
      updateValues.push(updates.overtime_hours);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update'
        }
      });
    }

    updateValues.push(id);

    const updateQuery = db.prepare(`
      UPDATE work_hours 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

    updateQuery.run(...updateValues);

    // Get updated work hours entry
    const updatedWorkHours = existingQuery.get(id);

    // Update risk score for the staff member
    let updatedRiskScore = null;
    let alertCreated = false;
    try {
      updatedRiskScore = updateStaffRiskScore(updatedWorkHours.staff_id, updatedWorkHours.date);
      
      // Check if alert should be created for high risk
      if (updatedRiskScore && updatedRiskScore.score >= 71) {
        try {
          const alertId = processRiskScoreChange(updatedWorkHours.staff_id, updatedRiskScore.score);
          if (alertId) {
            alertCreated = true;
            console.log(`Alert created for staff ${updatedWorkHours.staff_id} with risk score ${updatedRiskScore.score}`);
          }
        } catch (alertError) {
          console.error('Failed to create alert:', alertError);
        }
      }
    } catch (riskError) {
      console.error('Failed to update risk score:', riskError);
      // Continue with response even if risk calculation fails
    }

    res.json({
      success: true,
      data: {
        workHour: updatedWorkHours,
        updatedRiskScore: updatedRiskScore ? updatedRiskScore.score : null,
        alertCreated,
        message: 'Work hours updated successfully'
      }
    });

  } catch (error) {
    console.error('Update work hours error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update work hours'
      }
    });
  }
});

/**
 * DELETE /api/work-hours/:id
 * Delete work hours entry
 */
router.delete('/:id', authenticateToken, validateId, (req, res) => {
  try {
    const { id } = req.params;

    // Check if work hours entry exists
    const existingQuery = db.prepare(`
      SELECT wh.*, s.name as staff_name 
      FROM work_hours wh 
      JOIN staff s ON wh.staff_id = s.id 
      WHERE wh.id = ?
    `);
    const existing = existingQuery.get(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORK_HOURS_NOT_FOUND',
          message: 'Work hours entry not found'
        }
      });
    }

    // Delete work hours entry
    const deleteQuery = db.prepare('DELETE FROM work_hours WHERE id = ?');
    deleteQuery.run(id);

    // Update risk score for the staff member after deletion
    try {
      updateStaffRiskScore(existing.staff_id);
    } catch (riskError) {
      console.error('Failed to update risk score after deletion:', riskError);
      // Continue with response even if risk calculation fails
    }

    res.json({
      success: true,
      data: {
        message: 'Work hours entry deleted successfully'
      }
    });

  } catch (error) {
    console.error('Delete work hours error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete work hours entry'
      }
    });
  }
});

module.exports = router;