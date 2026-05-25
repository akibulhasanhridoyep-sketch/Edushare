const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  watched: { type: Boolean, default: false },
  watchTime: { type: Number, default: 0 },
  lastWatchedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create unique index on userId + videoId
progressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
