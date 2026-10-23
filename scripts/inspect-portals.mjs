// One-time, public-page inspection. No login, submissions, pagination, or API calls.
import { chromium } from '@playwright/test';
const targets = [
 ['Gartenstadt Wandsbek','https://www.gartenstadt-wandsbek.de/wohnen/freie-wohnungen/'],
 ['Immosolve 2211665','https://2211665.hpm.immosolve.eu/#!/result-list-2'],
 ['Immosolve 2222820','https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2'],
 ['WV1902','https://wv1902.de/wohnungsangebote/'],
 ['Immomio','https://tenant.immomio.com/de/landlords'],
];
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 for (const [name,url] of targets) {
  const page=await browser.newPage();
  try {
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
   await page.locator('body').waitFor();
   await page.waitForTimeout(1500);
   const result=await page.evaluate(()=>({title:document.title,text:document.body.innerText.slice(0,4500),frames:[...document.querySelectorAll('iframe')].map(x=>x.src.split('?')[0]),embeds:[...document.querySelectorAll('[data-borlabs-cookie-type]')].map(x=>({type:x.getAttribute('data-borlabs-cookie-type'),content:(x.getAttribute('data-borlabs-cookie-content')||'').slice(0,3000)}))}));
   console.log(JSON.stringify({name,...result}));
  } catch(e) {console.log(JSON.stringify({name,error:e.message}));}
  finally {await page.close();}
 }
} finally {await browser.close();}
