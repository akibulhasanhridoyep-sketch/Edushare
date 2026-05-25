import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('student');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (isSignup) {
      if (!email.trim() || !password.trim() || !firstName.trim()) {
        setErr('সব তথ্য দিন');
        return;
      }
      setBusy(true);
      setErr('');
      try {
        await signup(email, password, firstName, lastName, role);
      } catch (error) {
        setErr(error.message || 'সাইনআপ ব্যর্থ');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErr('ইমেইল ও পাসওয়ার্ড দিন');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await login(email, password);
    } catch (error) {
      setErr(error.message || 'লগইন ব্যর্থ');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card fa">
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <div className="login-logo-text">EduShare</div>
        </div>

        <div className="login-title">
          {isSignup ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'আপনার অ্যাকাউন্টে লগইন করুন'}
        </div>
        <div className="login-sub">
          {isSignup ? 'শিক্ষামূলক ভিডিও প্ল্যাটফর্মে যোগ দিন' : 'শিক্ষামূলক ভিডিও প্ল্যাটফর্মে স্বাগতম'}
        </div>

        {isSignup ? (
          <div>
            <div className="lf-group">
              <label className="lf-label">প্রথম নাম</label>
              <input
                className={`lf-input${err ? ' err' : ''}`}
                type="text"
                placeholder="প্রথম নাম লিখুন"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            <div className="lf-group">
              <label className="lf-label">শেষ নাম</label>
              <input
                className={`lf-input${err ? ' err' : ''}`}
                type="text"
                placeholder="শেষ নাম লিখুন"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
          </div>
        ) : null}

        <div className="lf-group">
          <label className="lf-label">ইমেইল</label>
          <input
            className={`lf-input${err ? ' err' : ''}`}
            type="email"
            placeholder="ইমেইল লিখুন"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
        </div>

        <div className="lf-group">
          <label className="lf-label">পাসওয়ার্ড</label>
          <input
            className={`lf-input${err ? ' err' : ''}`}
            type="password"
            placeholder="পাসওয়ার্ড লিখুন"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>

        {isSignup ? (
          <div className="lf-group">
            <label className="lf-label">রোল</label>
            <select
              className="lf-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">ছাত্র/ছাত্রী</option>
              <option value="teacher">শিক্ষক</option>
            </select>
          </div>
        ) : null}

        {err ? <div className="lerr">⚠️ {err}</div> : null}

        <button className="login-btn" onClick={handleSubmit} disabled={busy}>
          {busy ? '⏳ প্রসেসিং...' : isSignup ? '📝 সাইনআপ করুন' : '🔐 লগইন করুন'}
        </button>

        {!isSignup ? (
          <div>
            <div style={{ textAlign: 'center', margin: '1rem 0', opacity: 0.6 }}>
              অথবা
            </div>
            <button
              className="login-btn"
              onClick={handleGoogleLogin}
              style={{ backgroundColor: '#4285F4' }}
              disabled={busy}
            >
              🔵 Google দিয়ে লগইন করুন
            </button>
          </div>
        ) : null}

        <div className="toggle-mode">
          <button
            className="link-btn"
            onClick={() => {
              setIsSignup(!isSignup);
              setErr('');
              setEmail('');
              setPassword('');
              setFirstName('');
              setLastName('');
            }}
          >
            {isSignup ? 'আগে থেকে অ্যাকাউন্ট আছে? লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
