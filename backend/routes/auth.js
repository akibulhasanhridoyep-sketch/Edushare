const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { users: userDb } = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'edushare_jwt_secret_2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// POST /api/auth/signup - Local registration
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Validation
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'সব তথ্য দিন' });
    }

    if (role && role !== 'student' && role !== 'teacher') {
      return res.status(400).json({ error: 'রোল সঠিক নয়' });
    }

    // Check if user exists
    const existingUser = await userDb.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'এই ইমেইল দিয়ে অ্যাকাউন্ট আগে থেকে আছে' });
    }

    // Create new user
    const newUser = await userDb.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'student'
    });

    const token = generateToken(newUser._id);
    const { password: _, ...safeUser } = newUser.toObject();
    const safeUserWithId = { ...safeUser, id: safeUser._id?.toString() };
    
    res.status(201).json({ 
      token, 
      user: safeUserWithId,
      message: 'সাইন আপ সফল হয়েছে'
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'সাইন আপ ব্যর্থ' });
  }
});

// POST /api/auth/login - Local login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'ইমেইল ও পাসওয়ার্ড দিন' });
    }

    // Find user and check password
    const user = await userDb.findByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    }

    const token = generateToken(user._id);
    const { password: _, ...safeUser } = user.toObject();
    const safeUserWithId = { ...safeUser, id: safeUser._id?.toString() };
    
    res.json({ 
      token, 
      user: safeUserWithId,
      message: 'লগইন সফল'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'লগইন ব্যর্থ' });
  }
});

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${FRONTEND_URL}/auth-success?error=auth_failed`
}), (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.redirect(`${FRONTEND_URL}/auth-success?token=${token}`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${FRONTEND_URL}/auth-success?error=callback_failed`);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'লগইন করুন' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userDb.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    const { password: _, ...safeUser } = user.toObject();
    const safeUserWithId = { ...safeUser, id: safeUser._id?.toString() };
    res.json(safeUserWithId);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token মেয়াদ শেষ, আবার লগইন করুন' });
    }
    res.status(401).json({ error: 'অবৈধ Token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'লগআউট ব্যর্থ' });
    }
    res.json({ message: 'লগআউট সফল' });
  });
});

module.exports = router;

