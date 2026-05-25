// MongoDB Database Helper Functions
const User = require('./models/User');
const Video = require('./models/Video');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const Progress = require('./models/Progress');

// ============ USER OPERATIONS ============
const users = {
  async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (err) {
      throw new Error(`Failed to create user: ${err.message}`);
    }
  },

  async findById(id) {
    try {
      return await User.findById(id).select('-password');
    } catch (err) {
      throw new Error(`Failed to find user: ${err.message}`);
    }
  },

  async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (err) {
      throw new Error(`Failed to find user by email: ${err.message}`);
    }
  },

  async findByUsername(username) {
    try {
      return await User.findOne({ username });
    } catch (err) {
      throw new Error(`Failed to find user by username: ${err.message}`);
    }
  },

  async findByGoogleId(googleId) {
    try {
      return await User.findOne({ googleId });
    } catch (err) {
      throw new Error(`Failed to find user by Google ID: ${err.message}`);
    }
  },

  async findAll() {
    try {
      return await User.find().select('-password');
    } catch (err) {
      throw new Error(`Failed to find users: ${err.message}`);
    }
  },

  async update(id, updateData) {
    try {
      return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    } catch (err) {
      throw new Error(`Failed to update user: ${err.message}`);
    }
  }
};

// ============ VIDEO OPERATIONS ============
const videos = {
  async create(videoData) {
    try {
      const video = new Video(videoData);
      return await video.save();
    } catch (err) {
      throw new Error(`Failed to create video: ${err.message}`);
    }
  },

  async findById(id) {
    try {
      return await Video.findById(id).populate('uploadedBy', 'username firstName lastName');
    } catch (err) {
      throw new Error(`Failed to find video: ${err.message}`);
    }
  },

  async findAll() {
    try {
      return await Video.find().populate('uploadedBy', 'username firstName lastName');
    } catch (err) {
      throw new Error(`Failed to find videos: ${err.message}`);
    }
  },

  async findByTeacher(teacherId) {
    try {
      return await Video.find({ uploadedBy: teacherId }).populate('uploadedBy', 'username firstName lastName');
    } catch (err) {
      throw new Error(`Failed to find videos by teacher: ${err.message}`);
    }
  },

  async update(id, updateData) {
    try {
      return await Video.findByIdAndUpdate(id, updateData, { new: true }).populate('uploadedBy', 'username firstName lastName');
    } catch (err) {
      throw new Error(`Failed to update video: ${err.message}`);
    }
  },

  async delete(id) {
    try {
      return await Video.findByIdAndDelete(id);
    } catch (err) {
      throw new Error(`Failed to delete video: ${err.message}`);
    }
  },

  async addRating(videoId, userId, score) {
    try {
      const video = await Video.findById(videoId);
      if (!video) throw new Error('Video not found');
      
      // Remove existing rating from this user
      video.ratings = video.ratings.filter(r => r.userId.toString() !== userId.toString());
      
      // Add new rating
      video.ratings.push({ userId, score });

      // Update calculated rating and count
      if (video.ratings.length > 0) {
        const total = video.ratings.reduce((sum, r) => sum + r.score, 0);
        video.rating = parseFloat((total / video.ratings.length).toFixed(1));
        video.ratingCount = video.ratings.length;
      } else {
        video.rating = 0;
        video.ratingCount = 0;
      }

      return await video.save();
    } catch (err) {
      throw new Error(`Failed to add rating: ${err.message}`);
    }
  },

  async incrementViews(id) {
    try {
      return await Video.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    } catch (err) {
      throw new Error(`Failed to increment views: ${err.message}`);
    }
  }
};

// ============ COMMENT OPERATIONS ============
const comments = {
  async create(commentData) {
    try {
      const comment = new Comment(commentData);
      return await comment.save();
    } catch (err) {
      throw new Error(`Failed to create comment: ${err.message}`);
    }
  },

  async findByVideo(videoId) {
    try {
      return await Comment.find({ videoId }).populate('userId', 'username firstName lastName').sort({ createdAt: -1 });
    } catch (err) {
      throw new Error(`Failed to find comments: ${err.message}`);
    }
  },

  async findById(id) {
    try {
      return await Comment.findById(id);
    } catch (err) {
      throw new Error(`Failed to find comment: ${err.message}`);
    }
  },

  async delete(id) {
    try {
      return await Comment.findByIdAndDelete(id);
    } catch (err) {
      throw new Error(`Failed to delete comment: ${err.message}`);
    }
  }
};

// ============ NOTIFICATION OPERATIONS ============
const notifications = {
  async create(notificationData) {
    try {
      const notification = new Notification(notificationData);
      return await notification.save();
    } catch (err) {
      throw new Error(`Failed to create notification: ${err.message}`);
    }
  },

  async findByUser(userId) {
    try {
      return await Notification.find({ targetUserId: userId })
        .populate('fromUserId', 'username firstName lastName')
        .populate('videoId', 'title')
        .sort({ createdAt: -1 });
    } catch (err) {
      throw new Error(`Failed to find notifications: ${err.message}`);
    }
  },

  async markAsRead(id) {
    try {
      return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    } catch (err) {
      throw new Error(`Failed to mark notification as read: ${err.message}`);
    }
  },

  async delete(id) {
    try {
      return await Notification.findByIdAndDelete(id);
    } catch (err) {
      throw new Error(`Failed to delete notification: ${err.message}`);
    }
  }
};

// ============ PROGRESS OPERATIONS ============
const progress = {
  async upsert(userId, videoId, progressData) {
    try {
      return await Progress.findOneAndUpdate(
        { userId, videoId },
        { ...progressData, updatedAt: Date.now() },
        { upsert: true, new: true }
      );
    } catch (err) {
      throw new Error(`Failed to update progress: ${err.message}`);
    }
  },

  async findByUser(userId) {
    try {
      return await Progress.find({ userId }).populate('videoId', 'title subject');
    } catch (err) {
      throw new Error(`Failed to find progress: ${err.message}`);
    }
  },

  async findByUserAndVideo(userId, videoId) {
    try {
      return await Progress.findOne({ userId, videoId });
    } catch (err) {
      throw new Error(`Failed to find progress: ${err.message}`);
    }
  },

  async getUserStats(userId) {
    try {
      const userProgress = await Progress.find({ userId });
      const videos = await Video.find();
      
      const watched = userProgress.filter(p => p.watched).length;
      const hours = Math.floor(userProgress.reduce((sum, p) => sum + p.watchTime, 0) / 3600);
      
      const subjects = new Set();
      const teachers = new Set();
      
      userProgress.forEach(p => {
        const video = videos.find(v => v._id.toString() === p.videoId.toString());
        if (video) {
          if (video.subject) subjects.add(video.subject);
          teachers.add(video.uploadedBy.toString());
        }
      });

      return {
        stats: {
          watched,
          hours,
          courses: subjects.size,
          teachers: teachers.size,
          streak: 0
        },
        subjects: Array.from(subjects),
        history: userProgress.map(p => ({
          videoId: p.videoId,
          watched: p.watched,
          watchTime: p.watchTime,
          lastWatchedAt: p.lastWatchedAt
        }))
      };
    } catch (err) {
      throw new Error(`Failed to get user stats: ${err.message}`);
    }
  }
};

module.exports = { users, videos, comments, notifications, progress };

