import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
const SUBS=['গণিত','পদার্থবিজ্ঞান','রসায়ন','জীববিজ্ঞান','কম্পিউটার বিজ্ঞান','বাংলা','ইংরেজি'];
const CLS =['ক্লাস ৬','ক্লাস ৭','ক্লাস ৮','ক্লাস ৯','ক্লাস ১০','ক্লাস ১১','ক্লাস ১২','বিশ্ববিদ্যালয়'];
const SM  ={'গণিত':'math','পদার্থবিজ্ঞান':'phys','রসায়ন':'chem','জীববিজ্ঞান':'bio','কম্পিউটার বিজ্ঞান':'comp','বাংলা':'bangla','ইংরেজি':'english'};
const EM  ={'গণিত':'📐','পদার্থবিজ্ঞান':'⚛️','রসায়ন':'🧪','জীববিজ্ঞান':'🌿','কম্পিউটার বিজ্ঞান':'💻','বাংলা':'📖','ইংরেজি':'🔤'};
const fmt = b=>(b/1024/1024).toFixed(1)+' MB';

export default function UploadModal({ onClose, showToast, onUploaded }) {
  const { user, token } = useAuth();
  const [f,    setF]  = useState({title:'',subject:'',grade:'',desc:'',teacher:''});
  const [vf,   setVf] = useState(null);
  const [pdf,  setPdf]= useState(null);
  const [drag, setDrag]= useState(false);
  const [pct,  setPct] = useState(0);
  const [busy, setBusy]= useState(false);
  const vr=useRef(); const pr=useRef();
  const s=(k,v)=>setF(p=>({...p,[k]:v}));

  const onDrop=e=>{e.preventDefault();setDrag(false);const fi=e.dataTransfer.files[0];fi?.type.startsWith('video/')?setVf(fi):showToast('শুধু ভিডিও ফাইল টেনে আনুন');};

  const submit=()=>{
    if(!f.title.trim())  return showToast('শিরোনাম লিখুন');
    if(!f.subject)       return showToast('বিষয় বেছে নিন');
    if(!vf)              return showToast('ভিডিও ফাইল বেছে নিন');
    const fd=new FormData();
    fd.append('video',vf); if(pdf)fd.append('pdf',pdf);
    fd.append('title',f.title); fd.append('subject',SM[f.subject]||'other');
    fd.append('subjectName',f.subject); fd.append('teacher',f.teacher||'');
    fd.append('emoji',EM[f.subject]||'🎥'); fd.append('grade',f.grade); fd.append('description',f.desc);
    setBusy(true); setPct(0);
    const xhr=new XMLHttpRequest();
    xhr.upload.onprogress=e=>{if(e.lengthComputable)setPct(Math.round(e.loaded/e.total*100));};
    xhr.onload=()=>{
      setBusy(false);
      if(xhr.status===201){
        showToast('ভিডিও সফলভাবে আপলোড হয়েছে! 🎉');
        onUploaded?.();
        onClose();
      }
      else{let m='আপলোডে সমস্যা';try{m=JSON.parse(xhr.responseText).error||m;}catch{}showToast(m);}
    };
    xhr.onerror=()=>{setBusy(false);showToast('সার্ভার সংযোগে সমস্যা');};
    xhr.open('POST','/api/videos');
    if(token) xhr.setRequestHeader('Authorization',`Bearer ${token}`);
    xhr.send(fd);
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal fa">
        <div className="modal-head">
          <h2>📤 নতুন ভিডিও আপলোড</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* drag zone */}
          <div className={`uz${drag?' drag':''}${vf?' has':''}`}
            onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
            onClick={()=>!vf&&vr.current.click()} style={{cursor:vf?'default':'pointer'}}>
            <input ref={vr} type="file" accept="video/*" style={{display:'none'}} onChange={e=>e.target.files[0]&&setVf(e.target.files[0])}/>
            {vf?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <div style={{fontSize:42}}>🎬</div>
                <div style={{fontWeight:700,color:'var(--g)',fontSize:14}}>{vf.name}</div>
                <div style={{fontSize:12,color:'var(--t3)'}}>{fmt(vf.size)}</div>
                <button onClick={e=>{e.stopPropagation();setVf(null);}} style={{fontSize:12,color:'var(--c)',background:'none',border:'1px solid var(--c)',padding:'3px 10px',borderRadius:6}}>✕ বাদ দিন</button>
              </div>
            ):(
              <>
                <div style={{fontSize:42,marginBottom:10}}>☁️</div>
                <div style={{fontWeight:700,fontSize:15}}>ভিডিও এখানে টেনে আনুন</div>
                <div style={{fontSize:13,color:'var(--t3)',marginTop:5}}>অথবা ক্লিক করে বেছে নিন · MP4, MOV, AVI · সর্বোচ্চ ২GB</div>
              </>
            )}
          </div>

          {busy&&(
            <div className="prog-up">
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span>আপলোড হচ্ছে...</span><span style={{color:'var(--g)',fontWeight:700}}>{pct}%</span></div>
              <div className="prog-up-bar"><div className="prog-up-fill" style={{width:`${pct}%`}}/></div>
            </div>
          )}

          <div className="fg"><label className="fl">শিরোনাম *</label><input className="fi2" placeholder="যেমন: দ্বিঘাত সমীকরণ পর্ব ৩" value={f.title} onChange={e=>s('title',e.target.value)}/></div>
          <div className="fg"><label className="fl">শিক্ষকের নাম</label><input className="fi2" placeholder="যেমন: স্যার আবদুল্লাহ" value={f.teacher} onChange={e=>s('teacher',e.target.value)}/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="fg"><label className="fl">বিষয় *</label><select className="fs" value={f.subject} onChange={e=>s('subject',e.target.value)}><option value="">বেছে নিন</option>{SUBS.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="fg"><label className="fl">শ্রেণি</label><select className="fs" value={f.grade} onChange={e=>s('grade',e.target.value)}><option value="">বেছে নিন</option>{CLS.map(x=><option key={x}>{x}</option>)}</select></div>
          </div>
          <div className="fg"><label className="fl">বিবরণ</label><textarea className="fta" placeholder="কী শেখানো হয়েছে..." value={f.desc} onChange={e=>s('desc',e.target.value)}/></div>
          <div className="fg">
            <label className="fl">PDF নোট (ঐচ্ছিক)</label>
            <input ref={pr} type="file" accept="application/pdf" style={{display:'none'}} onChange={e=>e.target.files[0]&&setPdf(e.target.files[0])}/>
            {pdf
              ?<div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'var(--al)',borderRadius:8}}><span>📄</span><span style={{flex:1,fontSize:13,fontWeight:600}}>{pdf.name}</span><button onClick={()=>setPdf(null)} style={{color:'var(--c)',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>
              :<button className="fi2" style={{textAlign:'left',cursor:'pointer',color:'var(--t3)'}} onClick={()=>pr.current.click()}>📎 PDF ফাইল বেছে নিন...</button>
            }
          </div>
          <button className="sub-btn" onClick={submit} disabled={busy}>{busy?`আপলোড হচ্ছে... ${pct}%`:'✅ প্রকাশ করুন'}</button>
        </div>
      </div>
    </div>
  );
}
