#!/usr/bin/env node

/**
 * Standalone script to seed the database with comprehensive dummy data
 * Run this with: node run-seeding.js
 */

const path = require('path');
const fs = require('fs');

// Check if database exists
const dbPath = path.join(__dirname, 'database', 'healthcare_burnout.db');
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found. Please run database initialization first.');
  console.log('Visit http://localhost:3001/setup.html and click "Initialize Database"');
  process.exit(1);
}

// Run the comprehensive seeding
console.log('🚀 Starting comprehensive database seeding...');
console.log('This will create staff, work hours, risk scores, and alerts with varied risk levels.\n');

try {
  require('./seed-complete-data.js');
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nYou now have:');
  console.log('- 15 staff members across ICU, Emergency, and General departments');
  console.log('- 30 days of work hours data with varied patterns');
  console.log('- 14 days of calculated risk scores');
  console.log('- Automatic alerts for high-risk staff');
  console.log('\nYou can now test the application with realistic data!');
} catch (error) {
  console.error('❌ Error during seeding:', error.message);
  process.exit(1);
}