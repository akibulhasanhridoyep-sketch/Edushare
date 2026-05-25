# EduShare - সম্পূর্ণ Deployment গাইড

## ✅ Pre-Deployment Checklist

### সার্ভার সাইড (Backend)
- [x] CORS properly configured for both frontend URLs
- [x] Environment variables structure correct (.env.example created)
- [x] MongoDB connection tested
- [x] JWT authentication implemented
- [x] Google OAuth configured
- [x] Route ordering fixed (✓ /read-all before /:id)
- [x] Error handling middleware in place
- [x] Vercel Blob storage integration ready

### ক্লায়েন্ট সাইড (Frontend)  
- [x] API base URL configured via environment variables
- [x] Authentication context properly set up
- [x] All pages connected and working
- [x] Error handling and fallbacks in place
- [x] Toast notifications working
- [x] Local proxy for development (setupProxy.js)

### ডেটাবেস
- [x] MongoDB Atlas configured with proper connection string
- [x] Collections ready (User, Video, Comment, Notification, Progress)
- [x] Indexes properly created (unique on userId+videoId)

---

## 🚀 Step-by-Step Deployment

### Phase 1: Git Preparation

1. **Check Git Status**
   ```bash
   cd d:\CLG Project\EduShare-main\EduShare-main
   git status
   ```

2. **Add All Changes**
   ```bash
   git add .
   ```

3. **Commit Changes**
   ```bash
   git commit -m "feat: production-ready deployment setup with CORS fixes and complete routes"
   ```

4. **Push to Repository**
   ```bash
   git push origin main
   ```

---

### Phase 2: Backend Deployment (Vercel)

#### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel

#### Steps

1. **Connect Backend Repository to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Configure project settings:
     - **Root Directory**: `backend`
     - **Framework Preset**: `Other`
     - **Build Command**: Skip (Express doesn't need build)
     - **Output Directory**: (leave empty)
     - **Install Command**: `npm install`
     - **Start Command**: `npm start` or `node server.js`

2. **Set Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables, add:

   ```
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.XXXXX.mongodb.net/edushare?retryWrites=true&w=majority
   JWT_SECRET=your_strong_random_jwt_secret_min_32_chars
   JWT_EXPIRE=30d
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.com
   FRONTEND_URLS=https://your-frontend-url.com
   GOOGLE_CLIENT_ID=your_google_client_id_from_console
   GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console
   GOOGLE_CALLBACK_URL=https://your-backend-url.com/api/auth/google/callback
   SESSION_SECRET=your_session_secret_random_string
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_if_using_blob
   PORT=5000
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://your-backend-url.com`)

---

### Phase 3: Frontend Deployment (Vercel)

#### Steps

1. **Connect Frontend Repository to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repository (same one)
   - Configure project settings:
     - **Root Directory**: `frontend`
     - **Framework Preset**: `Create React App`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
     - **Install Command**: `npm install`

2. **Set Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:

   ```
   REACT_APP_API_BASE_URL=https://your-backend-url.com
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your frontend URL (e.g., `https://your-frontend-url.com`)

---

### Phase 4: Post-Deployment Verification

#### Frontend Tests
1. Visit `https://your-frontend-url.com`
2. Test Login:
   - Click login
   - Enter test credentials or use Google OAuth
   - Should successfully authenticate

3. Test Notifications
   - Navigate to notifications tab
   - Should load without CORS errors

4. Test Video Upload (Teacher)
   - Switch to teacher account
   - Try uploading a video
   - Should upload successfully

#### Backend Tests
1. Test API health check:
   ```bash
   curl https://your-backend-url.com/
   # Should return: {"ok":true,"msg":"EduShare API v2 চলছে ✓","env":"production"}
   ```

2. Test CORS:
   ```bash
   curl -H "Origin: https://your-frontend-url.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: authorization" \
        -X OPTIONS https://your-backend-url.com/api/videos -v
   # Should see: Access-Control-Allow-Origin header with your frontend URL
   ```

---

## ⚠️ Important Notes

### Environment Variables
- **Never** commit `.env` files to git
- Always use `.env.example` as template
- Each environment (dev/prod) needs separate `.env`

### MongoDB Atlas Security
- Whitelist your Vercel IP in MongoDB Atlas (or use 0.0.0.0/0 for testing)
- Keep connection strings secure
- Use strong passwords for MongoDB users

### CORS Configuration
- Backend is configured to accept requests from `FRONTEND_URL`
- Update `FRONTEND_URL` environment variable if frontend URL changes
- Preflight requests (OPTIONS) are automatically handled

### Google OAuth
- Update callback URLs in Google Cloud Console when URLs change
- Dev: `http://localhost:5000/api/auth/google/callback`
- Prod: `https://your-backend-url.com/api/auth/google/callback`

### Sessions & Cookies
- In production, cookies are marked as `secure` (HTTPS only)
- Sessions stored in MongoDB via MongoStore
- Session timeout: 24 hours

---

## 🔄 Re-deployment Process

After making changes locally:

1. **Test Locally**
   ```bash
   cd backend
   npm run dev
   # In another terminal
   cd frontend
   npm start
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "describe your changes"
   ```

3. **Push to GitHub**
   ```bash
   git push origin main
   ```

4. **Vercel Auto-Deploy**
   - Vercel automatically redeploys when code is pushed
   - Monitor deployment in Vercel Dashboard
   - Rollback available if deployment fails

---

## 🐛 Troubleshooting

### CORS Errors
- **Error**: `Access-Control-Allow-Origin header missing`
- **Solution**: Verify `FRONTEND_URL` matches exactly in backend .env

### MongoDB Connection Errors
- **Error**: `MongoDB connection failed`
- **Solution**: 
  - Check connection string in MongoDB Atlas
  - Whitelist Vercel IP in MongoDB Atlas Network Access
  - Verify username/password in connection string

### Google OAuth Not Working
- **Error**: `OAuth callback failed`
- **Solution**:
  - Update redirect URI in Google Cloud Console
  - Verify `GOOGLE_CALLBACK_URL` in backend .env
  - Ensure credentials are not expired

### 503 Service Unavailable
- **Error**: Deployment shows 503
- **Solution**:
  - Check Vercel deployment logs
  - Verify all environment variables are set
  - Check MongoDB connection

---

## 📊 File Checklist for Git

These files should be in your git repository:

```
✓ backend/
  ✓ server.js (Updated with production CORS)
  ✓ package.json
  ✓ .env.example (Template - actual .env NOT in git)
  ✓ vercel.json (Deployment config)
  ✓ config/
  ✓ models/
  ✓ routes/ (All routes fixed)
  ✓ uploads/.gitkeep (Empty directories)
  ✓ db.js

✓ frontend/
  ✓ package.json
  ✓ .env.example (Template - actual .env NOT in git)
  ✓ src/
  ✓ public/

✓ Root
  ✓ README.md (Updated)
  ✓ MIGRATION_GUIDE.md
  ✓ DEPLOYMENT_GUIDE.md (This file)
  ✓ .gitignore (Updated)
  ✓ .git/ (Git history)

✗ NOT in Git
  ✗ node_modules/
  ✗ .env (Actual files)
  ✗ backend/uploads/* (Except .gitkeep)
  ✗ dist/, build/
  ✗ testAPI.js
  ✗ *.log
```

---

## 📞 Support & Help

If you encounter issues:

1. Check Vercel deployment logs
2. Review MongoDB Atlas logs
3. Check browser console for frontend errors
4. Review backend logs in Vercel
5. Test endpoints using curl or Postman

---

**Last Updated**: May 10, 2026
**Status**: ✅ Ready for Production Deployment
