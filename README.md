# EduShare v2 — শিক্ষামূলক ভিডিও প্ল্যাটফর্ম

## ফিচারসমূহ
🔐 লগইন | 🏠 হোম | ▶ ভিডিও প্লেয়ার | ⭐ রেটিং
💬 মন্তব্য | 📊 অগ্রগতি | 🔔 বিজ্ঞপ্তি | 👤 প্রোফাইল
📤 আপলোড মডাল | 🚪 লগআউট

## চালানোর নিয়ম

### ১. Backend
```
cd backend
npm install
npm run dev
```
সার্ভার: http://localhost:5000

### ২. Frontend (নতুন CMD)
```
cd frontend
npm install
npm start
```
অ্যাপ: http://localhost:3000

## ডেমো অ্যাকাউন্ট
| ইউজারনেম | পাসওয়ার্ড | ভূমিকা |
|-----------|------------|--------|
| rahel     | 1234       | শিক্ষার্থী |
| teacher   | 1234       | শিক্ষক |
| student   | 1234       | শিক্ষার্থী |

## Deploy করার জন্য প্রস্তুতি

### ১. Backend
1. `cd backend`
2. `npm install`
3. `backend/.env.example` থেকে `.env` ফাইল তৈরি করুন এবং প্রযোজ্য মান দিন।
4. Vercel এ `backend` ডিরেক্টরিটি আলাদা প্রোজেক্ট হিসেবে ডিপ্লয় করুন।
5. Vercel environment variables এ নিম্নলিখিত সেট করুন:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE`
   - `PORT` (প্রয়োজনে)
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend-url.com`
   - `FRONTEND_URLS=https://your-frontend-url.com`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL=https://your-backend-url.com/api/auth/google/callback`
   - `SESSION_SECRET`
   - `BLOB_READ_WRITE_TOKEN`

### ২. Frontend
1. `cd frontend`
2. `npm install`
3. `frontend/.env.example` থেকে `.env` ফাইল তৈরি করুন এবং প্রযোজ্য মান দিন।
4. Vercel এ `frontend` ডিরেক্টরিটি আলাদা প্রোজেক্ট হিসেবে ডিপ্লয় করুন।
5. Vercel environment variables এ সেট করুন:
   - `REACT_APP_API_BASE_URL=https://your-backend-url.com`

### ৩. ডিপ্লয় কনফিগারেশন
- `backend/vercel.json` ইতিমধ্যেই Node.js server ডিপ্লয় করার জন্য প্রস্তুত।
- `frontend` ব্রাঞ্চের জন্য `npm run build` কমান্ড ব্যবহার করুন।

> নোট: লোকাল ডেভ-এ `frontend/src/setupProxy.js` টুল ব্যবহার করে ফ্রন্টএন্ড থেকে ব্যাকএন্ড কল করা হয়। প্রোডাকশনে `REACT_APP_API_BASE_URL` সেট করা থাকলে এটি সরাসরি ব্যাকএন্ড API এ কাজ করবে।
