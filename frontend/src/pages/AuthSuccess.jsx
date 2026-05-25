import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function AuthSuccess() {
  const { setToken, setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    localStorage.setItem('token', token);
    setToken(token);

    apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then((user) => {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/';
      })
      .catch((err) => {
        console.error('Auth success error:', err);
        localStorage.removeItem('token');
        window.location.href = '/';
      });
  }, [setToken, setUser]);

  return (
    <div className="pg">
      <p className="em">🔄 প্রক্রিয়া চলছে...</p>
    </div>
  );
}
