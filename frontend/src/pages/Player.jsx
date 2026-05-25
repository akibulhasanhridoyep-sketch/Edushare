import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

const TB = { math:'#E1F5EE', phys:'#E6F1FB', chem:'#FAEEDA', bio:'#EAF3DE', comp:'#EEEDFE' };

export default function Player({ video, showToast, onOpenVideo }) {
  const { user, token } = useAuth();
  const [videoData, setVideoData] = useState(video || null);
  const [playing,  setPlaying]  = useState(false);
  const [seek,     setSeek]     = useState(0);
  const [rating,   setRating]   = useState(0);
  const [comments, setComments] = useState([]);
  const [comment,  setComment]  = useState('');
  const [related,  setRelated]  = useState([]);
  const [notes,    setNotes]    = useState('');
  const videoRef = useRef(null);
  const lastSavedRef = useRef(0);

  const safeComments = Array.isArray(comments) ? comments : [];
  const safeRelated = Array.isArray(related) ? related : [];
  const videoSrc = videoData?.videoUrl || '';

  const getVideoType = (url) => {
    if (!url) return 'video/mp4';
    const clean = url.split('?')[0].split('#')[0];
    const ext = clean.split('.').pop().toLowerCase();
    if (ext === 'webm') return 'video/webm';
    if (ext === 'ogg' || ext === 'ogv') return 'video/ogg';
    if (ext === 'mov') return 'video/quicktime';
    return 'video/mp4';
  };

  if (!videoData) {
    return (
      <div className="pg fa" style={{ minHeight: '70vh' }}>
        <p className="em">কোনো ভিডিও নির্বাচিত হয়নি। হোম পেজে ভিডিও নির্বাচন করুন।</p>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className="pg fa" style={{ minHeight: '70vh' }}>
        <p className="em">ভিডিও লিংকটি অনুপলব্ধ। অনুগ্রহ করে অন্য ভিডিও দেখুন অথবা ভিডিওটি আপলোড করুন।</p>
      </div>
    );
  }

  useEffect(() => {
    if (!videoData) return;
    const videoId = videoData.id || videoData._id;
    apiFetch(`/api/comments/${videoId}`)
      .then(r=>r.json())
      .then(c => setComments(Array.isArray(c) ? c : []))
      .catch(()=>{});
    apiFetch('/api/videos')
      .then(r=>r.json())
      .then(all => {
        const arr = Array.isArray(all) ? all : [];
        setRelated(arr.filter(x=>(x.id || x._id) !== videoId).slice(0,4));
      })
      .catch(()=>{});
    // view count বাড়াই
    apiFetch(`/api/videos/${videoId}/view`, {method:'PATCH'}).catch(()=>{});
    setSeek(videoData.progress||0);
    setPlaying(false);
    setRating(videoData.rating || 0);
    lastSavedRef.current = videoData.progress||0;

    if (token) {
      apiFetch('/api/progress', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(pr => {
          const item = pr?.history?.find(h => h.id === videoId || h._id === videoId);
          if (item) {
            setSeek(item.progress || 0);
            lastSavedRef.current = item.progress || 0;
          }
        }).catch(()=>{});
    }
  }, [videoData, token]);

  useEffect(() => {
    setVideoData(video || null);
  }, [video]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (playing) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  };

  const saveProgress = (value) => {
    if (!token || !videoData) return;
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    if (pct === lastSavedRef.current) return;
    apiFetch(`/api/videos/${videoData.id || videoData._id}/progress`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({ progress: pct })
    }).then(() => { lastSavedRef.current = pct; }).catch(()=>{});
  };

  const addComment = () => {
    if (!videoData) return;
    if (!comment.trim()) return;
    if (!token) {
      showToast('মন্তব্য করতে লগইন করুন');
      return;
    }
    apiFetch(`/api/comments/${videoData.id || videoData._id}`, {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({ text: comment })
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'মন্তব্য পাঠাতে সমস্যা');
        }
        return r.json();
      })
      .then(c=>{ 
        setComments(p => Array.isArray(p) ? [c, ...p] : [c]); 
        setComment(''); 
        showToast('মন্তব্য পাঠানো হয়েছে ✓'); 
      })
      .catch((err)=>showToast(err.message || 'মন্তব্য পাঠাতে সমস্যা'));
  };

  const handleRating = n => {
    if (!videoData) return;
    if (!token) { showToast('রেটিং দিতে লগইন করুন'); return; }
    setRating(n);
    apiFetch(`/api/videos/${videoData.id || videoData._id}/rating`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({ rating: n })
    })
      .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
      .then((res) => {
        const updatedVideo = res?.video || res;
        if (updatedVideo) {
          setVideoData(prev => ({ ...prev, ...updatedVideo }));
          setRating(updatedVideo.rating || n);
        }
      })
      .catch(()=>showToast('রেটিং পাঠাতে সমস্যা হয়েছে'));
  };

  return (
    <div className="pg fa">
      <div className="pl">
        {/* বাম */}
        <div>
          <div className="vplayer">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              style={{ width: '100%', height: '100%' }}
              onPlay={() => setPlaying(true)}
              onError={() => showToast('ভিডিও লোড হচ্ছেনা — ফাইলটি অনুপলব্ধ বা ব্রাউজার সাপোর্ট নেই')}
              onPause={() => {
                setPlaying(false);
                saveProgress(seek);
              }}
              onEnded={() => saveProgress(100)}
              onTimeUpdate={(e) => {
                const video = e.target;
                if (!video.duration) return;
                const pct = Math.floor((video.currentTime / video.duration) * 100);
                setSeek(pct);
                if (pct - lastSavedRef.current >= 5) saveProgress(pct);
              }}
              onLoadedMetadata={() => {
                // metadata loaded
              }}
            >
              <source src={videoSrc} type={getVideoType(videoSrc)} />
              আপনার ব্রাউজার ভিডিও প্লে করতে পারছে না।
            </video>
          </div>

          <div className="vic">
            <div className="vtbig">{videoData.title}</div>
            <div className="vmr">
              <div className="tch"><div className="tav">{(videoData.teacher||'শ')[0]}</div><span className="tnm">{videoData.teacher}</span></div>
              <span style={{fontSize:13,color:'var(--t3)'}}>👁 {(videoData.views||0).toLocaleString()} বার দেখা</span>
              <span style={{fontSize:13,color:'var(--a)',fontWeight:700}}>⭐ {videoData.rating||'—'} ({videoData.ratingCount||0})</span>
            </div>
            <div className="ar">
              <button className="ab pri" onClick={togglePlay}>{playing?'⏸ বিরতি':'▶ চালান'}</button>
              <button className="ab" onClick={()=>showToast('বুকমার্ক যোগ হয়েছে ✓')}>🔖 সংরক্ষণ</button>
              {videoData.pdfUrl && <button className="ab" onClick={()=>window.open(`http://localhost:5000${videoData.pdfUrl}`)}>📄 নোট PDF</button>}
              <button className="ab" onClick={()=>showToast('অফলাইনে সংরক্ষিত হচ্ছে...')}>⬇️ অফলাইন</button>
            </div>
            {videoData.description && <p style={{fontSize:13,color:'var(--t2)',marginTop:12,lineHeight:1.7}}>{videoData.description}</p>}
            <div className="nb">
              <label>📝 আমার নোট</label>
              <textarea placeholder="এই ভিডিও সম্পর্কে নোট লিখুন..." value={notes} onChange={e=>setNotes(e.target.value)}/>
            </div>
          </div>
        </div>

        {/* ডান */}
        <div className="sp">
          {/* রেটিং */}
          <div className="pc">
            <div className="pt2">⭐ রেটিং দিন</div>
            <div className="rb">
              <div className="rl2">এই ভিডিওটি কেমন লেগেছে?</div>
              <div className="stars">
                {[1,2,3,4,5].map(n=>(
                  <span key={n} className={`star${rating>=n?' lit':''}`} onClick={()=>handleRating(n)}>★</span>
                ))}
              </div>
              {rating>0 && <div style={{fontSize:12,color:'var(--g)',marginTop:8,fontWeight:600}}>{['','খারাপ','মোটামুটি','ভালো','খুব ভালো','অসাধারণ!'][rating]}</div>}
            </div>
          </div>

          {/* মন্তব্য */}
          <div className="pc">
            <div className="pt2">💬 মন্তব্য ({safeComments.length})</div>
            <div className="cl2">
              {safeComments.length===0 && <p className="em">এখনো কোনো মন্তব্য নেই।</p>}
              {safeComments.map(c=>(
                <div key={c.id || c._id} className="ci">
                  <div className="cav">{c.userId?.profilePicture || c.userId?.firstName?.[0] || c.avatar || 'আ'}</div>
                  <div>
                    <div className="cn">{c.userId ? `${c.userId.firstName || ''} ${c.userId.lastName || ''}`.trim() || c.userId.username || c.userId.email?.split('@')[0] : c.name || 'আপনি'}</div>
                    <div className="ct">{c.text}</div>
                    <div className="ctm">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cir">
              <input type="text" placeholder="মন্তব্য লিখুন..." value={comment}
                onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addComment()}/>
              <button className="sb2" onClick={addComment}>➤</button>
            </div>
          </div>

          {/* সম্পর্কিত */}
          <div className="pc">
            <div className="pt2">📚 সম্পর্কিত ভিডিও</div>
            <div className="rl3">
              {safeRelated.map(r=>(
                <div key={r.id || r._id} className="ri" onClick={()=>onOpenVideo(r)}>
                  <div className="rth" style={{background:TB[r.subject]||'#eee'}}>{r.emoji}</div>
                  <div><div className="rtit">{r.title}</div><div className="rtea">{r.teacher} · {r.duration}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
