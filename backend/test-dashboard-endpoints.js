/**
 * Manual test script for dashboard endpoints
 * This script tests the dashboard API functionality
 */

const express = require('express');
const request = require('supertest');
const dashboardRoutes = require('./routes/dashboard');

// Create a test app
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use((req, res, next) => {
  req.user = { id: 1, email: 'test@example.com' };
  next();
});

app.use('/api/dashboard', dashboardRoutes);

console.log('Testing Dashboard Endpoints...\n');

async function testDashboardEndpoints() {
  try {
    // Test 1: Dashboard Overview
    console.log('1. Testing /api/dashboard/overview...');
    const overviewResponse = await request(app)
      .get('/api/dashboard/overview')
      .expect(200);
    
    console.log('Overview Response:');
    console.log(`  Total Staff: ${overviewResponse.body.data.totalStaff}`);
    console.log(`  Risk Distribution:`, overviewResponse.body.data.riskDistribution);
    console.log(`  Top Risk Staff Count: ${overviewResponse.body.data.topRiskStaff.length}`);
    console.log(`  Active Alerts: ${overviewResponse.body.data.activeAlerts.length}`);
    console.log('');

    // Test 2: Risk Distribution
    console.log('2. Testing /api/dashboard/risk-distribution...');
    const riskDistResponse = await request(app)
      .get('/api/dashboard/risk-distribution')
      .expect(200);
    
    console.log('Risk Distribution Response:');
    console.log(`  Overall:`, riskDistResponse.body.data.overall);
    console.log(`  By Department:`, riskDistResponse.body.data.byDepartment);
    console.log('');

    // Test 3: Top Risk Staff
    console.log('3. Testing /api/dashboard/top-risk-staff...');
    const topRiskResponse = await request(app)
      .get('/api/dashboard/top-risk-staff?limit=5')
      .expect(200);
    
    console.log('Top Risk Staff Response:');
    console.log(`  Count: ${topRiskResponse.body.data.count}`);
    topRiskResponse.body.data.topRiskStaff.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} - Score: ${staff.score} (${staff.risk_level})`);
    });
    console.log('');

    // Test 4: Risk Trends
    console.log('4. Testing /api/dashboard/risk-trends...');
    const trendsResponse = await request(app)
      .get('/api/dashboard/risk-trends?days=7')
      .expect(200);
    
    console.log('Risk Trends Response:');
    console.log(`  Period: ${trendsResponse.body.data.period}`);
    console.log(`  Trend Data Points: ${trendsResponse.body.data.trends.length}`);
    console.log('');

    // Test 5: Alerts
    console.log('5. Testing /api/dashboard/alerts...');
    const alertsResponse = await request(app)
      .get('/api/dashboard/alerts?resolved=false&limit=10')
      .expect(200);
    
    console.log('Alerts Response:');
    console.log(`  Active Alerts: ${alertsResponse.body.data.alerts.length}`);
    console.log(`  Total Count: ${alertsResponse.body.data.pagination.total}`);
    console.log('');

    console.log('✅ All dashboard endpoint tests passed!');

  } catch (error) {
    console.error('❌ Dashboard endpoint test failed:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testDashboardEndpoints();
}

module.exports = { testDashboardEndpoints };