import { collect } from './capture';
let timer:ReturnType<typeof setTimeout>|undefined, last='', running=false;
async function scan(){
  if(running || document.visibilityState==='hidden')return;
  running=true;
  try{
    if((await chrome.storage.local.get('houseHunt')).houseHunt?.autoCapture===false)return;
    const candidates=collect(document);
    const signature=JSON.stringify({url:location.href,candidates});
    if(signature===last)return;
    const body=document.body.innerText;
    const status=candidates.length?'Captured visible listings':/Login Mietinteressenten|Passwort vergessen|Bitte melden Sie sich an/i.test(body)?'Login needed — sign in and open your offers':/Inhalt entsperren|Platzhalterinhalt/i.test(body)?'Consent needed — unlock the listings on the website':/keine (?:freien |passenden |öffentlichen )?(?:Wohnungen|Wohnungsangebote|Immobilien|Angebote)|0 Ergebnisse/i.test(body)?'Website reports no offers':'No readable listing cards yet — open an individual exposé';
    const result=await chrome.runtime.sendMessage({type:'capture',candidates,status});
    if(result?.ok && !result.disabled)last=signature;
    else if(result?.error)console.warn('House Hunt capture:',result.error);
  }catch(error){console.debug('House Hunt capture unavailable:',error);}
  finally{running=false;}
}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>void scan(),900);}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
addEventListener('hashchange',schedule);
addEventListener('popstate',schedule);
document.addEventListener('visibilitychange',schedule);
chrome.storage.onChanged.addListener(changes=>{if(changes.houseHunt?.newValue?.autoCapture!==false && changes.houseHunt?.oldValue?.autoCapture===false){last='';schedule();}});
// Bounded processing, no navigation or network requests. Polling also detects SPA route changes.
setInterval(()=>void scan(),15000);
schedule();
