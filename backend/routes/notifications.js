const express = require('express');
const jwt = require('jsonwebtoken');
const { notifications: notifDb, users: userDb } = require('../db');
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

// GET /api/notifications - Get notifications for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await notifDb.findByUser(req.user._id);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read (MUST come before /:id route)
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    const notifications = await notifDb.findByUser(req.user._id);
    
    for (const notif of notifications) {
      if (!notif.read) {
        await notifDb.markAsRead(notif._id);
      }
    }

    res.json({ message: 'সব বিজ্ঞপ্তি পড়া হিসাবে চিহ্নিত করা হয়েছে' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await notifDb.markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'বিজ্ঞপ্তি পাওয়া যায়নি' });
    }

    if (notification.targetUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'এই বিজ্ঞপ্তি আপনার নয়' });
    }

    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await notifDb.delete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'বিজ্ঞপ্তি পাওয়া যায়নি' });
    }

    res.json({ message: 'বিজ্ঞপ্তি ডিলিট হয়েছে' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
