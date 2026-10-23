import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.goto('https://www.immobilienscout24.de/expose/138879357/',{waitUntil:'domcontentloaded',timeout:25000});
 await page.waitForTimeout(2000);
 console.log(await page.evaluate(()=>({title:document.title,headings:[...document.querySelectorAll('h1,h2')].map(e=>({tag:e.tagName,id:e.id,text:e.textContent?.trim()})),selfLinks:[...document.querySelectorAll('a[href]')].filter(a=>a.href.includes('/expose/138879357')).map(a=>({text:a.innerText,url:a.getAttribute('href')})),text:document.body.innerText.slice(0,3000)})));
 await writeFile('/private/tmp/scout-expose.html',await page.content());
}finally{await browser.close();}
