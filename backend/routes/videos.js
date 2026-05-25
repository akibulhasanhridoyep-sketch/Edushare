const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { put } = require('@vercel/blob');
const { videos: videoDb, notifications: notifDb, progress: progressDb, users: userDb } = require('../db');
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

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'লগইন করুন' });
  }
  next();
};

// Middleware to require teacher role
const requireTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'লগইন করুন' });
  }
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'শুধুমাত্র শিক্ষকরা ভিডিও আপলোড করতে পারেন' });
  }
  next();
};

// Multer configuration for memory storage (for Vercel Blob)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') }
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]);

// GET /api/videos - Get all videos with optional filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const { subject, q } = req.query;
    let videos = await videoDb.findAll();

    // Filter by subject
    if (subject && subject !== 'all') {
      videos = videos.filter(v => v.subject === subject);
    }

    // Search by title, teacher, or subject
    if (q) {
      const query = q.toLowerCase();
      videos = videos.filter(v =>
        v.title.toLowerCase().includes(query) ||
        (v.uploadedBy?.firstName || '').toLowerCase().includes(query)
      );
    }

    // Attach user progress if authenticated
    if (req.user) {
      const userProgress = await progressDb.findByUser(req.user._id);
      const progressMap = {};
      userProgress.forEach(p => {
        progressMap[p.videoId.toString()] = p.watchTime || 0;
      });

      videos = videos.map(v => ({
        ...v.toObject(),
        progress: progressMap[v._id.toString()] || 0
      }));
    }

    res.json(videos);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/trending - Get trending videos
router.get('/trending', verifyToken, async (req, res) => {
  try {
    const videos = await videoDb.findAll();
    const sorted = videos.sort((a, b) => b.views - a.views).slice(0, 4);

    if (req.user) {
      const userProgress = await progressDb.findByUser(req.user._id);
      const progressMap = {};
      userProgress.forEach(p => {
        progressMap[p.videoId.toString()] = p.watchTime || 0;
      });

      const withProgress = sorted.map(v => ({
        ...v.toObject(),
        progress: progressMap[v._id.toString()] || 0
      }));
      return res.json(withProgress);
    }

    res.json(sorted.map(v => v.toObject()));
  } catch (err) {
    console.error('Error fetching trending videos:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/:id - Get single video
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const video = await videoDb.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' });
    }

    let result = video.toObject();

    // Calculate average rating from ratings array
    if (video.ratings && video.ratings.length > 0) {
      const avgRating = video.ratings.reduce((sum, r) => sum + r.score, 0) / video.ratings.length;
      result.rating = parseFloat(avgRating.toFixed(1));
      result.ratingCount = video.ratings.length;
    } else {
      // Use stored values if no ratings array
      result.rating = video.rating || 0;
      result.ratingCount = video.ratingCount || 0;
    }

    // Attach user progress if authenticated
    if (req.user) {
      const userProgress = await progressDb.findByUserAndVideo(req.user._id, req.params.id);
      result.progress = userProgress?.watchTime || 0;
      result.watched = userProgress?.watched || false;
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching video:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/videos - Upload new video
router.post('/', verifyToken, requireAuth, requireTeacher, (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { title, subject, description, subjectName, teacher, emoji, grade } = req.body;

      if (!title || !subject) {
        return res.status(400).json({ error: 'শিরোনাম ও বিষয় আবশ্যক' });
      }

      if (!req.files?.video) {
        return res.status(400).json({ error: 'ভিডিও ফাইল আবশ্যক' });
      }

      const videoFile = req.files.video[0];
      const pdfFile = req.files?.pdf?.[0];

      let videoUrl, thumbnailUrl;

      // Check if we're on Vercel (production)
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

      if (isVercel) {
        // Production: require Vercel Blob storage
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          return res.status(500).json({ 
            error: 'ভিডিও আপলোড সিস্টেম সেটআপ সম্পূর্ণ নয় — প্রশাসকের সাথে যোগাযোগ করুন' 
          });
        }

        const videoBlob = await put(`videos/${uuid()}${path.extname(videoFile.originalname)}`, videoFile.buffer, {
          access: 'public',
          contentType: videoFile.mimetype
        });
        videoUrl = videoBlob.url;

        if (pdfFile) {
          const pdfBlob = await put(`pdfs/${uuid()}${path.extname(pdfFile.originalname)}`, pdfFile.buffer, {
            access: 'public',
            contentType: pdfFile.mimetype
          });
          thumbnailUrl = pdfBlob.url;
        }
      } else {
        // Development: use local file storage
        const fs = require('fs');
        const videoFileName = uuid() + path.extname(videoFile.originalname);
        const videoPath = path.join(__dirname, `../uploads/videos/${videoFileName}`);

        // Ensure videos directory exists
        if (!fs.existsSync(path.join(__dirname, '../uploads/videos'))) {
          fs.mkdirSync(path.join(__dirname, '../uploads/videos'), { recursive: true });
        }

        fs.writeFileSync(videoPath, videoFile.buffer);
        videoUrl = `/uploads/videos/${videoFileName}`;

        if (pdfFile) {
          const pdfFileName = uuid() + path.extname(pdfFile.originalname);
          const pdfPath = path.join(__dirname, `../uploads/pdfs/${pdfFileName}`);

          // Ensure pdfs directory exists
          if (!fs.existsSync(path.join(__dirname, '../uploads/pdfs'))) {
            fs.mkdirSync(path.join(__dirname, '../uploads/pdfs'), { recursive: true });
          }

          fs.writeFileSync(pdfPath, pdfFile.buffer);
          thumbnailUrl = `/uploads/pdfs/${pdfFileName}`;
        }
      }

      const newVideo = await videoDb.create({
        title,
        subject,
        subjectName: subjectName || subject,
        grade: grade || '',
        teacher: teacher || '',
        emoji: emoji || '🎥',
        description: description || '',
        videoUrl,
        thumbnailUrl,
        uploadedBy: req.user._id,
        duration: 0,
        views: 0,
        ratings: []
      });

      res.status(201).json(newVideo);
    } catch (err) {
      console.error('Error uploading video:', err);
      res.status(500).json({ error: err.message });
    }
  });
});

// PATCH /api/videos/:id/progress - Update watch progress
router.patch('/:id/progress', verifyToken, requireAuth, async (req, res) => {
  try {
    const { watchTime, watched } = req.body;

    const video = await videoDb.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' });
    }

    const progress = await progressDb.upsert(
      req.user._id,
      req.params.id,
      {
        watchTime: watchTime || 0,
        watched: watched || false,
        lastWatchedAt: new Date()
      }
    );

    res.json({ message: 'অগ্রগতি সংরক্ষণ হয়েছে', progress });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/videos/:id/rating - Add or update rating
router.patch('/:id/rating', verifyToken, requireAuth, async (req, res) => {
  try {
    const { rating } = req.body;
    const ratingValue = parseInt(rating);

    if (!rating || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: 'রেটিং ১-৫ এর মধ্যে হতে হবে' });
    }

    const video = await videoDb.addRating(req.params.id, req.user._id, ratingValue);
    if (!video) {
      return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' });
    }

    // Notify video owner
    if (video.uploadedBy.toString() !== req.user._id.toString()) {
      await notifDb.create({
        targetUserId: video.uploadedBy,
        fromUserId: req.user._id,
        videoId: req.params.id,
        type: 'rating',
        message: `${req.user.firstName || 'কেউ'} '${video.title}' এ ${ratingValue} ⭐ রেটিং দিয়েছেন`
      });
    }

    res.json({ message: 'রেটিং সংরক্ষিত হয়েছে', video });
  } catch (err) {
    console.error('Error adding rating:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/videos/:id/view - Increment view count
router.patch('/:id/view', async (req, res) => {
  try {
    const video = await videoDb.incrementViews(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' });
    }
    res.json(video);
  } catch (err) {
    console.error('Error incrementing views:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/videos/:id - Delete video
router.delete('/:id', verifyToken, requireAuth, requireTeacher, async (req, res) => {
  try {
    const video = await videoDb.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' });
    }

    if (video.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'শুধু আপনার নিজের ভিডিও ডিলিট করতে পারবেন' });
    }

    await videoDb.delete(req.params.id);
    res.json({ message: 'ভিডিও ডিলিট হয়েছে' });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
