import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.goto('https://www.harabau.de/wohnen/wohnungsangebote/',{waitUntil:'domcontentloaded'});
 const iframe=page.frameLocator('iframe[src*="immomio"]');
 await iframe.locator('body').waitFor({timeout:20000});
 await page.waitForTimeout(4000);
 for(const frame of page.frames()){
  if(!frame.url().includes('homepage.immomio'))continue;
  console.log(await frame.evaluate(()=>({url:location.origin+location.pathname,text:document.body.innerText,anchors:[...document.querySelectorAll('a')].map(a=>({text:a.innerText,url:a.getAttribute('href')})),elements:[...document.querySelectorAll('[class]')].filter(e=>/property|card/i.test(e.className)).slice(0,25).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,300)}))})));
  await writeFile('/private/tmp/harabau-immomio.html',await frame.content());
  const popupPromise=page.context().waitForEvent('page',{timeout:10000});
  await frame.locator('app-card.property-card').first().click();
  const detail=await popupPromise;await detail.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  console.log('DETAIL',await detail.evaluate(()=>({url:location.origin+location.pathname,text:document.body.innerText})));
  await writeFile('/private/tmp/harabau-immomio-detail.html',await detail.content());
 }
}finally{await browser.close();}
