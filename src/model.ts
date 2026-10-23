export type PortalStatus = 'Not checked' | 'Login needed' | 'Ready';
export type Stage = 'Saved' | 'Contacted' | 'Viewing' | 'Archived';
export interface Criteria { city: string; rooms: number; area: number; rent: number; from: string; to: string }
export interface Portal { id: string; name: string; url: string; type?: 'website' | 'immomio'; landlordId?: string; applicationsUrl?: string; enabled: boolean; status: PortalStatus; checkedAt: string | null }
export interface Apartment { id: string; title: string; url: string; sourceId: string; city: string; location: string; rooms: number | null; area: number | null; rent: number | null; heating: 'Unknown' | 'Included' | 'Excluded'; availability: string; notes: string; stage: Stage; createdAt: string; visitedAt?: string; autoArchivedFrom?: Exclude<Stage,'Archived'>; capture?: {key: string; lastSeen: string; manual: boolean} }
export interface Data { version: 1; criteria: Criteria; portals: Portal[]; apartments: Apartment[]; autoCapture?: boolean; dismissedKeys?: string[]; settingsRevision?: 1; portalRevision?: 1 }
export const defaults: Criteria = { city: 'Hamburg', rooms: 2.5, area: 70, rent: 1400, from: '2027-01-01', to: '2027-05-31' };
export const portalSeeds = [
  ['ImmoScout24', 'https://www.immobilienscout24.de/Suche/de/hamburg/hamburg/wohnung-mieten?haspromotion=false&numberofrooms=2.5-&price=-1400.0&livingspace=70.0-&pricetype=calculatedtotalrent&sorting=2&enteredFrom=filter_removals'],
  ['Immomio', 'https://tenant.immomio.com/de/landlords'],
  ['EBV Harburg', 'https://www.ebv-harburg.de/wohnungen/wohnungsangebote/'],
  ['Gartenstadt Wandsbek', 'https://www.gartenstadt-wandsbek.de/wohnen/freie-wohnungen/'],
  ['Immosolve 2211665', 'https://2211665.hpm.immosolve.eu/#!/result-list-2'],
  ['HARABAU', 'https://www.harabau.de/wohnen/wohnungsangebote/'],
  ['BVE', 'https://www.bve.de/wohnen-beim-bve/wohnungsbestand/wohnungsangebote/'],
  ['dhu', 'https://dhu.hamburg/wohnen/wohnungsangebote/'],
  ['Immosolve 2222820', 'https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2'],
  ['BDS Hamburg', 'https://www.bds-hamburg.de/unser-angebot/interessentenportal-immomio/#c6038'],
  ['Buchdrucker', 'https://www.buchdrucker.de/de/wohnungsangebote'],
  ['BGFG', 'https://www.bgfg.de/wohnen/wohnungsangebote'],
  ['Baugenossenschaft Fuhlsbüttel', 'https://www.bg-fuhlsbuettel.de/index.php?id=22'],
  ['Hamburger Wohnen', 'https://www.hamburgerwohnen.de/wohnen/wohnungssuche-home.html'],
  ['Reiherstieg', 'https://www.reiherstieg.de/wohnungsangebote/'],
  ['Hanseatische', 'https://www.hanseatische.de/de/wohnungsangebote'],
  ['MGF Farmsen', 'https://www.mgf-farmsen.de/immobiliensuche/aktuelle-angebote-wohnungen/stellplaetze/'],
  ['Walddörfer', 'https://www.walddoerfer.de/wohnungsangebote/aktuelle-angebote/'],
  ['vhw Hamburg', 'https://www.vhw-hamburg.de/wohnen/aktuelle-angebote.html'],
  ['KAIFU', 'https://www.kaifu.de/wohnen/mietangebote/'],
  ['Wohnungsverein Hamburg von 1902', 'https://wv1902.de/wohnungsangebote/'],
];
export const immomioLandlords = [
  ['Bauverein Reiherstieg eG', '9e3c3277-b667-43b4-96be-bd026126eb4e', 'Reiherstieg'],
  ['Wohnbau GmbH', '6476ded2-426b-5f58-a43e-22b299ceddd9'],
  ['Walddörfer Wohnungsbaugenossenschaft eG', 'e3959407-8f56-4c7d-a056-1fb9a184ce4c', 'Walddörfer'],
  ['SAGA Siedlungs- Aktiengesellschaft Hamburg', 'e2577864-aac3-2ce6-170b-73978804dfe5'],
  ['Baugenossenschaft Fuhlsbüttel eG', '8b5524a0-2766-4ee6-9ab6-363ff645a982', 'Baugenossenschaft Fuhlsbüttel'],
  ['Hamburg-Rahlstedter Baugenossenschaft eG', '9ef8772e-e464-4aa2-9d84-b290635cdb38', 'HARABAU'],
  ['Hamburg Team Property Management GmbH', 'f7d54ddd-54ca-66bf-9e54-451564fe3af6'],
  ['Vereinigte Hamburger Wohnungsbaugenossenschaft eG', 'c05d8e95-6891-401a-93da-bfd8d7cf28c4', 'vhw Hamburg'],
  ['DVG Immobilien GmbH & Co. KG', '1c02a269-56a7-e338-3693-a1dc6ab96f11'],
  ['Hamburger Lehrer-Baugenossenschaft eG', '677bd977-7994-25a8-516a-2b1b77e2c228'],
  ['Schmidt & Bethge Immobilien Vertriebs GmbH', '9285f235-c813-6742-7563-021cd46e02c8'],
  ['Hildegart Hausmann Immobilien', 'd3f9fdef-e0a1-e813-421f-8defd2ed762e'],
  ['GCV Verwaltungs GmbH', '220afd1c-2227-d7b3-9c0c-54a8d6a715dd'],
  ['PIPPING Immobilien GmbH & Co. KG', '2f89b925-b214-4ccb-68c0-681b5431cdb7'],
  ['GCV Verwaltungs GmbH', '32bc12e2-67c7-2595-a414-dd099cd4d71a'],
] as const;
export const validLandlordId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export function portalUrls(p: Pick<Portal,'url'|'type'|'landlordId'|'applicationsUrl'>) {
  if(p.type==='immomio' && p.landlordId && validLandlordId(p.landlordId)) {
    const base=`https://tenant.immomio.com/en/landlords/${p.landlordId}`;
    return {url:`${base}/search`,applicationsUrl:`${base}/applications`};
  }
  return {url:p.url,applicationsUrl:p.applicationsUrl};
}
function migratePortals(portals:Portal[]):Portal[] {
  const next=portals.map(p=>p.url==='https://www.buchdrucker.de/de/wohnungsangebote'?{...p,url:'https://www.buchdrucker.de/de/wohnungsangebote-stellplatzangebote-gewerbeangebote'}:p);
  for(const entry of immomioLandlords) {
    const [name,landlordId]=entry;
    const oldName=entry.length===3?entry[2]:undefined;
    const oldUrl=portalSeeds.find(([n])=>n===oldName)?.[1];
    const url=portalUrls({url:'',type:'immomio',landlordId}).url;
    const index=next.findIndex(p=>p.landlordId===landlordId || p.url===url || p.url===url.replace('/search','/applications') || (oldUrl && p.url===oldUrl));
    if(index>=0)next[index]={...next[index],name,type:'immomio',landlordId,url};
    else if(!oldName) {
      let id=`immomio-${landlordId}`;
      while(next.some(p=>p.id===id))id+='-new';
      next.push({id,name,type:'immomio',landlordId,url,enabled:true,status:'Not checked',checkedAt:null});
    }
  }
  return next;
}
export function initialData(): Data { return { version: 1, settingsRevision:1, portalRevision:1, criteria: {...defaults}, portals:migratePortals(portalSeeds.map(([name,url],i) => ({id:`portal-${i}`,name,url,enabled:true,status:'Not checked',checkedAt:null}))), apartments: [] }; }
export function validDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
export function validUrl(value: string): boolean { try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; } }
export function urlKey(value: string): string { try { return new URL(value).href; } catch { return value.trim(); } }
export function match(a: Apartment, c: Criteria) {
  const failures: string[] = [], unknown: string[] = [];
  if (!a.city.trim()) unknown.push('City missing');
  else if (a.city.trim().toLowerCase() !== c.city.trim().toLowerCase()) failures.push(`Outside ${c.city}`);
  for (const [key,label] of [['rooms','Rooms'],['area','Area']] as const) {
    if (a[key] === null) unknown.push(`${label} missing`);
    else if (a[key]! < c[key]) failures.push(`${label} below ${c[key]}`);
  }
  if (a.rent === null) unknown.push('Rent missing');
  else if (a.rent > c.rent) failures.push(`Rent above €${c.rent}`);
  if (a.heating !== 'Included') unknown.push('Confirm total rent including heating');
  if (!validDate(a.availability)) unknown.push('Exact available / agreed start date needed');
  else if (a.availability < c.from || a.availability > c.to) failures.push('Availability outside your date window');
  return { category: failures.length ? 'Does not match' : unknown.length ? 'Needs review' : 'Matches', rank: failures.length ? 2 : unknown.length ? 1 : 0, reasons: [...failures, ...unknown] };
}

// Validate untrusted backups and stored data before making them application state.
export function reconcileData(data:Data):Data {
  const criteria=!data.settingsRevision && data.criteria.from==='2027-02-01'?{...data.criteria,from:'2027-01-01'}:data.criteria;
  return {...data,criteria,settingsRevision:1,portalRevision:1,portals:(data.portalRevision?data.portals:migratePortals(data.portals)).map(p=>({...p,url:portalUrls(p).url})),apartments:data.apartments.map(a=>{
    if(match(a,criteria).category==='Does not match')return a.stage==='Archived'?a:{...a,stage:'Archived',autoArchivedFrom:a.stage};
    if(a.autoArchivedFrom){const {autoArchivedFrom,...rest}=a;return {...rest,stage:a.stage==='Archived'?autoArchivedFrom:a.stage};}
    return a;
  })};
}
export function validateData(value: unknown): Data {
  const fail = (): never => { throw new Error('Invalid backup: expected a version 1 House Hunt export with valid records.'); };
  const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const str = (v: unknown): v is string => typeof v === 'string';
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  if (!obj(value) || value.version !== 1 || !obj(value.criteria) || !Array.isArray(value.portals) || !Array.isArray(value.apartments)) return fail();
  const c = value.criteria;
  if(value.portalRevision!==undefined && value.portalRevision!==1)return fail();
  if(value.settingsRevision!==undefined && value.settingsRevision!==1)return fail();
  if (value.autoCapture !== undefined && typeof value.autoCapture !== 'boolean') return fail();
  if (value.dismissedKeys !== undefined && (!Array.isArray(value.dismissedKeys) || !value.dismissedKeys.every(k=>str(k) && k.length>0 && k.length<=2000))) return fail();
  if (!str(c.city) || !c.city.trim() || !num(c.rooms) || !num(c.area) || !num(c.rent) || !str(c.from) || !str(c.to) || !validDate(c.from) || !validDate(c.to) || c.from > c.to) return fail();
  const ids = new Set<string>();
  for (const p of value.portals) {
    if (!obj(p) || !str(p.id) || !p.id || ids.has(p.id) || !str(p.name) || !p.name.trim() || !str(p.url) || !validUrl(p.url) || typeof p.enabled !== 'boolean' || !['Not checked','Login needed','Ready'].includes(String(p.status)) || !(p.checkedAt === null || str(p.checkedAt) && Number.isFinite(Date.parse(p.checkedAt)))) return fail();
    if(p.type!==undefined && !['website','immomio'].includes(String(p.type)))return fail();
    if(p.landlordId!==undefined && (!str(p.landlordId) || !validLandlordId(p.landlordId)))return fail();
    if(p.type==='immomio' && (!str(p.landlordId) || !validLandlordId(p.landlordId)))return fail();
    if(p.applicationsUrl!==undefined && (!str(p.applicationsUrl) || (p.applicationsUrl!=='' && !validUrl(p.applicationsUrl))))return fail();
    ids.add(p.id);
  }
  ids.clear();
  for (const a of value.apartments) {
    if (!obj(a) || !str(a.id) || !a.id || ids.has(a.id) || !['title','url','sourceId','city','location','availability','notes','createdAt'].every(k => str(a[k])) || (a.url !== '' && !validUrl(a.url as string)) || !['rooms','area','rent'].every(k => a[k] === null || num(a[k])) || !['Unknown','Included','Excluded'].includes(String(a.heating)) || !['Saved','Contacted','Viewing','Archived'].includes(String(a.stage)) || !Number.isFinite(Date.parse(a.createdAt as string))) return fail();
    ids.add(a.id);
    if(a.visitedAt!==undefined && (!str(a.visitedAt) || !Number.isFinite(Date.parse(a.visitedAt))))return fail();
    if(a.autoArchivedFrom!==undefined && !['Saved','Contacted','Viewing'].includes(String(a.autoArchivedFrom)))return fail();
    if (a.capture !== undefined && (!obj(a.capture) || !str(a.capture.key) || !str(a.capture.lastSeen) || !Number.isFinite(Date.parse(a.capture.lastSeen)) || typeof a.capture.manual !== 'boolean')) return fail();
  }
  return value as unknown as Data;
}
