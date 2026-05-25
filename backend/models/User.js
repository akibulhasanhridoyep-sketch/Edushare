const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, enum: ['teacher', 'student'], default: 'student' },
  profilePicture: { type: String, default: null },
  bio: { type: String, default: '' },
  googleId: { type: String, unique: true, sparse: true },
  googleProfile: {
    id: String,
    displayName: String,
    email: String,
    picture: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(passwordInput) {
  if (!this.password) return false;
  return bcrypt.compare(passwordInput, this.password);
};

module.exports = mongoose.model('User', userSchema);
