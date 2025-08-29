const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate manager and return JWT token
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find manager by email
    const managerQuery = db.prepare('SELECT * FROM managers WHERE email = ?');
    const manager = managerQuery.get(email);

    if (!manager) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, manager.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: manager.id, 
        email: manager.email 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Return success response
    res.json({
      success: true,
      data: {
        token,
        manager: {
          id: manager.id,
          name: manager.name,
          email: manager.email
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Login failed due to server error'
      }
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint (client-side token removal)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // This endpoint exists for consistency and future token blacklisting
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return manager info
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      manager: req.manager
    }
  });
});

module.exports = router;