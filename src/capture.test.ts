import { describe,it,expect } from 'vitest';
import { parseListing, identity, immomioKey, listingLink, mergeCandidates } from './capture';
import { initialData } from './model';
const url='https://www.immobilienscout24.de/expose/123456789';
const sample='Schöne Wohnung\n22303 Hamburg\n3 Zimmer\nWohnfläche: 75,5 m²\nWarmmiete: 1.350,50 €\nFrei ab: 01.02.2027';
describe('visible listing parsing',()=>{
 it('parses German amounts and exact availability',()=>{expect(parseListing(sample,url)).toMatchObject({rooms:3,area:75.5,rent:1350.5,city:'Hamburg',availability:'2027-02-01',heating:'Included'});});
 it('reads price-before-label cards without confusing rooms for rent',()=>{expect(parseListing('Hamburg\n1.250 €\nKaltmiete\n3 Zi.\n75 m²',url)).toMatchObject({rent:1250,rooms:3,area:75,heating:'Excluded'});});
 it('leaves cold rent excluded and generic total ambiguous',()=>{
  expect(parseListing(sample.replace('Warmmiete','Kaltmiete'),url)?.heating).toBe('Excluded');
  expect(parseListing(sample.replace('Warmmiete','Gesamtmiete'),url)?.heating).toBe('Unknown');
 });
 it('sums separately labeled costs without adding Nebenkosten twice',()=>{
  const text=sample.replace('Warmmiete: 1.350,50 €','Kaltmiete: 900 €\nBetriebskosten: 150 €\nHeizkosten: 100 €\nNebenkosten: 250 €');
  expect(parseListing(text,url)).toMatchObject({rent:1150,heating:'Included'});
 });
 it.each(['Login Mietinteressenten\nE-Mail Adresse','Keine freien Wohnungen','Wohnfläche: Area m²\nZimmer: Number of rooms\nKaltmiete: Rent €','3 Zimmer\n75 m²'])('rejects non-listings and incomplete shells',text=>expect(parseListing(text,url)).toBeNull());
 it('rejects parking titles and preserves ambiguous dates',()=>{expect(parseListing(sample,url,'Stellplatz in Hamburg')).toBeNull();expect(parseListing(sample.replace('01.02.2027','nach Vereinbarung'),url)?.availability).toBe('nach Vereinbarung');});
 it('does not confuse an Immomio collection token with a property ID',()=>{expect(listingLink('https://homepage.immomio.com/de/properties?token=public')).toBe(false);expect(listingLink('https://homepage.immomio.com/de/properties/abc-123')).toBe(true);});
 it('shares Immomio object identity across origins',()=>{expect(identity('https://homepage.immomio.com/de/properties/abc-123')).toBe(identity('https://tenant.immomio.com/de/properties/abc-123'));});
});
describe('automatic merging',()=>{
 it('does not overwrite the property title or progress with a section heading',()=>{
  const candidate=parseListing(sample,url)!;
  const first=mergeCandidates(initialData(),[candidate],'portal-0','2026-09-13T00:00:00Z');
  first.data.apartments[0].stage='Viewing';first.data.apartments[0].notes='Appointment booked';
  const second=mergeCandidates(first.data,[{...candidate,title:'Kosten'}],'portal-0','2026-09-14T00:00:00Z');
  expect(second.data.apartments[0]).toMatchObject({title:candidate.title,stage:'Viewing',notes:'Appointment booked'});
 });
 it('does not recreate a removed property on a subsequent visit',()=>{
  const candidate=parseListing(sample,url)!;
  const removed={...initialData(),dismissedKeys:[candidate.key]};
  expect(mergeCandidates(removed,[candidate],'portal-0','2026-09-14T00:00:00Z').data.apartments).toHaveLength(0);
 });
 it('uses a stable Immomio key across card and exposé address variations',()=>{
  expect(immomioKey('1/36/5/47','Anita-Ree-Straße 10, 21035 Hamburg, Bergedorf, Deutschland')).toBe(immomioKey('1/36/5/47','Anita-Ree-Straße 10, 21035 Hamburg, Deutschland'));
  expect(immomioKey('1/36/5/47','Other Street 10, 21035 Hamburg')).not.toBe(immomioKey('1/36/5/47','Anita-Ree-Straße 10, 21035 Hamburg'));
 });
 it('updates duplicates while preserving progress, notes and richer rent information',()=>{
  const candidate=parseListing(sample,url)!;
  const first=mergeCandidates(initialData(),[candidate],'portal-0','2026-09-13T00:00:00Z');
  first.data.apartments[0].notes='Viewing Friday';first.data.apartments[0].stage='Viewing';
  const second=mergeCandidates(first.data,[{...candidate,heating:'Unknown',rent:900,availability:''}],'portal-0','2026-09-14T00:00:00Z');
  expect(second.data.apartments).toHaveLength(1);expect(second.added).toBe(0);
  expect(second.data.apartments[0]).toMatchObject({rent:1350.5,heating:'Included',notes:'Viewing Friday',stage:'Viewing',availability:'2027-02-01'});
 });
 it('protects manual corrections and accepts old backups',()=>{
  const first=mergeCandidates(initialData(),[parseListing(sample,url)!],'portal-0','2026-09-13T00:00:00Z');
  first.data.apartments[0].capture!.manual=true;first.data.apartments[0].rent=1100;
  const second=mergeCandidates(first.data,[parseListing(sample,url)!],'portal-0','2026-09-14T00:00:00Z');
  expect(second.data.apartments[0].rent).toBe(1100);
  delete first.data.apartments[0].capture;
  expect(mergeCandidates(first.data,[parseListing(sample,url)!],'portal-0','2026-09-14T00:00:00Z').data.apartments).toHaveLength(1);
 });
});
