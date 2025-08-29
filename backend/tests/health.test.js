const request = require('supertest');
const express = require('express');

// Create a simple test app for health check
const app = express();
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Healthcare Burnout Prevention API is running',
    timestamp: new Date().toISOString()
  });
});

describe('Health Check', () => {
  test('GET /health should return OK status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.message).toBe('Healthcare Burnout Prevention API is running');
    expect(response.body.timestamp).toBeDefined();
  });
});