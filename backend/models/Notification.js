const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  type: { type: String, enum: ['comment', 'rating', 'message'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
