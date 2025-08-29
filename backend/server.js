const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (for setup.html)
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Healthcare Burnout Prevention API is running',
    timestamp: new Date().toISOString(),
    setupUrl: `http://localhost:${PORT}/setup.html`,
    initUrl: `http://localhost:${PORT}/api/setup/database`
  });
});

// Quick database initialization endpoint (GET for easy browser access)
app.get('/init-db', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const bcrypt = require('bcryptjs');
    const db = require('./config/database');
    
    console.log('Initializing database schema...');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    statements.forEach(statement => {
      if (statement.trim()) {
        db.exec(statement);
      }
    });
    
    // Check if managers already exist
    const managersQuery = db.prepare('SELECT COUNT(*) as count FROM managers');
    const managersCount = managersQuery.get();
    
    if (managersCount.count === 0) {
      console.log('Creating sample managers...');
      
      const insertManager = db.prepare(`
        INSERT INTO managers (name, email, password_hash)
        VALUES (?, ?, ?)
      `);
      
      const hashedPassword = await bcrypt.hash('manager123', 10);
      insertManager.run('Dr. Sarah Johnson', 'sarah.johnson@hospital.com', hashedPassword);
      insertManager.run('Michael Chen', 'michael.chen@hospital.com', hashedPassword);
    }
    
    res.json({
      success: true,
      message: 'Database initialized successfully!',
      loginCredentials: {
        email: 'sarah.johnson@hospital.com',
        password: 'manager123'
      }
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const workHoursRoutes = require('./routes/workHours');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');
const setupRoutes = require('./routes/setup');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/work-hours', workHoursRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/setup', setupRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});