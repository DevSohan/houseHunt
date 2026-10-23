import { build } from 'vite';
for (const [entry,format,name] of [['src/content.ts','iife','capture'],['src/background.ts','es','background']]) {
  await build({configFile:false,publicDir:false,build:{emptyOutDir:false,lib:{entry,name:'HouseHunt',formats:[format],fileName:()=>`${name}.js`}}});
}
