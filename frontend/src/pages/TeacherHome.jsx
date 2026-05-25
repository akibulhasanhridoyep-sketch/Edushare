import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { apiFetch } from '../api';

export default function TeacherHome({ onOpenVideo, showToast, onUpload, refresh }) {
  const { user, token } = useAuth();
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({ total: 0, views: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const safeVideos = Array.isArray(videos) ? videos : [];

  const fetchVideos = () => {
    if (!user) return;
    apiFetch(`/api/users/${user.id || user._id}/videos`)
      .then(r => r.json())
      .then(v => {
        const normalized = Array.isArray(v) ? v : [];
        setVideos(normalized);
        setStats({
          total: normalized.length,
          views: normalized.reduce((a, x) => a + (x.views || 0), 0),
          rating: normalized.length ? (normalized.reduce((a, x) => a + (x.rating || 0), 0) / normalized.length).toFixed(1) : 0,
        });
        setLoading(false);
      })
      .catch(() => { showToast('ডেটা লোড করতে সমস্যা'); setLoading(false); });
  };

  useEffect(() => {
    fetchVideos();
  }, [user, refresh]);

  const handleDelete = (id) => {
    if (!confirm('এই ভিডিওটি ডিলিট করতে চান?')) return;
    apiFetch(`/api/videos/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        if (r.ok) {
          setVideos(prev => Array.isArray(prev) ? prev.filter(v => (v.id || v._id) !== id) : []);
          showToast('ভিডিও ডিলিট হয়েছে ✓');
        } else {
          return r.json().then(e => showToast(e.error || 'ডিলিট করতে সমস্যা'));
        }
      })
      .catch(() => showToast('ডিলিট করতে সমস্যা'));
  };

  return (
    <div className="pg fa">
      <div className="hero" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h1>শিক্ষক ড্যাশবোর্ড 👨‍🏫</h1>
        <p>আপনার সমস্ত ভিডিও এবং পরিসংখ্যান এক জায়গায়।</p>
      </div>

      {/* স্ট্যাটিস্টিক্স */}
      <div className="sg" style={{ marginBottom: 26 }}>
        <div className="sc">
          <div className="sc-label">মোট ভিডিও</div>
          <div className="sc-num">{stats.total}</div>
        </div>
        <div className="sc">
          <div className="sc-label">মোট ভিউ</div>
          <div className="sc-num">{stats.views.toLocaleString()}</div>
        </div>
        <div className="sc">
          <div className="sc-label">গড় রেটিং</div>
          <div className="sc-num">⭐ {stats.rating}</div>
        </div>
      </div>

      {/* আপলোড সেকশন */}
      <div className="sec">
        <div className="sh">
          <div className="st">📤 নতুন ভিডিও যোগ করুন</div>
        </div>
        <button
          onClick={onUpload}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 22,
          }}
        >
          ➕ নতুন ভিডিও আপলোড করুন
        </button>
      </div>

      {/* আপনার ভিডিও */}
      <div className="sec">
        <div className="sh">
          <div className="st">📹 আপনার ভিডিও</div>
        </div>
        {loading ? (
          <p className="em">⏳ লোড হচ্ছে...</p>
        ) : safeVideos.length === 0 ? (
          <div style={{ background: 'var(--su)', border: '1px solid var(--br)', borderRadius: 'var(--rl)', padding: 32, textAlign: 'center', color: 'var(--t3)' }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>এখনো কোনো ভিডিও আপলোড করা হয়নি</div>
            <div style={{ fontSize: 13 }}>উপরের বাটনে ক্লিক করে আপনার প্রথম ভিডিও যোগ করুন</div>
          </div>
        ) : (
          <div className="vg">
            {safeVideos.map(v => (
              <div key={v.id || v._id} style={{ position: 'relative' }}>
                <VideoCard v={v} onClick={onOpenVideo} showDelete={true} onDelete={handleDelete} />
                <div style={{ padding: '8px 12px', background: 'var(--bg2)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, fontSize: 12, color: 'var(--t2)' }}>
                  <div>👁 {v.views || 0} ভিউ</div>
                  <div>⭐ {v.rating || '—'} ({v.ratingCount || 0} রেটিং)</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
