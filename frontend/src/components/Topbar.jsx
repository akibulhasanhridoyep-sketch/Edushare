export default function Topbar({ onHome, onNotif, onProfile, onUpload, search, onSearch, unread, userAvatar }) {
  return (
    <div className="topbar">
      <div className="logo" onClick={onHome}><div className="logo-icon">🎓</div>EduShare</div>
      <div className="sw">
        <span className="sw-icon">🔍</span>
        <input type="text" placeholder="ভিডিও, শিক্ষক বা বিষয় খুঁজুন..." value={search} onChange={e=>onSearch(e.target.value)} />
      </div>
      <div className="tr">
        <button className="ib" onClick={onNotif} title="বিজ্ঞপ্তি">🔔{unread>0&&<div className="nd"/>}</button>
        <button className="avb" onClick={onProfile}>{userAvatar}</button>
      </div>
    </div>
  );
}
