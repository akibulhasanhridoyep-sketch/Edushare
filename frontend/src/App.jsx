import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login         from './pages/Login';
import Home          from './pages/Home';
import TeacherHome   from './pages/TeacherHome';
import Player        from './pages/Player';
import Progress      from './pages/Progress';
import Notifications from './pages/Notifications';
import Profile       from './pages/Profile';
import AuthSuccess   from './pages/AuthSuccess';
import Topbar        from './components/Topbar';
import Toast         from './components/Toast';
import UploadModal   from './components/UploadModal';
import { apiFetch } from './api';

const TEACHER_TABS = [
  { id:'home',   label:'📹 আমার ভিডিও' },
  { id:'notif',  label:'🔔 বিজ্ঞপ্তি'    },
  { id:'prof',   label:'👤 প্রোফাইল'    },
];

const STUDENT_TABS = [
  { id:'home',   label:'🏠 হোম'        },
  { id:'prog',   label:'📊 অগ্রগতি'    },
  { id:'notif',  label:'🔔 বিজ্ঞপ্তি'   },
  { id:'prof',   label:'👤 প্রোফাইল'    },
];

function Shell() {
  const { user, ready, token } = useAuth();
  const [page,      setPage]      = useState('home');
  const [video,     setVideo]     = useState(null);
  const [toast,     setToast]     = useState({ msg:'', show:false });
  const [search,    setSearch]    = useState('');
  const [showUp,    setShowUp]    = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isAuthSuccess, setIsAuthSuccess] = useState(window.location.pathname.startsWith('/auth-success'));
  
  const TABS = user?.role === 'teacher' ? TEACHER_TABS : STUDENT_TABS;

  const showToast = useCallback(msg => {
    setToast({ msg, show:true });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 2800);
  }, []);

  if (isAuthSuccess) {
    return <AuthSuccess />;
  }

  useEffect(() => {
    if (!user || !token) return;
    apiFetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(ns => setUnread(Array.isArray(ns) ? ns.filter(n => !n.read).length : 0))
      .catch(() => {});
  }, [user, page, token]);

  const openVideo = useCallback(v => { setVideo(v); setPage('player'); window.scrollTo(0,0); }, []);
  const goTo = p => { setPage(p); window.scrollTo(0,0); };

  if (!ready) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:18,color:'var(--g)'}}>⏳ লোড হচ্ছে...</div>;
  if (!user)  return <Login />;

  return (
    <div>
      <Topbar
        onHome={()=>goTo('home')} onNotif={()=>goTo('notif')}
        onProfile={()=>goTo('prof')} onUpload={()=>setShowUp(true)}
        search={search} onSearch={setSearch} unread={unread}
        userAvatar={user.avatar}
      />
      <div className="nav">
        {TABS.map(t => <button key={t.id} className={`nt${page===t.id?' active':''}`} onClick={()=>goTo(t.id)}>{t.label}</button>)}
      </div>

      {page==='home'   && (user.role==='teacher' ? <TeacherHome key="th" onOpenVideo={openVideo} showToast={showToast} onUpload={()=>setShowUp(true)} refresh={refreshCount} /> : <Home key="home" onOpenVideo={openVideo} showToast={showToast} search={search} />)}
      {page==='player' && <Player key="play"  video={video}           showToast={showToast} onOpenVideo={openVideo} />}
      {page==='prog'   && <Progress key="pg"                                                                        />}
      {page==='notif'  && <Notifications key="no"  showToast={showToast} onRead={count => setUnread(count)} />}
      {page==='prof'   && <Profile key="pr"   showToast={showToast}   onOpenVideo={openVideo} onUpload={()=>setShowUp(true)} refresh={refreshCount} />}

      {showUp && <UploadModal onClose={()=>setShowUp(false)} showToast={showToast} onUploaded={() => setRefreshCount(n => n + 1)} />}
      <Toast msg={toast.msg} show={toast.show} />
    </div>
  );
}

export default function App() {
  return <AuthProvider><Shell /></AuthProvider>;
}
