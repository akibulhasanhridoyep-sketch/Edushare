const express = require('express');
const jwt = require('jsonwebtoken');
const { comments: commentDb, videos: videoDb, notifications: notifDb, users: userDb } = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'edushare_jwt_secret_2024';

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userDb.findById(decoded.id);
    if (!user) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// GET /api/comments/:videoId - Get all comments for a video
router.get('/:videoId', verifyToken, async (req, res) => {
  try {
    const comments = await commentDb.findByVideo(req.params.videoId);
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/comments/:videoId - Add comment
router.post('/:videoId', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'লগইন করুন' });
    }

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'মন্তব্য লিখুন' });
    }

    // Check if video exists
    const video = await videoDb.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' });
    }

    // Create comment
    const comment = await commentDb.create({
      videoId: req.params.videoId,
      userId: req.user._id,
      text: text.trim()
    });

    // Notify video owner
    if (video.uploadedBy.toString() !== (req.user?._id?.toString() || '')) {
      await notifDb.create({
        targetUserId: video.uploadedBy,
        fromUserId: req.user?._id,
        videoId: req.params.videoId,
        type: 'comment',
        message: `${req.user?.firstName || 'কেউ'} '${video.title}' ভিডিওতে মন্তব্য করেছেন: "${text.trim().substring(0, 50)}..."`
      });
    }

    const populated = await commentDb.findByVideo(req.params.videoId);
    const newComment = populated[populated.length - 1];

    res.status(201).json(newComment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/comments/:commentId - Delete comment
router.delete('/:commentId', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'লগইন করুন' });
    }

    const comment = await commentDb.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'মন্তব্য পাওয়া যায়নি' });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'শুধু আপনার নিজের মন্তব্য ডিলিট করতে পারবেন' });
    }

    await commentDb.delete(req.params.commentId);
    res.json({ message: 'মন্তব্য ডিলিট হয়েছে' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
