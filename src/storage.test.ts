import { expect, it } from 'vitest';
import { fingerprint } from './storage';
it('ignores Chrome storage object key ordering without ignoring array order or values',()=>{
  expect(fingerprint({b:[{z:1,a:2}],a:3})).toBe(fingerprint({a:3,b:[{a:2,z:1}]}));
  expect(fingerprint({a:[1,2]})).not.toBe(fingerprint({a:[2,1]}));
  expect(fingerprint({a:1})).not.toBe(fingerprint({a:2}));
});
