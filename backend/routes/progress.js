const express = require('express');
const jwt = require('jsonwebtoken');
const { progress: progressDb, users: userDb } = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'edushare_jwt_secret_2024';

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
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
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token মেয়াদ শেষ' });
    }
    res.status(401).json({ error: 'অবৈধ Token' });
  }
};

// GET /api/progress - Get user progress stats
router.get('/', verifyToken, async (req, res) => {
  try {
    const userStats = await progressDb.getUserStats(req.user._id);
    res.json(userStats);
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({
      stats: { watched: 0, hours: 0, courses: 0, teachers: 0, streak: 0 },
      subjects: [],
      history: []
    });
  }
});

module.exports = router;
