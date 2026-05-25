const express = require('express');
const jwt = require('jsonwebtoken');
const { videos: videoDb, users: userDb } = require('../db');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'edushare_jwt_secret_2024';

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userDb.findById(decoded.id);
    req.user = user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'লগইন করুন' });
  }
  next();
};

// GET /api/users/:id/videos - Get all videos uploaded by a user
router.get('/:id/videos', async (req, res) => {
  try {
    const videos = await videoDb.findByTeacher(req.params.id);
    res.json(videos);
  } catch (err) {
    console.error('Error fetching user videos:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await userDb.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    const { password: _, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id - Update profile
router.patch('/:id', verifyToken, requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'আপনি এই প্রোফাইল আপডেট করতে পারবেন না' });
    }

    const allowed = ['firstName', 'lastName', 'username', 'bio', 'profilePicture'];
    const updateData = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    });

    const updatedUser = await userDb.update(req.params.id, updateData);
    const { password: _, ...safeUser } = updatedUser.toObject();
    res.json(safeUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
