#!/usr/bin/env node

/**
 * Database setup and seeding script
 * Run this script to initialize the database schema and populate with sample data
 */

require('dotenv').config();
const { setupDatabase } = require('../utils/database');

async function main() {
  console.log('Healthcare Burnout Prevention Platform - Database Setup');
  console.log('====================================================');

  try {
    const success = await setupDatabase();

    if (success) {
      console.log('\n✅ Database setup completed successfully!');
      console.log('\nYou can now start the server with: npm run dev');
      process.exit(0);
    } else {
      console.error('\n❌ Database setup failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Database setup failed with error:', error.message);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };