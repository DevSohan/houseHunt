import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initialData, portalUrls, validLandlordId, match, urlKey, validUrl, validateData, type Apartment, type Criteria, type Data, type Portal, type PortalStatus, type Stage } from './model';
import { loadData, saveData } from './storage';
import { identity, listingLink } from './capture';
import './style.css';

const money = (n: number | null) => n === null ? 'Rent unknown' : new Intl.NumberFormat('de-DE', {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const dateLabel = (s: string) => s ? new Date(s).toLocaleString() : 'Not checked this session';
const sectionFromUrl = () => ['Portals','Apartments','Settings'].find(t=>t.toLowerCase()===location.hash.slice(1).toLowerCase()) || 'Portals';
const stages: Stage[] = ['Saved','Contacted','Viewing','Archived'];
function Field({label,children}: {label:string;children:React.ReactNode}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Modal({children, wide, label, onClose}: {children:React.ReactNode;wide?:boolean;label:string;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();},[]);
  return <dialog ref={ref} className={`modal ${wide?'wide':''}`} aria-labelledby={label} onCancel={e=>{e.preventDefault();onClose();}}>{children}</dialog>;
}
function App() {
  const [data,setData] = useState<Data | null>(null), [tab,setTab] = useState(sectionFromUrl), [error,setError] = useState(''), [notice,setNotice] = useState('');
  const [removed,setRemoved] = useState<{apartment:Apartment;keys:string[]}|null>(null);
  useEffect(()=>{history.replaceState(null,'',`#${tab.toLowerCase()}`);},[tab]);
  const [activity,setActivity] = useState<{source:string;found:number;status:string;at:string}|null>(null);
  const [busy,setBusy] = useState(false), [opening,setOpening] = useState(false), [failed,setFailed] = useState<string[]>([]);
  const busyRef = useRef(false), openRef = useRef(false), current = useRef<Data | null>(null);
  const [selected,setSelected] = useState<string[]>([]), [portal,setPortal] = useState<Portal | null>(null), [apartment,setApartment] = useState<Apartment | null>(null);
  const [criteria,setCriteria] = useState<Criteria>(initialData().criteria), [filter,setFilter] = useState('All'), [showArchived,setShowArchived] = useState(false);
  useEffect(() => { loadData().then(d => { current.current=d; setData(d); setCriteria(d.criteria); }).catch(e => setError(String(e))); }, []);
  useEffect(()=>{
    if(typeof chrome==='undefined' || !chrome.storage?.onChanged)return;
    void chrome.storage.local.get('captureActivity').then(result=>{if(result.captureActivity)setActivity(result.captureActivity);});
    const listener=(changes:Record<string,chrome.storage.StorageChange>,area:string)=>{
      if(area!=='local')return;
      if(changes.captureActivity?.newValue)setActivity(changes.captureActivity.newValue);
      if(changes.houseHunt?.newValue){try{const next=validateData(changes.houseHunt.newValue);current.current=next;setData(next);}catch{/* Keep the last validated state. */}}
    };
    chrome.storage.onChanged.addListener(listener);
    return ()=>chrome.storage.onChanged.removeListener(listener);
  },[]);
  async function commit(next: Data) {
    if (busyRef.current || !current.current) return false;
    busyRef.current=true; setBusy(true); setError(''); setNotice('');
    try { const saved=await saveData(next,current.current); current.current=saved; setData(saved); return true; }
    catch(e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    finally { busyRef.current=false; setBusy(false); }
  }
  async function openPortals(ids: string[]) {
    if (openRef.current || busyRef.current || !current.current) return;
    openRef.current=true; setOpening(true); setFailed([]);
    try {
      const list = current.current.portals.filter(p => ids.includes(p.id));
      const next = {...current.current,portals:current.current.portals.map(p => ids.includes(p.id) ? {...p,status:'Not checked' as PortalStatus,checkedAt:null} : p)};
      if (!await commit(next)) return;
      const failures: string[] = [];
      for (const p of list) {
        try {
          if (typeof chrome !== 'undefined' && chrome.tabs?.create) await chrome.tabs.create({url:portalUrls(p).url,active:false});
          else throw new Error('Opening portals requires the installed Chrome extension.');
        } catch { failures.push(p.id); }
      }
      setFailed(failures); setNotice(`Opened ${list.length-failures.length} of ${list.length} portals.${failures.length ? ' Retry failed portals below. Browser preview cannot open portal batches.' : ''}`);
    } finally { openRef.current=false; setOpening(false); }
  }
  async function openApplications(p:Portal) {
    const url=portalUrls(p).applicationsUrl;
    if(!url || openRef.current || busyRef.current)return;
    openRef.current=true;setOpening(true);setError('');
    try {
      if(typeof chrome!=='undefined' && chrome.tabs?.create)await chrome.tabs.create({url,active:true});
      else window.open(url,'_blank','noopener,noreferrer');
    } catch(e) {setError(e instanceof Error?e.message:'Could not open applications.');}
    finally {openRef.current=false;setOpening(false);}
  }
  async function savePortal(e: React.FormEvent) {
    e.preventDefault(); if (!portal || !data) return;
    if(portal.type==='immomio' && !validLandlordId(portal.landlordId || '')) { setError('Enter a valid Immomio landlord ID.'); return; }
    const portalUrl=portalUrls(portal).url;
    if(portal.applicationsUrl && !validUrl(portal.applicationsUrl)) { setError('Enter an http or https applications URL.'); return; }
    if (!validUrl(portalUrl)) { setError('Enter an http or https portal URL.'); return; }
    if (data.portals.some(p => p.id !== portal.id && urlKey(p.url) === urlKey(portalUrl))) { setError('This portal URL is already saved.'); return; }
    const p = {...portal,name:portal.name.trim(),url:portalUrl.trim()};
    if (await commit({...data, portals:data.portals.some(x=>x.id===p.id) ? data.portals.map(x=>x.id===p.id?p:x) : [...data.portals,p]})) setPortal(null);
  }
  async function saveApartment(e: React.FormEvent) {
    e.preventDefault(); if (!apartment || !data) return;
    if (apartment.url && !validUrl(apartment.url)) { setError('Enter an http or https listing URL, or leave it blank.'); return; }
    if(apartment.capture) apartment.capture={...apartment.capture,manual:true};
    const duplicate = data.apartments.find(a => a.id !== apartment.id && apartment.url && urlKey(a.url) === urlKey(apartment.url) && !(a.capture && apartment.capture && a.capture.key !== apartment.capture.key));
    if (duplicate) { if (confirm('This listing is already saved. Open the existing record? Your current form will be replaced.')) setApartment({...duplicate}); return; }
    if (await commit({...data,apartments:data.apartments.some(a=>a.id===apartment.id) ? data.apartments.map(a=>a.id===apartment.id?apartment:a) : [...data.apartments,apartment]})) setApartment(null);
  }
  function markVisited(record:Apartment) {
    if(!current.current)return;
    void commit({...current.current,apartments:current.current.apartments.map(a=>a.id===record.id?{...a,visitedAt:new Date().toISOString()}:a)});
  }
  async function removeApartment(record:Apartment) {
    if(!current.current)return;
    const keys=[record.capture?.key,record.url && (!record.capture || listingLink(record.url)) ? identity(record.url) : undefined].filter((key):key is string=>!!key);
    const state=current.current;
    const addedKeys=keys.filter(key=>!state.dismissedKeys?.includes(key));
    if(await commit({...state,apartments:state.apartments.filter(a=>a.id!==record.id),dismissedKeys:[...new Set([...(state.dismissedKeys || []),...keys])]}))setRemoved({apartment:record,keys:addedKeys});
  }
  async function undoRemove() {
    if(!removed || !current.current)return;
    const state=current.current;
    if(await commit({...state,apartments:[...state.apartments,removed.apartment],dismissedKeys:state.dismissedKeys?.filter(key=>!removed.keys.includes(key))}))setRemoved(null);
  }
  async function restore(file?: File) {
    if (!file || !data) return;
    try {
      if (file.size > 10_000_000) throw new Error('Backup is too large (maximum 10 MB).');
      const restored = validateData(JSON.parse(await file.text()));
      if (!confirm(`Replace all current data with ${restored.portals.length} portals and ${restored.apartments.length} apartments from this backup?`)) return;
      if (await commit(restored)) { setCriteria(current.current!.criteria); setSelected([]); setFailed([]); setNotice('Backup restored.'); setRemoved(null); }
    } catch(e) { setError(e instanceof Error ? e.message : 'Could not read backup.'); }
  }
  function download() { const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`house-hunt-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
  if (!data) return <main><h1>Hamburg House Hunt</h1><p role={error?'alert':'status'}>{error || 'Loading your dashboard…'}</p>{error && <button onClick={()=>location.reload()}>Retry loading</button>}</main>;
  const blocked = busy || opening;
  const counts = data.apartments.filter(a=>a.stage!=='Archived').reduce((n,a)=>{ n[match(a,data.criteria).rank]++; return n; },[0,0,0]);
  const updatePortal = (id:string,patch:Partial<Portal>) => commit({...data,portals:data.portals.map(p=>p.id===id?{...p,...patch}:p)});
  const move = (index:number,offset:number) => { const portals=[...data.portals]; [portals[index],portals[index+offset]]=[portals[index+offset],portals[index]]; void commit({...data,portals}); };
  const newApartment = () => setApartment({id:crypto.randomUUID(),title:'',url:'',sourceId:'',city:'',location:'',rooms:null,area:null,rent:null,heating:'Unknown',availability:'',notes:'',stage:'Saved',createdAt:new Date().toISOString()});
  return <main>
    <header><div className="brand">⌂ <span>HOUSE HUNT / HAMBURG</span></div><span className="local">Stored on this device</span></header>
    <section className="hero"><p className="eyebrow">YOUR NEXT CHAPTER</p><h1>A place to call home.</h1><p>Your portals, apartment shortlist, and next steps — together.</p><div className="criteria"><span>{data.criteria.city}</span><span>{data.criteria.rooms}+ rooms</span><span>{data.criteria.area}+ m²</span><span>≤ {money(data.criteria.rent)} incl. heating</span><span>{data.criteria.from} → {data.criteria.to}</span></div></section>
    <div className="stats"><div><strong>{data.portals.length}</strong><span>Housing portals</span></div><div><strong>{counts[0]}</strong><span>Matching apartments</span></div><div><strong>{counts[1]}</strong><span>Need a closer look</span></div><div><strong>{data.portals.filter(p=>p.status==='Login needed').length}</strong><span>Marked login needed</span></div></div>
    <nav aria-label="Dashboard"><div>{['Portals','Apartments','Settings'].map(t=><button key={t} aria-current={tab===t?'page':undefined} onClick={()=>{setTab(t);setError('');setNotice('');}}>{t}</button>)}</div><span>Automatic capture · Personal use</span></nav>
    <div className="capture-bar"><label><input type="checkbox" checked={data.autoCapture!==false} disabled={blocked} onChange={e=>void commit({...data,autoCapture:e.target.checked})}/> Automatically save properties on supported pages I visit</label><p>{activity ? `${activity.source}: ${activity.found} readable listings · ${activity.status} · ${dateLabel(activity.at)}` : 'Visit a portal and let its listings load. Open an exposé if a results page is not recognized.'}</p></div>
    {removed && <div className="notice" role="status">Removed {removed.apartment.title || 'apartment'}. It will not be automatically added again. <button disabled={blocked} onClick={()=>void undoRemove()}>Undo remove</button></div>}
    {error && <div className="alert" role="alert">{error}</div>}{notice && <div className="notice" role="status">{notice}</div>}
    {tab==='Portals' && <section><div className="section-title"><div><h2>Your housing portals</h2><p>Open your sources, sign in normally, and mark each check below.</p></div><div className="actions"><button disabled={blocked} onClick={()=>setPortal({id:crypto.randomUUID(),name:'',url:'',enabled:true,status:'Not checked',checkedAt:null})}>+ Add portal</button><button className="primary" disabled={blocked || !data.portals.some(p=>p.enabled)} onClick={()=>void openPortals(data.portals.filter(p=>p.enabled).map(p=>p.id))}>{opening?'Opening…':'Open all enabled ↗'}</button></div></div>
      <div className="toolbar"><button disabled={blocked || !selected.length} onClick={()=>void openPortals(selected)}>Open selected ({selected.length}) ↗</button><button disabled={blocked} onClick={()=>setSelected(selected.length?[]:data.portals.map(p=>p.id))}>{selected.length?'Clear selection':'Select all'}</button><span>Login indicators are manually recorded.</span></div>
      {failed.length>0 && <div className="alert">Could not open: {data.portals.filter(p=>failed.includes(p.id)).map(p=>p.name).join(', ')}. <button disabled={blocked} onClick={()=>void openPortals(failed)}>Retry failed</button></div>}
      <div className="portal-grid">{data.portals.map((p,i)=><article className={`portal ${!p.enabled?'disabled-card':''}`} key={p.id}><div className="card-top"><label className="select-label"><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/><span className="sr-only">Select {p.name}</span></label><span className="number">{String(i+1).padStart(2,'0')}</span><label className="enabled"><input type="checkbox" checked={p.enabled} disabled={blocked} onChange={e=>void updatePortal(p.id,{enabled:e.target.checked})}/>Enabled</label></div><h3>{p.name}</h3><p className="domain">{new URL(p.url).hostname}</p><label className="field"><span>Check status</span><select value={p.status} disabled={blocked} onChange={e=>void updatePortal(p.id,{status:e.target.value as PortalStatus,checkedAt:new Date().toISOString()})}>{['Not checked','Login needed','Ready'].map(s=><option key={s}>{s}</option>)}</select></label><p className="timestamp">{dateLabel(p.checkedAt ?? '')}</p><div className="card-actions"><button className="open" disabled={blocked} onClick={()=>void openPortals([p.id])}>Open portal ↗</button>{portalUrls(p).applicationsUrl && <button disabled={blocked} onClick={()=>void openApplications(p)}>Applications ↗</button>}<button disabled={blocked} onClick={()=>setPortal({...p})}>Edit</button><button aria-label={`Move ${p.name} up`} disabled={blocked || i===0} onClick={()=>move(i,-1)}>↑</button><button aria-label={`Move ${p.name} down`} disabled={blocked || i===data.portals.length-1} onClick={()=>move(i,1)}>↓</button></div></article>)}</div>
      {!data.portals.length && <div className="empty">Add a portal to start your housing checklist.</div>}
    </section>}
    {tab==='Apartments' && <section><div className="section-title"><div><h2>Your apartment shortlist</h2><p>Properties appear here as you browse supported listings. Missing details stay marked for review.</p></div><button className="primary" disabled={blocked} onClick={newApartment}>+ Add apartment</button></div><div className="toolbar"><label>Show <select value={filter} onChange={e=>setFilter(e.target.value)}>{['All','Matches','Needs review','Does not match'].map(s=><option key={s}>{s}</option>)}</select></label><label><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/> Include archived</label></div>
      {data.apartments.filter(a=>(showArchived || a.stage!=='Archived') && (filter==='All' || match(a,data.criteria).category===filter)).sort((a,b)=>match(a,data.criteria).rank-match(b,data.criteria).rank || b.createdAt.localeCompare(a.createdAt)).map(a=>{const m=match(a,data.criteria); return <article className={`apartment ${a.url?'is-linked':''} ${a.visitedAt?'is-visited':''}`} key={a.id}>{a.url && <a className="apartment-card-link" onClick={()=>markVisited(a)} onAuxClick={e=>{if(e.button===1)markVisited(a);}} href={a.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${a.title || 'apartment'} in a new tab`}><span className="sr-only">Open listing</span></a>}<div><span className={`badge rank-${m.rank}`}>{m.category}</span><h3>{a.title || 'Untitled apartment'}</h3><p>{[a.city,a.location].filter(Boolean).join(' · ') || 'Location unknown'} · {data.portals.find(p=>p.id===a.sourceId)?.name || 'Unspecified / removed source'}</p><div className="facts"><strong>{money(a.rent)}</strong><span>{a.rooms ?? '?'} rooms</span><span>{a.area ?? '?'} m²</span><span>Available: {a.availability || 'Unknown'}</span></div><p>Heating: {a.heating.toLowerCase()}</p>{a.visitedAt && <p className="visited-label">✓ Opened {dateLabel(a.visitedAt)}</p>}{a.autoArchivedFrom && <p>Automatically archived: does not match your criteria.</p>}{a.capture && <p>Automatically captured · Last seen {dateLabel(a.capture.lastSeen)}{a.capture.manual ? ' · Your edits are protected' : ''}</p>}{m.reasons.length>0 && <ul>{m.reasons.map(r=><li key={r}>{r}</li>)}</ul>}{a.notes && <p className="notes">{a.notes}</p>}</div><div className="apartment-actions"><label className="field"><span>Progress</span><select aria-label={`Progress for ${a.title || 'apartment'}`} disabled={blocked} value={a.stage} onChange={e=>void commit({...data,apartments:data.apartments.map(x=>x.id===a.id?{...x,stage:e.target.value as Stage}:x)})}>{stages.map(s=><option key={s}>{s}</option>)}</select></label>{a.url && <a className="button" onClick={()=>markVisited(a)} onAuxClick={e=>{if(e.button===1)markVisited(a);}} href={a.url} target="_blank" rel="noreferrer">View listing ↗</a>}<button disabled={blocked} onClick={()=>setApartment({...a})}>Edit details</button><button className="danger" disabled={blocked} onClick={()=>void removeApartment(a)}>Remove property</button></div></article>})}
      {!data.apartments.some(a=>(showArchived || a.stage!=='Archived') && (filter==='All' || match(a,data.criteria).category===filter)) && <div className="empty"><div className="empty-icon">⌂</div><h3>{data.apartments.length?'No apartments in this view':'Your shortlist starts here'}</h3><p>Browse a portal, then add an apartment’s details to see how it fits.</p><button disabled={blocked} onClick={newApartment}>Add an apartment</button></div>}
    </section>}
    {tab==='Settings' && <section className="settings"><form onSubmit={async e=>{e.preventDefault(); if(criteria.from>criteria.to){setError('The end date must be on or after the start date.');return;} if(await commit({...data,criteria}))setNotice('Search criteria saved. Apartment matches updated.');}}><h2>Your search criteria</h2><p>These filter your saved apartments. Portal search URLs remain as supplied.</p><div className="form-grid"><Field label="City"><input required value={criteria.city} onChange={e=>setCriteria({...criteria,city:e.target.value})}/></Field>{(['rooms','area','rent'] as const).map((k,i)=><Field key={k} label={['Minimum rooms','Minimum area (m²)','Maximum rent incl. heating (€)'][i]}><input required type="number" min="0" step="0.01" value={criteria[k]} onChange={e=>setCriteria({...criteria,[k]:Number(e.target.value)})}/></Field>)}<Field label="Earliest start"><input required type="date" value={criteria.from} onChange={e=>setCriteria({...criteria,from:e.target.value})}/></Field><Field label="Latest start"><input required type="date" value={criteria.to} onChange={e=>setCriteria({...criteria,to:e.target.value})}/></Field></div><button className="primary" disabled={blocked}>Save criteria</button></form><aside><h2>Your data</h2><p>Saved locally in this Chrome profile. Export a backup before moving devices or removing the extension.</p><button disabled={blocked} onClick={download}>Export JSON backup</button><Field label="Restore a backup (replaces current data)"><input disabled={blocked} type="file" accept=".json,application/json" onChange={e=>{void restore(e.target.files?.[0]);e.target.value='';}}/></Field><p>No account credentials or website sessions are stored here.</p></aside></section>}
    {portal && <Modal label="portal-heading" onClose={()=>{if(!blocked){setPortal(null);setError('');}}}><form onSubmit={savePortal}><h2 id="portal-heading">{data.portals.some(p=>p.id===portal.id)?'Edit portal':'Add portal'}</h2><Field label="Name"><input autoFocus required value={portal.name} onChange={e=>setPortal({...portal,name:e.target.value})}/></Field><Field label="Portal type"><select value={portal.type || 'website'} onChange={e=>setPortal({...portal,type:e.target.value as Portal['type']})}><option value="website">Website</option><option value="immomio">Immomio</option></select></Field>{portal.type==='immomio'?<><Field label="Landlord ID"><input required value={portal.landlordId || ''} onChange={e=>setPortal({...portal,landlordId:e.target.value.trim()})}/></Field><p>Offer and application URLs are generated from the landlord ID.</p></>:<><Field label="Portal URL"><input required type="url" value={portal.url} onChange={e=>setPortal({...portal,url:e.target.value})}/></Field><Field label="Applications URL (optional)"><input type="url" value={portal.applicationsUrl || ''} onChange={e=>setPortal({...portal,applicationsUrl:e.target.value})}/></Field></>}{error && <p role="alert" className="alert">{error}</p>}<div className="actions"><button className="primary" disabled={blocked}>Save portal</button><button type="button" disabled={blocked} onClick={()=>{setPortal(null);setError('');}}>Cancel</button>{data.portals.some(p=>p.id===portal.id) && <button type="button" className="danger" disabled={blocked} onClick={async()=>{if(confirm(`Delete ${portal.name}? Saved apartments will remain.`) && await commit({...data,portals:data.portals.filter(p=>p.id!==portal.id)})){setSelected(selected.filter(id=>id!==portal.id));setPortal(null);}}}>Delete</button>}</div></form></Modal>}
    {apartment && <Modal wide label="apartment-heading" onClose={()=>{if(!blocked){setApartment(null);setError('');}}}><form onSubmit={saveApartment}><h2 id="apartment-heading">Apartment details</h2><p>Leave anything you haven’t confirmed blank.</p><div className="form-grid"><Field label="Title"><input autoFocus value={apartment.title} onChange={e=>setApartment({...apartment,title:e.target.value})}/></Field><Field label="Source portal"><select value={apartment.sourceId} onChange={e=>setApartment({...apartment,sourceId:e.target.value})}><option value="">Unspecified</option>{apartment.sourceId && !data.portals.some(p=>p.id===apartment.sourceId) && <option value={apartment.sourceId}>Removed source</option>}{data.portals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Listing URL"><input type="url" value={apartment.url} onChange={e=>setApartment({...apartment,url:e.target.value})}/></Field><Field label="City"><input value={apartment.city} placeholder="e.g. Hamburg" onChange={e=>setApartment({...apartment,city:e.target.value})}/></Field><Field label="District / address"><input value={apartment.location} onChange={e=>setApartment({...apartment,location:e.target.value})}/></Field>{(['rooms','area','rent'] as const).map((k,i)=><Field key={k} label={['Rooms','Area (m²)','Monthly rent (€)'][i]}><input type="number" min="0" step="0.01" value={apartment[k] ?? ''} onChange={e=>setApartment({...apartment,[k]:e.target.value===''?null:Number(e.target.value)})}/></Field>)}<Field label="Heating in this rent"><select value={apartment.heating} onChange={e=>setApartment({...apartment,heating:e.target.value as Apartment['heating']})}>{['Unknown','Included','Excluded'].map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Available / agreed start date"><input value={apartment.availability} placeholder="YYYY-MM-DD, month, or by arrangement" onChange={e=>setApartment({...apartment,availability:e.target.value})}/></Field><Field label="Progress"><select value={apartment.stage} onChange={e=>setApartment({...apartment,stage:e.target.value as Stage})}>{stages.map(s=><option key={s}>{s}</option>)}</select></Field></div><Field label="Notes"><textarea rows={3} value={apartment.notes} onChange={e=>setApartment({...apartment,notes:e.target.value})}/></Field>{error && <p className="alert" role="alert">{error}</p>}<div className="actions"><button className="primary" disabled={blocked}>Save apartment</button><button type="button" disabled={blocked} onClick={()=>{setApartment(null);setError('');}}>Cancel</button></div></form></Modal>}
    <footer>Hamburg House Hunt <span>One step closer to your next home.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
