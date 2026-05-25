import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const normalizeUser = (raw) => {
    const base = raw.id ? raw : { ...raw, id: raw._id?.toString() };
    const firstName = base.firstName || '';
    const lastName = base.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || base.username || base.email?.split('@')[0] || 'EduShare';
    const username = base.username || base.email?.split('@')[0] || '';
    const avatar = base.profilePicture || (firstName ? firstName[0] : base.role === 'teacher' ? '👨‍🏫' : '🎓');
    return { ...base, name, username, avatar };
  };

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return normalizeUser(parsed);
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [ready, setReady] = useState(false);

  const parseResponse = async (response) => {
    const text = await response.text();
    try {
      return JSON.parse(text || '{}');
    } catch {
      return { error: text || 'অজানা সার্ভার ত্রুটি' };
    }
  };

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Token যাচাই ব্যর্থ');
        return r.json();
      })
      .then(u => {
        const normalized = normalizeUser(u);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        setReady(true);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Token verification failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setReady(true);
      });

    return () => controller.abort();
  }, [token]);

  const login = async (email, password) => {
    const r = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const d = await parseResponse(r);
    if (!r.ok) throw new Error(d.error || d.message || 'লগইন ব্যর্থ');
    const userData = normalizeUser(d.user.id ? d.user : { ...d.user, id: d.user._id?.toString() });
    localStorage.setItem('token', d.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(d.token);
    setUser(userData);
  };

  const signup = async (email, password, firstName, lastName, role = 'student') => {
    const r = await apiFetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, role })
    });
    const d = await parseResponse(r);
    if (!r.ok) throw new Error(d.error || d.message || 'সাইনআপ ব্যর্থ');
    const userData = normalizeUser(d.user.id ? d.user : { ...d.user, id: d.user._id?.toString() });
    localStorage.setItem('token', d.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(d.token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, token, login, signup, logout, ready, setToken, setUser, normalizeUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

