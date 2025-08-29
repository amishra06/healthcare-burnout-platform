// Test setup file
// This will be used for test configuration and setup

const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:'; // Use in-memory database for tests
process.env.JWT_SECRET = 'test-jwt-secret';

module.exports = {};