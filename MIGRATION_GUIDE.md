# EduShare v2 - MongoDB & Google OAuth Migration Guide

## Major Changes

This major update migrates EduShare from file-based JSON storage to **MongoDB** and adds **Google OAuth** authentication, with improved security using environment variables.

### What's Changed

#### 🗄️ **Persistence: File-based → MongoDB**
- **Before**: Data stored in `backend/data/*.json` files
- **After**: All data stored in MongoDB database
- **Benefits**: 
  - Scalability for production use
  - Better data relationships with ObjectIds
  - Automatic data validation via Mongoose schemas
  - Easier to deploy to cloud platforms

#### 🔐 **Authentication**
- **Before**: Username-based login only
- **After**: Email-based login + Google OAuth
- **Benefits**:
  - One-click Google sign-in
  - More realistic email-based credentials
  - Faster signup process for new users

#### 🔑 **Security**
- **Before**: API keys in source code
- **After**: Environment variables via `.env` file
- **Benefits**:
  - Secrets not exposed in git
  - Easy to switch between dev/production configs
  - Follows security best practices

---

## Setup Instructions

### 1. **MongoDB Setup**

#### Option A: Local MongoDB (Development)
```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB (Windows)
mongod

# Start MongoDB (Mac/Linux)
brew services start mongodb-community
# or
sudo service mongod start
```

#### Option B: MongoDB Atlas (Cloud - Recommended for Production)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/edushare?retryWrites=true&w=majority`

### 2. **Google OAuth Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API"
4. Go to **Credentials** → Create OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `your-production-url.com/api/auth/google/callback` (production)
7. Copy your **Client ID** and **Client Secret**

### 3. **Environment Setup**

#### Backend
```bash
cd backend

# Create .env file from template
cp .env.example .env

# Edit .env with your credentials
```

**`.env` Configuration:**
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edushare?retryWrites=true&w=majority
MONGODB_LOCAL=mongodb://localhost:27017/edushare

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads

# Session Secret
SESSION_SECRET=session_secret_change_this_in_production
```

### 4. **Install & Run**

```bash
# Backend
cd backend
npm install
npm start
# or for development with auto-reload:
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: 'student' | 'teacher',
  profilePicture: String,
  bio: String,
  googleId: String (unique),
  googleProfile: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Videos Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  subject: String,
  videoUrl: String,
  thumbnailUrl: String,
  uploadedBy: ObjectId (ref: User),
  duration: Number,
  views: Number,
  ratings: [{
    userId: ObjectId,
    score: 1-5
  }],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Comments Collection
```javascript
{
  _id: ObjectId,
  videoId: ObjectId (ref: Video),
  userId: ObjectId (ref: User),
  text: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Notifications Collection
```javascript
{
  _id: ObjectId,
  targetUserId: ObjectId (ref: User),
  fromUserId: ObjectId (ref: User),
  videoId: ObjectId (ref: Video),
  type: 'comment' | 'rating' | 'message',
  message: String,
  read: Boolean,
  createdAt: Date
}
```

### Progress Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  videoId: ObjectId (ref: Video),
  watched: Boolean,
  watchTime: Number,
  lastWatchedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Changes

### Authentication

#### Signup (Email-based)
```javascript
POST /api/auth/signup
{
  email: "student@example.com",
  password: "password123",
  firstName: "রাহেল",
  lastName: "আহমেদ",
  role: "student" // or "teacher"
}
```

#### Login
```javascript
POST /api/auth/login
{
  email: "student@example.com",
  password: "password123"
}
```

#### Google OAuth
```javascript
GET /api/auth/google
// Redirects to Google login
// Callback: GET /api/auth/google/callback
```

#### Get Current User
```javascript
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### Video Operations

All endpoints now use MongoDB ObjectIds instead of numeric IDs.

```javascript
// Get all videos
GET /api/videos
Headers: { Authorization: "Bearer <token>" }
Query: { subject?: "math", q?: "search term" }

// Get single video
GET /api/videos/:id

// Upload video (teachers only)
POST /api/videos
FormData: { video, pdf?, title, subject, description }

// Update progress
PATCH /api/videos/:id/progress
{ watchTime: 3600, watched: true }

// Add rating
PATCH /api/videos/:id/rating
{ rating: 5 }

// Delete video (owner only)
DELETE /api/videos/:id
```

---

## Data Migration (Optional)

If you had old JSON data and want to migrate:

```bash
# There's a migration script available
node scripts/migrate-from-json.js

# This will:
# 1. Read data from backend/data/*.json
# 2. Transform it to MongoDB format
# 3. Insert into MongoDB database
```

---

## Deployment

### Heroku Deployment

```bash
# 1. Install Heroku CLI
# 2. Login
heroku login

# 3. Create app
heroku create your-app-name

# 4. Set environment variables
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_secret"
heroku config:set GOOGLE_CLIENT_ID="your_id"
heroku config:set GOOGLE_CLIENT_SECRET="your_secret"

# 5. Deploy
git push heroku main
```

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod_user:prod_pass@cluster.mongodb.net/edushare
JWT_SECRET=your_very_secret_key_at_least_32_chars
FRONTEND_URL=https://your-app.herokuapp.com
GOOGLE_CALLBACK_URL=https://your-app.herokuapp.com/api/auth/google/callback
PORT=5000
```

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running locally or use MongoDB Atlas connection string

### Google OAuth Not Working
```
Error: redirect_uri_mismatch
```
**Solution**: Ensure your `GOOGLE_CALLBACK_URL` in `.env` matches the one registered in Google Console

### Token Errors
```
Error: Token মেয়াদ শেষ (Token expired)
```
**Solution**: Tokens expire after 7 days by default. User needs to login again

### File Upload Issues
```
Error: File size exceeds limit
```
**Solution**: Increase `MAX_FILE_SIZE` in `.env` (default: 100MB)

---

## Performance Improvements

1. **Indexed Queries**: User + Video lookups now use indexed ObjectIds
2. **Aggregation Pipeline**: Complex stats queries use MongoDB aggregation
3. **Connection Pooling**: MongoDB connection pool for better performance
4. **Lean Queries**: Mongoose queries exclude unnecessary fields
5. **Pagination Ready**: API structure allows easy pagination implementation

---

## Security Enhancements

✅ Passwords hashed with bcrypt (salt rounds: 10)  
✅ JWT tokens for stateless authentication  
✅ Google OAuth for social login  
✅ Environment variables for secrets  
✅ CORS properly configured  
✅ Input validation on all endpoints  
✅ Role-based access control (RBAC)  

---

## Next Steps

1. **Monitor & Scale**: Watch database performance as users grow
2. **Backup Strategy**: Set up regular MongoDB backups
3. **Analytics**: Add tracking for user behavior
4. **Notifications**: Implement real-time notifications with Socket.io
5. **Search**: Add full-text search for videos
6. **Caching**: Add Redis caching for frequently accessed data

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review MongoDB documentation: https://docs.mongodb.com/
- Check Google OAuth docs: https://developers.google.com/identity/protocols/oauth2

Happy learning! 🎓📚
