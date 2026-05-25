const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subject: { type: String },
  subjectName: { type: String },
  grade: { type: String },
  teacher: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  emoji: { type: String, default: '🎥' },
  videoUrl: { type: String, required: true },
  pdfUrl: { type: String },
  thumbnailUrl: { type: String, default: null },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 },
    _id: false
  }],
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);
