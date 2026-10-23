import { initialData, validateData, reconcileData, type Data, portalSeeds, immomioLandlords } from './model';
import { identity, immomioKey, listingLink, mergeCandidates, type Candidate } from './capture';
const key='houseHunt';
const hosts=new Set(portalSeeds.map(([,url])=>new URL(url).hostname));
const allowed=(url:string)=>{try{const u=new URL(url);return u.protocol==='https:' && (hosts.has(u.hostname) || /(^|\.)(immomio\.com|immomio\.de|immosolve\.eu|wohnungshelden\.de)$/.test(u.hostname));}catch{return false;}};
function fingerprint(value:unknown):string{return JSON.stringify(value,(_k,v)=>v && typeof v==='object' && !Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);}
let queue:Promise<unknown>=Promise.resolve();
async function load():Promise<Data>{const stored=(await chrome.storage.local.get(key))[key];const data=reconcileData(stored?validateData(stored):initialData());if(fingerprint(stored)!==fingerprint(data))await chrome.storage.local.set({[key]:data});return data;}
chrome.action.onClicked.addListener(()=>{void chrome.tabs.create({url:chrome.runtime.getURL('index.html')});});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(sender.id!==chrome.runtime.id)return;
  const dashboard=sender.url?.startsWith(chrome.runtime.getURL('index.html'));
  if(!dashboard && !(message?.type==='capture' && sender.tab?.id!==undefined && sender.url && allowed(sender.url)))return;
  const task=queue.then(async()=>{
    const data=await load();
    if(message.type==='load')return {data};
    if(message.type==='save' && dashboard){
      if(fingerprint(data)!==fingerprint(message.previous))throw new Error('New properties arrived or another dashboard changed your data. Please try saving again.');
      const next=reconcileData(validateData(message.data));await chrome.storage.local.set({[key]:next});return {data:next};
    }
    if(message.type!=='capture')throw new Error('Unknown request');
    if(data.autoCapture===false)return {disabled:true};
    if(!Array.isArray(message.candidates) || message.candidates.length>100)throw new Error('Invalid capture batch');
    const candidates=message.candidates as Candidate[];
    for(const c of candidates){
      if(!c || typeof c.url!=='string' || !allowed(c.url) || !['title','city','location','availability'].every(k=>typeof (c as unknown as Record<string,unknown>)[k]==='string' && String((c as unknown as Record<string,unknown>)[k]).length<=1000) || ![c.rooms,c.area,c.rent].every(v=>typeof v==='number' && Number.isFinite(v) && v>0) || !['Unknown','Included','Excluded'].includes(c.heating))throw new Error('Invalid listing data');
      if(c.externalId!==undefined && (typeof c.externalId!=='string' || !c.externalId.trim() || c.externalId.length>150 || !sender.url || !/(^|\.)immomio\.com$/.test(new URL(sender.url).hostname)))throw new Error('Invalid Immomio object ID');
      c.key=c.externalId?immomioKey(c.externalId,c.location):identity(c.url);
    }
    const topUrl=sender.tab?.url || sender.url || '';
    const top=new URL(topUrl);
    const landlordId=top.hostname==='tenant.immomio.com'?top.pathname.match(/\/landlords\/([^/]+)/)?.[1]:undefined;
    const legacy=immomioLandlords.find(entry=>entry.length===3 && portalSeeds.some(([name,url])=>name===entry[2] && new URL(url).hostname===top.hostname));
    const source=data.portals.find(p=>landlordId?p.type==='immomio' && p.landlordId===landlordId:legacy?p.landlordId===legacy[1]:new URL(p.url).hostname===top.hostname && p.type!=='immomio');
    // Linkless iframe cards return to the cooperative's usable offer page.
    for(const c of candidates)if(c.externalId && !listingLink(c.url) && source)c.url=source.url;
    const merged=mergeCandidates(data,candidates,source?.id || '',new Date().toISOString());
    if(sender.url && listingLink(sender.url)){
      const visited=new Set(candidates.map(c=>c.key));
      merged.data.apartments=merged.data.apartments.map(a=>visited.has(a.capture?.key || '') || (a.url && identity(a.url)===identity(sender.url!))?{...a,visitedAt:new Date().toISOString()}:a);
    }
    if(candidates.length)await chrome.storage.local.set({[key]:reconcileData(validateData(merged.data))});
    const activity={at:new Date().toISOString(),source:source?.name || new URL(topUrl).hostname,found:candidates.length,added:merged.added,updated:merged.updated,status:typeof message.status==='string'?message.status.slice(0,200):''};
    await chrome.storage.local.set({captureActivity:activity});
    if(sender.tab?.id!==undefined){await chrome.action.setBadgeText({tabId:sender.tab.id,text:candidates.length?String(candidates.length):''});await chrome.action.setBadgeBackgroundColor({tabId:sender.tab.id,color:'#285b49'});}
    return activity;
  });
  queue=task.catch(()=>undefined);
  void task.then(result=>respond({ok:true,...result}),error=>respond({ok:false,error:error.message}));
  return true;
});
