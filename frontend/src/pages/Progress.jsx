import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
const TB={'💻':'#EEEDFE','📐':'#E1F5EE','⚛️':'#E6F1FB','🧪':'#FAEEDA','🌿':'#EAF3DE'};
export default function Progress() {
  const { token } = useAuth();
  const [d, setD] = useState(null);
  useEffect(()=>{
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/progress', { headers })
      .then(r => r.ok ? r.json() : { stats:{watched:0,hours:0,courses:0,teachers:0,streak:0}, subjects:[], history: [] })
      .then(setD)
      .catch(()=>setD({ stats:{watched:0,hours:0,courses:0,teachers:0,streak:0}, subjects:[], history: [] }));
  }, [token]);
  if (!d) return <div className="pg"><p className="em">⏳ লোড হচ্ছে...</p></div>;
  const { stats = { watched:0, hours:0, courses:0, teachers:0, streak:0 }, subjects = [], history = [] } = d;
  const cards=[
    {icon:'✅',bg:'#E1F5EE',label:'সম্পন্ন ভিডিও',val:stats.watched},
    {icon:'⏰',bg:'#E6F1FB',label:'মোট শেখার সময়',val:`${stats.hours}ঘ`},
    {icon:'⭐',bg:'#FAEEDA',label:'সম্পন্ন কোর্স',val:stats.courses},
    {icon:'🔥',bg:'#FAECE7',label:'স্ট্রিক',val:`${stats.streak} দিন`},
  ];
  return (
    <div className="pg fa">
      <div className="sh" style={{marginBottom:22}}><div className="st" style={{fontSize:20}}>📊 আমার অগ্রগতি</div></div>
      <div className="pgrid">
        {cards.map(c=>(
          <div key={c.label} className="psc">
            <div className="pi" style={{background:c.bg}}>{c.icon}</div>
            <div><div className="pn">{c.val}</div><div className="pd">{c.label}</div></div>
          </div>
        ))}
      </div>
      <div className="sh" style={{marginBottom:14}}><div className="st">বিষয়ভিত্তিক অগ্রগতি</div></div>
      <div className="sub-prog">
        {subjects.map(s=>(
          <div key={s.name} className="sr">
            <div className="srh"><span className="srn">{s.name}</span><span className="srp" style={{color:s.color}}>{s.pct}%</span></div>
            <div className="pbar"><div className="pbf" style={{width:`${s.pct}%`,background:s.color}}/></div>
          </div>
        ))}
      </div>
      <div className="sh" style={{margin:'22px 0 14px'}}><div className="st">দেখার ইতিহাস</div></div>
      <div className="hl">
        {history.map((h,i)=>(
          <div key={i} className="hi">
            <div className="hth" style={{background:TB[h.emoji]||'#eee'}}>{h.emoji}</div>
            <div className="hti">
              <div className="htt">{h.title}</div>
              <div className="htm">{h.meta}</div>
              <div className="hpct" style={{color:'var(--g)'}}>{'█'.repeat(Math.floor(h.pct/10))}{'░'.repeat(10-Math.floor(h.pct/10))} {h.pct}%</div>
            </div>
            <span className={`hbadge ${h.status==='done'?'bd':'bo'}`}>{h.status==='done'?'সম্পন্ন':'চলমান'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
