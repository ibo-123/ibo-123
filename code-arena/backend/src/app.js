const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const contestRoutes = require('./routes/contestRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const participantRoutes = require('./routes/participantRoutes');
const videoRoutes = require('./routes/videoRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
// ============================================
// CORS Configuration - FIXED for Express 5
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
 'https://code-arena-weld.vercel.app',
].filter(Boolean);  



// CORS middleware - handle all requests
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      // For development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
}));

// Handle preflight requests - FIXED for Express 5
// Use a middleware that catches all OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api', contestRoutes);
app.use('/api', auditLogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tournaments', participantRoutes);
app.use('/api', videoRoutes);
app.use('/api', invitationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/*
|--------------------------------------------------------------------------
| Enhanced Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error('========================================');
  console.error('Error caught by global handler:');
  console.error('  Time:', new Date().toISOString());
  console.error('  Path:', req.method, req.path);
  console.error('  Origin:', req.headers.origin || 'No origin');
  console.error('  Error:', err.message);
  console.error('  Stack:', err.stack);
  console.error('========================================');

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy blocked this request',
      allowedOrigins,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Handle duplicate key errors (MongoDB 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Default error response
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server. Please try again.',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

module.exports = app;

