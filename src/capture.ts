import { type Apartment, type Data, validDate, validUrl } from './model';
export type Candidate = Pick<Apartment,'title'|'url'|'city'|'location'|'rooms'|'area'|'rent'|'heating'|'availability'> & {key:string; externalId?:string};
export function immomioKey(externalId:string,address:string):string {
  // Cards include a district that the exposé address omits. Street + postcode/city
  // scopes the landlord's external ID without treating these as different homes.
  const place=address.match(/^(.+?,\s*\d{5}\s*[^,]+)/)?.[1] || address;
  return `immomio:external:${externalId.trim().toLowerCase()}:${place.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ')}`;
}
const numberPattern = '(\\d{1,3}(?:[.\\s]\\d{3})*(?:,\\d+)?|\\d+(?:[.,]\\d+)?)';
export function propertyTitle(value:string):boolean {return !!value.trim() && !/^(?:kosten|costs?|preis(?:e)?|finanzierung|lage|adresse|details|beschreibung|ausstattung|energie(?:effizienz)?|kontakt|anbieter|übersicht|bilder|fotos|grundriss(?:e)?|expos[eé]|immobilienscout24|immoscout24)\s*[:↗]?$/i.test(value.trim());}
export function germanNumber(text:string):number { return Number(text.replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.')); }
export function identity(url:string):string {
  const u=new URL(url);
  const id=u.href.match(/(?:expose|expos[eé]|properties|property|immobilie|object|detail|apply)\/([a-z0-9-]{3,})(?:[/?#]|$)/i)?.[1] || ['objectId','propertyId','exposeId'].map(k=>u.searchParams.get(k)).find(Boolean);
  const provider=/immomio\./.test(u.hostname)?'immomio':u.hostname;
  if(id)return `${provider}:${id}`;
  for(const key of [...u.searchParams.keys()])if(/^(utm_|ref$|source$|tracking|token$)/i.test(key))u.searchParams.delete(key);
  return u.href;
}
export function parseListing(text:string,url:string,title=''):Candidate|null {
  if(!validUrl(url))return null;
  const cleaned=text.replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ');
  const get=(pattern:string)=>{const m=cleaned.match(new RegExp(pattern,'i'));return m?germanNumber(m[1]):null;};
  const rooms=get(numberPattern+'\\s*(?:Zimmer|Zi\\.?)(?:\\b|\\s|$)') ?? get('(?:Anzahl Zimmer|Zimmer)\\s*[:\\n]?\\s*'+numberPattern);
  const area=get(numberPattern+'\\s*(?:m²|m2|qm)') ?? get('Wohnfläche\\s*[:\\n]?\\s*'+numberPattern);
  // Require apartment facts; navigation, profiles and empty templates cannot create records.
  if(rooms===null || area===null || rooms<=0 || rooms>30 || area<10 || area>2000)return null;
  const heading=title || cleaned.split('\n').find(x=>x.trim()) || 'Apartment';
  if(!propertyTitle(heading))return null;
  if(/^(?:Tiefgaragen?|Garage|Stellplatz|Parkplatz|Gewerbe|Büro)\b/i.test(heading.trim()))return null;
  const labeled=(label:string)=>get('(?:'+label+')\\s*(?:\\([^\\n)]*\\))?\\s*[:\\n]?\\s*'+numberPattern+'[ \\t]*(?:€|EUR|(?=\\n|$))') ?? get(numberPattern+'\\s*(?:€|EUR)\\s*(?:'+label+')\\b');
  const warm=labeled('Warmmiete|Bruttowarmmiete');
  const total=labeled('Gesamtmiete|Gesamt-Miete');
  const cold=labeled('Netto-Kalt-Miete|Nettokaltmiete|Kaltmiete|Grundmiete');
  const operating=labeled('Betriebskosten');
  const heatingCost=labeled('Heizkosten');
  let rent=warm ?? total ?? cold ?? get(numberPattern+'\\s*(?:€|EUR)');
  let heating:Apartment['heating']=warm!==null?'Included':'Unknown';
  if(warm===null && cold!==null && operating!==null && heatingCost!==null) {rent=total ?? cold+operating+heatingCost+(labeled('Sonstige Kosten') ?? 0);heating='Included';}
  else if(/Heizkosten\s*(?:sind\s*)?(?:in\s*(?:der\s*)?(?:Gesamt|Warm)?miete\s*)?enthalten|inkl(?:usive|\.)?\s*Heizkosten/i.test(cleaned) && !/Heizkosten[^\n]{0,30}nicht enthalten/i.test(cleaned)) heating='Included';
  else if(warm===null && total===null && cold!==null) heating='Excluded';
  if(rent===null || rent<50 || rent>30000)return null;
  const rawDate=cleaned.match(/(?:frei ab|verfügbar ab|bezugsfrei ab|bezugsfrei|verfügbar|Einzug(?:stermin)?)\s*[:\n]?\s*([^\n]{1,45})/i)?.[1]?.trim() || '';
  const de=rawDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  const iso=de?`${de[3]}-${de[2].padStart(2,'0')}-${de[1].padStart(2,'0')}`:rawDate.slice(0,10);
  const availability=validDate(iso)?iso:rawDate;
  const address=cleaned.split('\n').find(line=>/\b\d{5}\s+[A-Za-zÄÖÜäöü]/.test(line))?.trim() || '';
  const city=address.match(/\b\d{5}\s+([A-Za-zÄÖÜäöüß-]+)/)?.[1] || (/\bHamburg\b/i.test(cleaned)?'Hamburg':'');
  return {key:identity(url),url,title:heading.trim().slice(0,250),city,location:address.slice(0,300),rooms,area,rent:Math.round(rent*100)/100,heating,availability};
}
export function listingLink(url:string):boolean {return /(?:expose|expos[eé]|propert(?:y|ies)|immobilie|angebot|object|detail|apply)\/[a-z0-9-]{3,}(?:[/?#]|$)|[?&](?:objectId|propertyId|exposeId)=/i.test(url) && !/result-list|\/landlords(?:[/?#]|$)/i.test(url);}
export function collect(doc:Document):Candidate[] {
  const found=new Map<string,Candidate>();
  const visible=(el:HTMLElement)=>el.getClientRects().length>0 && getComputedStyle(el).visibility!=='hidden';
  // The modern Immomio iframe uses Angular app-card elements, not anchors.
  // Its statistics are labelled with CSS icons and m<sup>2</sup>, not text labels.
  if(/(^|\.)immomio\.com$/.test(doc.location.hostname)) {
    const header=doc.querySelector<HTMLElement>('app-expose-header');
    if(header && visible(header) && /^wohnung$/i.test(header.querySelector('.header__chip--type')?.textContent?.trim() || '')) {
      const text=(selector:string)=>header.querySelector(selector)?.textContent?.trim() || '';
      const externalId=text('.header__external-id').replace(/^Objekt\s*ID\s*/i,'');
      const address=text('.header__address');
      const stat=(icon:string)=>header.querySelector(icon)?.parentElement?.textContent?.trim() || '';
      const whole=stat('.icon--rooms').match(/[\d,.]+/)?.[0];
      const half=stat('.icon--half-rooms').match(/[\d,.]+/)?.[0];
      const rooms=whole===undefined?'':String(germanNumber(whole)+(half?germanNumber(half)*0.5:0));
      const attributes=[...doc.querySelectorAll('dl.row')].map(row=>`${row.querySelector('dt')?.textContent?.trim() || ''}\n${row.querySelector('dd')?.textContent?.trim() || ''}`).join('\n');
      if(externalId && address && rooms){
        const candidate=parseListing(`${address}\n${stat('.icon--area-size')}\n${rooms} Zimmer\n${text('.header__price')}\n${attributes}`,doc.location.href,text('.header__name'));
        if(candidate){candidate.externalId=externalId;candidate.key=immomioKey(externalId,candidate.location);found.set(candidate.key,candidate);}
      }
    }
    for(const card of doc.querySelectorAll<HTMLElement>('app-card.property-card')) {
      if(!visible(card))continue;
      const text=(selector:string)=>card.querySelector(selector)?.textContent?.trim() || '';
      if(!/^wohnung$/i.test(text('.property-card__badges .im-chip-label')))continue;
      const externalId=text('.property-card__external-id').replace(/^Objekt\s*ID\s*/i,'');
      const title=text('.property-card__title');
      const address=text('.property-card__details > span');
      const area=card.querySelector('.icon--area-size')?.parentElement?.textContent?.trim() || '';
      const rooms=card.querySelector('.icon--rooms')?.parentElement?.textContent?.trim() || '';
      const rent=[...card.querySelectorAll('.property-card__stats-item')].find(el=>/€|EUR/.test(el.textContent || ''))?.textContent?.trim() || '';
      if(!externalId || !address || !title || !area || !rooms || !rent)continue;
      const candidate=parseListing(`${address}\n${area}\n${rooms} Zimmer\n${rent}\n${text('.property-card__available-from-date')}`,doc.location.href,title);
      if(candidate){candidate.externalId=externalId;candidate.key=immomioKey(externalId,candidate.location);found.set(candidate.key,candidate);}
    }
  }
  // On an exposé, read the property once. Self-links such as #kosten and
  // recommended-property links must not redefine the current listing's title.
  if(listingLink(doc.location.href)) {
    if(found.size)return [...found.values()].slice(0,100);
    const headings=[...doc.querySelectorAll<HTMLElement>('h1')].filter(visible).map(el=>el.innerText.trim());
    const title=[...headings,doc.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content || '',doc.title.replace(/\s*[|–-]\s*Immo(?:bilien)?Scout24.*$/i,'')].find(propertyTitle);
    if(!title)return [];
    const main=doc.querySelector<HTMLElement>('main,[role="main"],article') || doc.body;
    const candidate=parseListing(main.innerText.slice(0,40000),doc.location.href,title);
    return candidate?[candidate]:[];
  }
  const anchors=[...doc.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(a=>visible(a) && listingLink(a.href));
  for(const anchor of anchors) {
    let node:HTMLElement|null=anchor;
    for(let depth=0;node && depth<7;depth++,node=node.parentElement) {
      if(node===doc.body)break;
      const links=new Set([...node.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(a=>listingLink(a.href)).map(a=>identity(a.href)));
      if(links.size>1)break;
      const text=node.innerText;
      if(text.length>12000)break;
      const candidate=parseListing(text,anchor.href,node.querySelector<HTMLElement>('h1,h2,h3,h4')?.innerText || anchor.innerText);
      if(candidate){if(!found.has(candidate.key))found.set(candidate.key,candidate);break;}
    }
  }
  return [...found.values()].slice(0,100);
}
export function mergeCandidates(data:Data,candidates:Candidate[],sourceId:string,now:string):{data:Data;added:number;updated:number} {
  const apartments=[...data.apartments];let added=0,updated=0;
  for(const candidate of candidates) {
    if(!propertyTitle(candidate.title))continue;
    if(data.dismissedKeys?.some(key=>key===candidate.key || key===identity(candidate.url)))continue;
    const index=apartments.findIndex(a=>a.capture?.key===candidate.key || a.url && identity(a.url)===candidate.key);
    const {key,externalId: _externalId,...fields}=candidate;
    if(index<0){apartments.push({...fields,id:crypto.randomUUID(),sourceId,notes:'',stage:'Saved',createdAt:now,capture:{key,lastSeen:now,manual:false}});added++;}
    else {
      const previous=apartments[index];
      if(!previous.capture)continue; // Existing manual records stay under user control.
      const merged={...previous,capture:{...previous.capture,lastSeen:now}};
      if(!previous.capture.manual){
        // A partial results card must not erase richer detail-page information.
        for(const field of ['city','location','rooms','area','availability'] as const)if(fields[field]!=='' && fields[field]!==null)(merged as unknown as Record<string,unknown>)[field]=fields[field];
        if(propertyTitle(fields.title))merged.title=fields.title;
        if(fields.heating==='Included' || previous.heating!=='Included'){merged.rent=fields.rent;merged.heating=fields.heating;}
        if(listingLink(fields.url))merged.url=fields.url;
      }
      apartments[index]=merged;updated++;
    }
  }
  return {data:{...data,apartments},added,updated};
}
