import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { apiFetch } from '../api';

export default function Profile({ showToast, onOpenVideo, onUpload, refresh }) {
  const { user, logout, token, setUser, normalizeUser } = useAuth();
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ firstName:'', lastName:'', username:'', bio:'', profilePicture:'' });
  const [saving, setSaving] = useState(false);
  const safeVideos = Array.isArray(myVideos) ? myVideos : [];

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setProfile({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || ''
    });
    apiFetch(`/api/users/${user.id || user._id}/videos`)
      .then(r => r.json())
      .then(v => { setMyVideos(Array.isArray(v) ? v : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, refresh]);

  const handleLogout = () => {
    logout();
    showToast('লগআউট সফল হয়েছে 👋');
  };

  const handleDelete = (id) => {
    if (!confirm('এই ভিডিওটি ডিলিট করতে চান?')) return;
    apiFetch(`/api/videos/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        if (r.ok) {
          setMyVideos(prev => Array.isArray(prev) ? prev.filter(v => (v.id || v._id) !== id) : []);
          showToast('ভিডিও ডিলিট হয়েছে ✓');
        } else {
          return r.json().then(e => showToast(e.error || 'ডিলিট করতে সমস্যা'));
        }
      })
      .catch(() => showToast('ডিলিট করতে সমস্যা'));
  };

  const handleProfileSave = async () => {
    if (!token) return showToast('লগইন করুন');
    setSaving(true);
    try {
      const response = await apiFetch(`/api/users/${user.id || user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.error || 'প্রোফাইল আপডেট ব্যর্থ');
      const normalized = normalizeUser(updated);
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
      showToast('প্রোফাইল সফলভাবে আপডেট হয়েছে ✓');
    } catch (err) {
      showToast(err.message || 'প্রোফাইল আপডেট ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  return (
    <div className="pg fa">
      {/* Profile Container - Side by side on desktop */}
      <div className="profile-container">
        {/* প্রোফাইল তথ্য */}
        <div className="profile-section">
          <div className="prof-card">
            <div className="prof-av">{user.avatar}</div>
            <div className="prof-info">
              <div className="prof-name">{user.name}</div>
              <div className="prof-role">{user.role === 'teacher' ? '👨‍🏫 শিক্ষক' : '🎓 শিক্ষার্থী'}</div>
              <div className="prof-user">@{user.username}</div>
            </div>
            <div className="prof-actions">
              {user.role === 'teacher' && <button className="ab pri" onClick={onUpload}>📤 আপলোড</button>}
              <button className="logout-btn" onClick={handleLogout}>🚪 লগআউট</button>
            </div>
          </div>
        </div>

        {/* প্রোফাইল এডিট */}
        <div className="profile-section">
          <div className="prof-card" style={{padding:20}}>
            <div style={{marginBottom:14,fontSize:16,fontWeight:700}}>প্রোফাইল এডিট করুন</div>
            <div className="prof-form">
              <div className="fg"><label className="fl">প্রোফাইল আইকন (ইমোজি)</label><input className="fi2" value={profile.profilePicture} onChange={e=>setProfile(p=>({...p,profilePicture:e.target.value}))} placeholder="🎓 বা 👨‍🏫"/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}} className="name-grid">
                <div className="fg"><label className="fl">প্রথম নাম</label><input className="fi2" value={profile.firstName} onChange={e=>setProfile(p=>({...p,firstName:e.target.value}))}/></div>
                <div className="fg"><label className="fl">শেষ নাম</label><input className="fi2" value={profile.lastName} onChange={e=>setProfile(p=>({...p,lastName:e.target.value}))}/></div>
              </div>
              <div className="fg"><label className="fl">ইউজারনেম</label><input className="fi2" value={profile.username} onChange={e=>setProfile(p=>({...p,username:e.target.value}))}/></div>
              <div className="fg"><label className="fl">বায়ো</label><textarea className="fta" value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}/></div>
              <button className="sub-btn" onClick={handleProfileSave} disabled={saving}>{saving ? '⏳ সেভ হচ্ছে...' : '💾 প্রোফাইল সংরক্ষণ করুন'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* স্ট্যাটস */}
      <div className="sg" style={{marginBottom:26}}>
        <div className="sc"><div className="sc-label">আপলোড করা ভিডিও</div><div className="sc-num">{safeVideos.length}</div></div>
        <div className="sc"><div className="sc-label">মোট ভিউ</div><div className="sc-num">{safeVideos.reduce((a,v)=>a+(v.views||0),0).toLocaleString()}</div></div>
        <div className="sc"><div className="sc-label">গড় রেটিং</div><div className="sc-num">{safeVideos.length ? (safeVideos.reduce((a,v)=>a+(v.rating||0),0)/safeVideos.length).toFixed(1) : '—'}</div></div>
      </div>

      {/* আমার ভিডিও */}
      <div className="sh"><div className="st">📹 আমার আপলোড করা ভিডিও</div></div>
      {loading ? <p className="em">⏳ লোড হচ্ছে...</p> :
        safeVideos.length === 0
          ? <div style={{background:'var(--su)',border:'1px solid var(--br)',borderRadius:'var(--rl)',padding:'32px',textAlign:'center',color:'var(--t3)'}}>
              <div style={{fontSize:42,marginBottom:12}}>📭</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>এখনো কোনো ভিডিও আপলোড করা হয়নি</div>
              <div style={{fontSize:13}}>উপরের "📤 আপলোড" বাটনে ক্লিক করে প্রথম ভিডিও যোগ করুন</div>
            </div>
          : <div className="vg">{safeVideos.map(v=><VideoCard key={v.id || v._id} v={v} onClick={onOpenVideo} showDelete={true} onDelete={handleDelete}/>)}</div>
      }
    </div>
  );
}
