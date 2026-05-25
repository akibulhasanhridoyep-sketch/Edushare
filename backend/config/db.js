require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_LOCAL || 'mongodb://localhost:27017/edushare';
const localFallback = process.env.MONGODB_LOCAL || 'mongodb://localhost:27017/edushare';
const connectOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10
};

const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB using: ${mongoURI}`);
    await mongoose.connect(mongoURI, connectOptions);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (mongoURI !== localFallback && process.env.MONGODB_LOCAL) {
      console.warn('Trying local MongoDB fallback...');
      try {
        await mongoose.connect(localFallback, connectOptions);
        console.log('✅ MongoDB connected successfully to local fallback');
        return;
      } catch (localError) {
        console.error('❌ Local MongoDB fallback error:', localError.message);
      }
    }
    process.exit(1);
  }
};

module.exports = connectDB;
