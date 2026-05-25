import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { apiFetch } from '../api';

const SUBS=[{id:'all',l:'সব বিষয়'},{id:'math',l:'📐 গণিত'},{id:'phys',l:'⚛️ পদার্থ'},{id:'chem',l:'🧪 রসায়ন'},{id:'bio',l:'🌿 জীববিজ্ঞান'},{id:'comp',l:'💻 কম্পিউটার'}];

export default function Home({ onOpenVideo, showToast, search }) {
  const { token } = useAuth();
  const [filter,  setFilter]  = useState('all');
  const [videos,  setVideos]  = useState([]);
  const [trending,setTrending]= useState([]);
  const [progress,setProgress]= useState({ stats:{watched:0,courses:0,streak:0}, subjects:[], history:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams();
    if (filter!=='all') p.set('subject',filter);
    if (search) p.set('q', search);
    setLoading(true);
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      apiFetch(`/api/videos?${p}`, { headers: authHeaders }).then(r=>r.json()),
      apiFetch('/api/videos/trending', { headers: authHeaders }).then(r=>r.json()),
      apiFetch('/api/progress', { headers: authHeaders })
        .then(r => r.ok ? r.json() : { stats:{watched:0,courses:0,streak:0}, subjects:[], history:[] })
    ])
      .then(([v,t,pr])=>{ setVideos(v); setTrending(t); setProgress(pr); setLoading(false); })
      .catch(()=>{ showToast('সার্ভার সংযোগে সমস্যা হয়েছে'); setLoading(false); });
  }, [filter, search, token]);

  const ongoing = videos.filter(v=>v.progress>0);
  const recs    = videos.filter(v=>v.progress===0);

  return (
    <div className="pg fa">
      <div className="hero">
        <h1>স্বাগতম! 👋</h1>
        <p>আজকে কোন বিষয়টা পড়বে? তোমার জন্য নতুন ভিডিও অপেক্ষা করছে।</p>
        {progress && (
          <div className="hs">
            <div className="hs-item"><span>{progress.stats?.watched || 0}</span><span>দেখা ভিডিও</span></div>
            <div className="hs-item"><span>{progress.stats?.courses || 0}</span><span>সম্পন্ন কোর্স</span></div>
            <div className="hs-item"><span>🔥 {progress.stats?.streak || 0}</span><span>দিনের স্ট্রিক</span></div>
          </div>
        )}
      </div>

      <div className="sg">
        <div className="sc"><div className="sc-label">দেখা ভিডিও</div><div className="sc-num">{progress.stats?.watched || 0} টি</div><div className="sc-trend">আপনার অগ্রগতি সঠিক</div></div>
        <div className="sc"><div className="sc-label">স্ট্রিক</div><div className="sc-num">🔥 {progress.stats?.streak || 0} দিন</div><div className="sc-trend">দিন শুরু করুন</div></div>
        <div className="sc"><div className="sc-label">সম্পন্ন কোর্স</div><div className="sc-num">{progress.stats?.courses || 0} টি</div><div className="sc-trend">শোনার ইতিহাস আপডেট</div></div>
      </div>

      <div className="sec">
        <div className="sh"><div className="st">বিষয় বেছে নিন</div></div>
        <div className="chips">{SUBS.map(s=><button key={s.id} className={`chip${filter===s.id?' on':''}`} onClick={()=>setFilter(s.id)}>{s.l}</button>)}</div>

        {loading ? <p className="em">⏳ লোড হচ্ছে...</p> : <>
          <div className="sh"><div className="st">চলমান লেসন</div><button className="sa">সব দেখুন</button></div>
          <div className="vg" style={{marginBottom:22}}>
            {ongoing.length ? ongoing.map(v=><VideoCard key={v.id || v._id} v={v} onClick={onOpenVideo}/>) : <p className="em">কোনো চলমান ভিডিও নেই।</p>}
          </div>
          <div className="sh"><div className="st">প্রস্তাবিত ভিডিও</div><button className="sa">সব দেখুন</button></div>
          <div className="vg">
            {recs.length ? recs.map(v=><VideoCard key={v.id || v._id} v={v} onClick={onOpenVideo}/>) : <p className="em">কোনো ভিডিও পাওয়া যায়নি।</p>}
          </div>
        </>}
      </div>

      <div className="sec">
        <div className="sh"><div className="st">🔥 সবচেয়ে জনপ্রিয়</div></div>
        <div className="tl">
          {trending.map((v,i)=>(
            <div key={v.id || v._id} className="ti" onClick={()=>onOpenVideo(v)}>
              <div className={`trk${i<2?' top':''}`}>{['১','২','৩','৪'][i]}</div>
              <div className="ti-info"><div className="ti-title">{v.title}</div><div className="ti-meta">{v.subjectName} · {v.teacher}</div></div>
              <div className="ti-views">👁 {v.views?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
