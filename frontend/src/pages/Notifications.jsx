import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

const NOTIF_ICON = {
  comment: '💬',
  rating: '⭐',
  message: '✉️'
};

export default function Notifications({ showToast, onRead }) {
  const { token } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const safeNotifs = Array.isArray(notifs) ? notifs : [];

  useEffect(()=>{
    if (!token) return;
    apiFetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : [])
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .catch(()=>{});
  },[token]);

  const markOne = id => {
    if (!token) return;
    apiFetch(`/api/notifications/${id}/read`,{method:'PATCH', headers:{ Authorization: `Bearer ${token}` }})
      .then(() => {
        setNotifs(p => {
          const next = p.map(n => n._id === id || n.id === id ? { ...n, read: true } : n);
          const count = next.filter(n => !n.read).length;
          onRead?.(count);
          return next;
        });
      })
      .catch(()=>{});
  };
  const markAll = () => {
    if (!token) return;
    apiFetch('/api/notifications/read-all',{method:'PATCH', headers:{ Authorization: `Bearer ${token}` }})
      .then(()=>{ setNotifs(p=>p.map(n=>({...n,read:true}))); onRead?.(0); showToast('সব বিজ্ঞপ্তি পঠিত ✓'); }).catch(()=>{});
  };

  const unreadCount = safeNotifs.filter(n => !n.read).length;
  return (
    <div className="pg fa">
      <div className="sh" style={{marginBottom:16}}>
        <div className="st" style={{fontSize:20}}>🔔 বিজ্ঞপ্তি {unreadCount>0&&<span style={{fontSize:13,background:'var(--c)',color:'#fff',padding:'2px 8px',borderRadius:10,marginLeft:8}}>{unreadCount}</span>}</div>
        {unreadCount>0 && <button className="ra-btn" onClick={markAll}>✓ সব পঠিত করুন</button>}
      </div>
      <div className="nl">
        {safeNotifs.length===0 && <p className="em" style={{padding:16}}>কোনো বিজ্ঞপ্তি নেই।</p>}
        {safeNotifs.map(n=>(
          <div key={n.id || n._id} className={`nit${!n.read ? ' unr' : ''}`} onClick={()=>!n.read && markOne(n.id || n._id)}>
            <div className="nic">{NOTIF_ICON[n.type] || '🔔'}</div>
            <div className="ntx">
              <div className="ntt">{n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) : 'বিজ্ঞপ্তি'}</div>
              <div className="ntb">{n.message || 'আপনার কাছে একটি নতুন বিজ্ঞপ্তি রয়েছে।'}</div>
              <div className="ntm">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
            </div>
            {!n.read&&<div className="ud"/>}
          </div>
        ))}
      </div>
    </div>
  );
}
