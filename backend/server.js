require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const connectDB = require('./config/db');

// Load Passport config
require('./config/passport');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []),
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blocked origin: ${origin}`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session configuration
app.use(session({
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI || process.env.MONGODB_LOCAL || 'mongodb://localhost:27017/edushare',
    ttl: 24 * 60 * 60 // 24 hours
  }),
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/', (_, res) => res.json({
  ok: true,
  msg: 'EduShare API v2 চলছে ✓',
  env: NODE_ENV
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const configuredFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const configuredDatabaseUrl = process.env.MONGODB_URI || process.env.MONGODB_LOCAL || 'mongodb://localhost:27017/edushare';

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✅ EduShare Server: http://localhost:${PORT}`);
    console.log(`📦 Environment: ${NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${configuredFrontendUrl}`);
    console.log(`🔐 Database: ${configuredDatabaseUrl}\n`);
  });
}

module.exports = app;

