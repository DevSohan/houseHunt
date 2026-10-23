import { initialData, validateData, reconcileData, type Data } from './model';
const key = 'houseHunt';
const extension = typeof chrome !== 'undefined' && !!chrome.storage?.local;
const broker = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
async function request(message:unknown):Promise<Data>{const response=await chrome.runtime.sendMessage(message);if(!response?.ok)throw new Error(response?.error || 'Extension worker unavailable. Reload the extension and this page.');return validateData(response.data);}
async function read(): Promise<unknown> { return extension ? (await chrome.storage.local.get(key))[key] : JSON.parse(localStorage.getItem(key) ?? 'null'); }
async function write(data: Data) { if (extension) await chrome.storage.local.set({[key]:data}); else localStorage.setItem(key, JSON.stringify(data)); }
export async function loadData(): Promise<Data> {
  if(broker)return request({type:'load'});
  return navigator.locks.request(key, async () => { const stored = await read(); const data=reconcileData(stored == null?initialData():validateData(stored));if(fingerprint(stored)!==fingerprint(data))await write(data);return data; });
}
export async function saveData(data: Data, previous: Data) {
  if(broker)return request({type:'save',data,previous});
  return navigator.locks.request(key, async () => {
    const stored = await read();
    if (fingerprint(stored) !== fingerprint(previous)) throw new Error('Data changed in another dashboard. Copy any unsaved form details, then reload this page before saving.');
    const next=reconcileData(validateData(data));await write(next);return next;
  });
}
// Chrome may return object keys in a different order. Array order remains meaningful.
export function fingerprint(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]));
    }
    return item;
  });
}
