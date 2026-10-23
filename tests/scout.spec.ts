import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
test('exposé headings win over Kosten self-links and related property links',async({page})=>{
  await page.addInitScript(()=>{
    const w=window as any;
    w.candidates=[];
    w.chrome={storage:{local:{get:async()=>({})},onChanged:{addListener:()=>{}}},runtime:{sendMessage:async(message:any)=>{w.candidates=message.candidates;return{ok:true};}}};
  });
  await page.route('https://www.immobilienscout24.de/**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:`<main><h1>Helle Wohnung mit Balkon</h1><p>Hamburg · 3 Zimmer · 75 m²</p><section><h2>Kosten</h2><a href="/expose/138879357/#kosten">Kosten</a><p>3 Zimmer</p><p>75 m²</p><p>Warmmiete: 1.300 €</p></section><article><a href="/expose/777777777"><h2>Other recommended home</h2></a><p>5 Zimmer · 140 m² · 2.000 €</p></article></main>`}));
  await page.goto('https://www.immobilienscout24.de/expose/138879357/');
  await page.addScriptTag({path:resolve('dist/capture.js')});
  await expect.poll(()=>page.evaluate(()=>(window as any).candidates.length)).toBe(1);
  const candidate=await page.evaluate(()=>(window as any).candidates[0]);
  expect(candidate).toMatchObject({title:'Helle Wohnung mit Balkon',rooms:3,area:75,rent:1300,url:'https://www.immobilienscout24.de/expose/138879357/'});
  await page.locator('h2').first().evaluate(e=>{e.textContent='Kosten:';});
  await page.waitForTimeout(1100);
  expect(await page.evaluate(()=>(window as any).candidates[0].title)).toBe('Helle Wohnung mit Balkon');
});
