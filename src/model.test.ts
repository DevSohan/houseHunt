import { describe, expect, it } from 'vitest';
import { defaults, portalUrls, portalSeeds, initialData, match, reconcileData, validateData, validDate, validUrl, type Apartment } from './model';
const apartment: Apartment = {id:'a',title:'Test',url:'https://example.com/1',sourceId:'',city:'Hamburg',location:'',rooms:2.5,area:70,rent:1400,heating:'Included',availability:'2027-02-01',notes:'',stage:'Saved',createdAt:'2026-09-13T12:00:00.000Z'};
describe('matching',()=>{
  it('includes every exact minimum and maximum boundary',()=>{expect(match(apartment,defaults).category).toBe('Matches');expect(match({...apartment,availability:'2027-05-31'},defaults).category).toBe('Matches');});
  it.each([{rooms:2},{area:69.99},{rent:1400.01},{city:'Berlin'},{availability:'2026-12-31'},{availability:'2027-06-01'}])('rejects known failures %j',patch=>expect(match({...apartment,...patch},defaults).category).toBe('Does not match'));
  it.each([{rooms:null},{area:null},{rent:null},{city:''},{heating:'Unknown' as const},{heating:'Excluded' as const},{availability:''},{availability:'2027-05'},{availability:'by arrangement'},{availability:'2027-02-30'}])('flags missing and ambiguous information %j',patch=>expect(match({...apartment,...patch},defaults).category).toBe('Needs review'));
  it('gives failures precedence over unknown information',()=>expect(match({...apartment,rent:1500,rooms:null},defaults).category).toBe('Does not match'));
  it('recalculates using changed criteria',()=>expect(match(apartment,{...defaults,rent:1300}).category).toBe('Does not match'));
  it('accepts city case and surrounding whitespace',()=>expect(match({...apartment,city:' hamburg '},defaults).category).toBe('Matches'));
});
describe('portals and backups',()=>{
  it('seeds exactly 34 unique URLs and preserves application routes',()=>{const d=initialData();expect(d.portals).toHaveLength(34);expect(new Set(d.portals.map(p=>p.url)).size).toBe(34);expect(d.portals[2]).toMatchObject({name:'SAGA',url:'https://www.saga.hamburg/immobiliensuche?Kategorie=APARTMENT'});expect(d.portals.find(p=>p.name==='GGI Hamburg')?.url).toBe('https://www.ggi-hamburg.de/vermietung/wohnungen');expect(d.portals.find(p=>p.name==='Immosolve 2222820')?.url).toBe('https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2');});
  it('adds GGI once to existing dashboards without duplicating or overwriting entries',()=>{
    const current=initialData();
    const old={...current,portalRevision:1 as const,portals:current.portals.filter(p=>p.name!=='GGI Hamburg')};
    const migrated=reconcileData(old);
    expect(migrated.portals).toHaveLength(34);
    expect(migrated.portals.slice(0,-1)).toEqual(old.portals);
    expect(reconcileData(migrated)).toEqual(migrated);
    expect(reconcileData({...migrated,portals:old.portals}).portals).toEqual(old.portals);
    const existing={...migrated.portals.at(-1)!,url:'https://www.ggi-hamburg.de/vermietung/wohnungen/',enabled:false};
    expect(reconcileData({...old,portals:[...old.portals,existing]}).portals.at(-1)).toEqual(existing);
  });
  it('adds SAGA in third position once without changing existing portals',()=>{
    const current=initialData();
    const old={...current,portalRevision:2 as const,portals:current.portals.filter(p=>p.name!=='SAGA')};
    const migrated=reconcileData(old);
    expect(migrated.portals[2]).toMatchObject({name:'SAGA',url:'https://www.saga.hamburg/immobiliensuche?Kategorie=APARTMENT'});
    expect(migrated.portals.filter(p=>p.name!=='SAGA')).toEqual(old.portals);
    expect(reconcileData(migrated)).toEqual(migrated);
    expect(reconcileData({...migrated,portals:old.portals}).portals).toEqual(old.portals);
    const existing={...migrated.portals[2],id:'custom-saga',enabled:false,status:'Ready' as const};
    expect(reconcileData({...old,portals:[...old.portals,existing]}).portals[2]).toEqual(existing);
  });
  it('round trips records including unknown fields and deleted sources',()=>{const d={...initialData(),apartments:[{...apartment,rooms:null,sourceId:'removed'}]};expect(validateData(JSON.parse(JSON.stringify(d)))).toEqual(d);});
  it('allows empty portal list without reseeding',()=>expect(validateData({...initialData(),portals:[]}).portals).toEqual([]));
  it.each([null,{}, {version:2}, {...initialData(),criteria:{...defaults,from:'2027-06-01'}}, {...initialData(),portals:[{...initialData().portals[0],url:'javascript:alert(1)'}]}, {...initialData(),apartments:[{...apartment,rent:-1}]}, {...initialData(),apartments:[apartment,apartment]}])('rejects malformed data',value=>expect(()=>validateData(value)).toThrow());
  it('rejects invalid dates and executable URLs',()=>{expect(validDate('2027-02-29')).toBe(false);expect(validDate('2028-02-29')).toBe(true);expect(validUrl('javascript:alert(1)')).toBe(false);expect(validUrl('https://example.com/#!/route')).toBe(true);});
});
describe('automatic archive and January migration',()=>{
 it('archives definite failures without changing notes or visited state',()=>{
  const record={...apartment,rent:1500,stage:'Viewing' as const,notes:'Called landlord',visitedAt:'2026-09-14T10:00:00Z'};
  expect(reconcileData({...initialData(),apartments:[record]}).apartments[0]).toMatchObject({stage:'Archived',autoArchivedFrom:'Viewing',notes:'Called landlord',visitedAt:record.visitedAt});
 });
 it('keeps unknown properties in the shortlist',()=>expect(reconcileData({...initialData(),apartments:[{...apartment,rent:null}]}).apartments[0].stage).toBe('Saved'));
 it('restores the previous progress when criteria make an automatic archive eligible',()=>{
  const archived=reconcileData({...initialData(),apartments:[{...apartment,rent:1500,stage:'Contacted'}]});
  const restored=reconcileData({...archived,criteria:{...defaults,rent:1600}});
  expect(restored.apartments[0].stage).toBe('Contacted');expect(restored.apartments[0].autoArchivedFrom).toBeUndefined();
 });
 it('preserves a manually archived entry',()=>expect(reconcileData({...initialData(),apartments:[{...apartment,stage:'Archived'}]}).apartments[0].stage).toBe('Archived'));
 it('migrates the old February start once and preserves later user changes',()=>{
  const old={...initialData(),settingsRevision:undefined,criteria:{...defaults,from:'2027-02-01'}};
  const migrated=reconcileData(old);expect(migrated.criteria.from).toBe('2027-01-01');expect(migrated.criteria.to).toBe('2027-05-31');
  expect(reconcileData({...migrated,criteria:{...migrated.criteria,from:'2027-02-01'}}).criteria.from).toBe('2027-02-01');
 });
 it('accepts January 1 and rejects December 31 with the new defaults',()=>{
  expect(match({...apartment,availability:'2027-01-01'},defaults).category).toBe('Matches');
  expect(match({...apartment,availability:'2026-12-31'},defaults).category).toBe('Does not match');
 });
});

describe('Immomio portals',()=>{
 it('generates both routes and retains both GCV landlords',()=>{
  const portals=initialData().portals.filter(p=>p.type==='immomio');
  expect(portals).toHaveLength(17);
  expect(portals.filter(p=>p.name==='GCV Verwaltungs GmbH')).toHaveLength(2);
  for(const p of portals)expect(portalUrls(p)).toEqual({url:`https://tenant.immomio.com/en/landlords/${p.landlordId}/search`,applicationsUrl:`https://tenant.immomio.com/en/landlords/${p.landlordId}/applications`});
 });
 it('adds the two Immomio landlords once and preserves existing portal state',()=>{
  const current=initialData();
  const hamburger=current.portals.find(p=>p.landlordId==='448713d3-286f-4327-a0d7-75ceec87559f')!;
  const oldHamburger={id:hamburger.id,name:'Hamburger Wohnen',url:'https://www.hamburgerwohnen.de/wohnen/wohnungssuche-home.html',enabled:false,status:'Ready' as const,checkedAt:'2026-10-22T10:00:00Z'};
  const old={...current,portalRevision:3 as const,portals:current.portals.filter(p=>p.landlordId!=='c1cb87ad-b441-4fa0-9e37-fbe208da6086').map(p=>p.id===hamburger.id?oldHamburger:p),apartments:[{...apartment,sourceId:hamburger.id}]};
  const migrated=reconcileData(old);
  expect(migrated.portals.find(p=>p.id===hamburger.id)).toMatchObject({...oldHamburger,name:'Baugenossenschaft Hamburger Wohnen eG',url:'https://tenant.immomio.com/en/landlords/448713d3-286f-4327-a0d7-75ceec87559f/search',type:'immomio',landlordId:'448713d3-286f-4327-a0d7-75ceec87559f'});
  expect(migrated.apartments[0].sourceId).toBe(hamburger.id);
  expect(migrated.portals.find(p=>p.landlordId==='c1cb87ad-b441-4fa0-9e37-fbe208da6086')?.url).toBe('https://tenant.immomio.com/en/landlords/c1cb87ad-b441-4fa0-9e37-fbe208da6086/search');
  expect(reconcileData(migrated)).toEqual(migrated);
  expect(reconcileData({...migrated,portals:[]}).portals).toEqual([]);
  expect(reconcileData({...current,portalRevision:3}).portals).toEqual(current.portals);
 });
 it('migrates stored defaults once, preserving IDs, ordering and status',()=>{
  const old={...initialData(),portalRevision:undefined,portals:portalSeeds.filter(([name])=>name!=='SAGA').map(([name,url],i)=>({id:`portal-${i}`,name,url,enabled:false,status:'Ready' as const,checkedAt:'2026-10-22T10:00:00Z'}))};
  const updated=reconcileData(old);
  expect(updated.portals).toHaveLength(34);
  expect(updated.portals[15]).toMatchObject({id:'portal-14',type:'immomio',enabled:false,status:'Ready',checkedAt:'2026-10-22T10:00:00Z'});
  expect(updated.portals[11].url).toBe('https://www.buchdrucker.de/de/wohnungsangebote-stellplatzangebote-gewerbeangebote');
  expect(reconcileData(updated)).toEqual(updated);
  expect(reconcileData({...updated,portals:[]} ).portals).toEqual([]);
 });
 it('rejects invalid landlord IDs and unsafe application URLs',()=>{
  for(const patch of [{type:'immomio',landlordId:'../bad'},{type:'immomio'},{applicationsUrl:'javascript:alert(1)'},{type:'unknown'}])expect(()=>validateData({...initialData(),portals:[{...initialData().portals[0],...patch}]})).toThrow();
 });
});
