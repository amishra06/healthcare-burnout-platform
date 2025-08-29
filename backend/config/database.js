const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.dirname(process.env.DB_PATH || './database/healthcare_burnout.db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new Database(process.env.DB_PATH || './database/healthcare_burnout.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

module.exports = db;