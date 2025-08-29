const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * JWT Authentication middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token is required'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, manager) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    // Verify manager still exists in database
    try {
      const managerQuery = db.prepare('SELECT id, name, email FROM managers WHERE id = ?');
      const managerData = managerQuery.get(manager.id);
      
      if (!managerData) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'MANAGER_NOT_FOUND',
            message: 'Manager account no longer exists'
          }
        });
      }

      req.manager = managerData;
      next();
    } catch (error) {
      console.error('Database error in auth middleware:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Authentication verification failed'
        }
      });
    }
  });
};

module.exports = {
  authenticateToken
};