import express from 'express';
import cors from 'cors';

import dotenv from 'dotenv';

dotenv.config();

// Import database configuration
import cookieParser from 'cookie-parser';
import { testConnection, syncDatabase } from './config/database.js';


const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware - helmet sets various HTTP headers for security
// This should be the FIRST middleware in the stack
//app.use(helmet());

// Cookie parser middleware
app.use(cookieParser());

// CORS middleware for cross-origin requests
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://www.checkinsuite.in",
    "https://www.checkinsuite.in/"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import authRoutes from './routes/auth.js';
import hotelRoutes from './routes/hotelRoutes.js';
import hotelManagerRoutes from './routes/hotelManagerRoutes.js';
import guestRecordRoutes from './routes/guestRecordRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Hotel PMS Backend is running successfully!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);

app.use('/api/hotels', hotelRoutes);
app.use('/api/hotel-managers', hotelManagerRoutes);
app.use('/api/guest-records', guestRecordRoutes);
app.use('/api/expenses', expenseRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hotel PMS Backend API',
    version: '1.0.0',
    endpoints: {
      test: '/api/test',
      health: '/api/health',
      auth: '/api/auth',
   
      hotels: '/api/hotels',
      hotelManagers: '/api/hotel-managers',
      guestRecords: '/api/guest-records',
      expenses: '/api/expenses'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Initialize database and start server
const initializeServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (create tables if they don't exist)
    //await syncDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Hotel PMS Backend server is running on port ${PORT}`);
     
    });
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 