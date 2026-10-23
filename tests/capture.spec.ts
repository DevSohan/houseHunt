import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';

test('visited results automatically pass through the real capture and worker bundles',async({page})=>{
  await page.addInitScript(()=>{
    const w=window as any;const listeners:any[]=[];
    w.store={};
    w.chrome={runtime:{id:'test',getURL:(p:string)=>`chrome-extension://test/${p}`,onMessage:{addListener:(fn:any)=>{w.receive=fn;}},sendMessage:(m:any)=>new Promise(resolve=>{w.lastMessage=m;w.receive(m,{id:'test',url:location.href,tab:{id:1,url:location.href}},resolve);})},storage:{onChanged:{addListener:(fn:any)=>listeners.push(fn)},local:{get:async(key:string)=>({[key]:w.store[key]}),set:async(data:any)=>{const changes:any={};for(const key in data){changes[key]={oldValue:w.store[key],newValue:data[key]};w.store[key]=data[key];}listeners.forEach(fn=>fn(changes,'local'));}}},action:{onClicked:{addListener:()=>{}},setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}}};
  });
  await page.route('https://www.immobilienscout24.de/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:`<main><h1>Hamburg apartments</h1><article><a href="/expose/123456789"><h2>Sunny apartment</h2></a><p>22303 Hamburg</p><p>3 Zimmer</p><p>75,5 m²</p><p>Warmmiete: 1.350,50 €</p><p>Frei ab: 01.02.2027</p></article><article><a href="/expose/987654321"><h2>Another apartment</h2></a><p>Hamburg</p><p>2 Zimmer</p><p>60 m²</p><p>Kaltmiete: 850 €</p></article><article style="display:none"><a href="/expose/111111111">Hidden template</a><p>3 Zimmer 80 m² 1000 €</p></article></main>`}));
  await page.goto('https://www.immobilienscout24.de/Suche/hamburg');
  await page.addScriptTag({path:resolve('dist/background.js'),type:'module'});
  await page.waitForFunction(()=>!!(window as any).receive);
  await page.addScriptTag({path:resolve('dist/capture.js')});
  await expect.poll(()=>page.evaluate(()=>(window as any).store.houseHunt?.apartments.length)).toBe(2);
  const records=await page.evaluate(()=>(window as any).store.houseHunt.apartments);
  expect(records[0]).toMatchObject({rooms:3,area:75.5,rent:1350.5,sourceId:'portal-0',heating:'Included'});
  expect(records[1]).toMatchObject({rooms:2,area:60,rent:850,heating:'Excluded'});
  expect(records[1]).toMatchObject({stage:'Archived',autoArchivedFrom:'Saved'});
  expect(records[0].visitedAt).toBeUndefined();
  await page.locator('article').first().locator('p').nth(3).evaluate(el=>{el.textContent='Warmmiete: 1.390 €';});
  await expect.poll(()=>page.evaluate(()=>(window as any).store.houseHunt.apartments[0].rent)).toBe(1390);
  expect(await page.evaluate(()=>(window as any).store.houseHunt.apartments.length)).toBe(2);
  await page.evaluate(()=>{(window as any).store.houseHunt.autoCapture=false;});
  await page.locator('article').first().locator('p').nth(3).evaluate(el=>{el.textContent='Warmmiete: 1.410 €';});
  await page.waitForTimeout(1200);
  expect(await page.evaluate(()=>(window as any).store.houseHunt.apartments[0].rent)).toBe(1390);
});
