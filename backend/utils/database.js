const db = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Initialize database with schema
 */
function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    statements.forEach(statement => {
      if (statement.trim()) {
        db.exec(statement);
      }
    });
    
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

/**
 * Check if database tables exist
 */
function checkTablesExist() {
  try {
    const tables = ['managers', 'staff', 'work_hours', 'risk_scores', 'alerts'];
    const query = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
    
    for (const table of tables) {
      const result = query.get(table);
      if (!result) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  try {
    const stats = {};
    const tables = ['managers', 'staff', 'work_hours', 'risk_scores', 'alerts'];
    
    tables.forEach(table => {
      const query = db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
      const result = query.get();
      stats[table] = result.count;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

/**
 * Clear all data from tables (for testing/reset)
 */
function clearDatabase() {
  try {
    console.log('Clearing database...');
    
    // Disable foreign keys temporarily
    db.pragma('foreign_keys = OFF');
    
    // Clear tables in reverse order to avoid foreign key issues
    const tables = ['alerts', 'risk_scores', 'work_hours', 'staff', 'managers'];
    
    tables.forEach(table => {
      db.prepare(`DELETE FROM ${table}`).run();
    });
    
    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
    
    console.log('Database cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    return false;
  }
}

/**
 * Initialize database and seed with sample data if needed
 */
async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Initialize schema
    if (!initializeDatabase()) {
      throw new Error('Failed to initialize database schema');
    }
    
    // Check if seeding is needed
    const { needsSeeding, seedDatabase } = require('../database/seed');
    
    if (needsSeeding()) {
      console.log('Database is empty, seeding with sample data...');
      await seedDatabase();
    } else {
      console.log('Database already contains data, skipping seeding');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  checkTablesExist,
  getDatabaseStats,
  clearDatabase,
  setupDatabase
};