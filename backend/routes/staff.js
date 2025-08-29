const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateStaffCreation, 
  validateStaffUpdate, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/staff
 * Get all staff with optional filtering and pagination
 */
router.get('/', authenticateToken, validatePagination, (req, res) => {
  try {
    const { department, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Build query with optional department filter
    let query = 'SELECT * FROM staff';
    let countQuery = 'SELECT COUNT(*) as total FROM staff';
    const params = [];

    if (department) {
      query += ' WHERE department = ?';
      countQuery += ' WHERE department = ?';
      params.push(department);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    // Get staff data
    const staffQuery = db.prepare(query);
    const staff = staffQuery.all(...params);

    // Get total count for pagination
    const totalQuery = db.prepare(countQuery);
    const totalResult = totalQuery.get(...(department ? [department] : []));
    const total = totalResult.total;

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      }
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve staff data'
      }
    });
  }
});

/**
 * GET /api/staff/:id
 * Get specific staff member with additional details
 */
router.get('/:id', authenticateToken, validateId, (req, res) => {
  try {
    const { id } = req.params;

    // Get staff basic info
    const staffQuery = db.prepare('SELECT * FROM staff WHERE id = ?');
    const staff = staffQuery.get(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found'
        }
      });
    }

    // Get recent work hours (last 30 days)
    const workHoursQuery = db.prepare(`
      SELECT * FROM work_hours 
      WHERE staff_id = ? 
      AND date >= date('now', '-30 days')
      ORDER BY date DESC
    `);
    const workHours = workHoursQuery.all(id);

    // Get recent risk scores (last 30 days)
    const riskScoresQuery = db.prepare(`
      SELECT * FROM risk_scores 
      WHERE staff_id = ? 
      AND date >= date('now', '-30 days')
      ORDER BY date DESC
    `);
    const riskHistory = riskScoresQuery.all(id);

    res.json({
      success: true,
      data: {
        staff,
        workHours,
        riskHistory
      }
    });

  } catch (error) {
    console.error('Get staff detail error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve staff details'
      }
    });
  }
});

/**
 * POST /api/staff
 * Create new staff member
 */
router.post('/', authenticateToken, validateStaffCreation, (req, res) => {
  try {
    const { name, email, department, role, hire_date } = req.body;

    // Check if email already exists
    const existingStaffQuery = db.prepare('SELECT id FROM staff WHERE email = ?');
    const existingStaff = existingStaffQuery.get(email);

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'A staff member with this email already exists'
        }
      });
    }

    // Convert Date object to ISO string for SQLite
    const hireDateString = hire_date instanceof Date ? hire_date.toISOString().split('T')[0] : hire_date;

    // Insert new staff member
    const insertQuery = db.prepare(`
      INSERT INTO staff (name, email, department, role, hire_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertQuery.run(name, email, department, role, hireDateString);

    // Get the created staff member
    const newStaffQuery = db.prepare('SELECT * FROM staff WHERE id = ?');
    const newStaff = newStaffQuery.get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: {
        staff: newStaff
      }
    });

  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create staff member'
      }
    });
  }
});

/**
 * PUT /api/staff/:id
 * Update existing staff member
 */
router.put('/:id', authenticateToken, validateId, validateStaffUpdate, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if staff exists
    const existingStaffQuery = db.prepare('SELECT * FROM staff WHERE id = ?');
    const existingStaff = existingStaffQuery.get(id);

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found'
        }
      });
    }

    // Check if email is being updated and already exists
    if (updates.email && updates.email !== existingStaff.email) {
      const emailCheckQuery = db.prepare('SELECT id FROM staff WHERE email = ? AND id != ?');
      const emailExists = emailCheckQuery.get(updates.email, id);

      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'A staff member with this email already exists'
          }
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (['name', 'email', 'department', 'role'].includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update'
        }
      });
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = db.prepare(`
      UPDATE staff 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

    updateQuery.run(...updateValues);

    // Get updated staff member
    const updatedStaff = existingStaffQuery.get(id);

    res.json({
      success: true,
      data: {
        staff: updatedStaff
      }
    });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update staff member'
      }
    });
  }
});

/**
 * DELETE /api/staff/:id
 * Delete staff member
 */
router.delete('/:id', authenticateToken, validateId, (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff exists
    const existingStaffQuery = db.prepare('SELECT * FROM staff WHERE id = ?');
    const existingStaff = existingStaffQuery.get(id);

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found'
        }
      });
    }

    // Delete staff member (cascade will handle related records)
    const deleteQuery = db.prepare('DELETE FROM staff WHERE id = ?');
    deleteQuery.run(id);

    res.json({
      success: true,
      data: {
        message: 'Staff member deleted successfully'
      }
    });

  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete staff member'
      }
    });
  }
});

module.exports = router;