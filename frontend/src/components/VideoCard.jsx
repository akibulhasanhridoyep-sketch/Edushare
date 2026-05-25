const BM = { math:'bm', phys:'bp', chem:'bc', bio:'bb', comp:'bco' };
export default function VideoCard({ v, onClick, showDelete, onDelete }) {
  return (
    <div className="vc" onClick={()=>onClick(v)}>
      {showDelete && <button className="delete-btn" onClick={(e)=>{e.stopPropagation(); onDelete(v.id || v._id);}} title="ডিলিট">🗑️</button>}
      <div className={`vt ${v.subject}`}>
        <span>{v.emoji}</span>
        <div className="dur">{v.duration}</div>
        {v.progress>0&&<div className="pt"><div className="pf" style={{width:`${v.progress}%`}}/></div>}
      </div>
      <div className="vcon">
        <span className={`vbadge ${BM[v.subject]||''}`}>{v.subjectName}</span>
        <div className="vtit">{v.title}</div>
        <div className="vmeta"><span className="vtea">{v.teacher}</span><span className="vrat">★ {v.rating||'—'}</span></div>
      </div>
    </div>
  );
}
