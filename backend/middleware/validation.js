const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      }
    });
  }
  next();
};

/**
 * Login validation rules
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Staff creation validation rules
 */
const validateStaffCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('department')
    .isIn(['ICU', 'Emergency', 'General'])
    .withMessage('Department must be ICU, Emergency, or General'),
  body('role')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role must be between 2 and 50 characters'),
  body('hire_date')
    .isISO8601()
    .toDate()
    .withMessage('Valid hire date is required (YYYY-MM-DD format)'),
  handleValidationErrors
];

/**
 * Staff update validation rules
 */
const validateStaffUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('department')
    .optional()
    .isIn(['ICU', 'Emergency', 'General'])
    .withMessage('Department must be ICU, Emergency, or General'),
  body('role')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role must be between 2 and 50 characters'),
  handleValidationErrors
];

/**
 * Work hours validation rules
 */
const validateWorkHours = [
  body('staff_id')
    .isInt({ min: 1 })
    .withMessage('Valid staff ID is required'),
  body('date')
    .isISO8601()
    .toDate()
    .withMessage('Valid date is required (YYYY-MM-DD format)'),
  body('hours_worked')
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours worked must be between 0 and 24'),
  body('overtime_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime hours must be 0 or greater'),
  handleValidationErrors
];

/**
 * Work hours update validation rules
 */
const validateWorkHoursUpdate = [
  body('hours_worked')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours worked must be between 0 and 24'),
  body('overtime_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime hours must be 0 or greater'),
  handleValidationErrors
];

/**
 * ID parameter validation
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateStaffCreation,
  validateStaffUpdate,
  validateWorkHours,
  validateWorkHoursUpdate,
  validateId,
  validatePagination,
  handleValidationErrors
};