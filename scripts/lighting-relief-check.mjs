// Regression: hidden placeholder tiles must not affect bakeRelief output.
// Run: node tools/relief-hidden-check.mjs   (from the render-study root)
import {register} from 'node:module';import {pathToFileURL} from 'node:url';import assert from 'node:assert';
const root=pathToFileURL(process.cwd()+'/').href;
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s.startsWith('/')&&!s.startsWith('//')&&s.endsWith('.mjs')&&!s.startsWith('/workspace'))return n(${JSON.stringify(root)}+'src'+s,c);return n(s,c);}`));
globalThis.performance??={now:()=>Date.now()};
const {bakeRelief}=await import(root+'web/world-lighting.js');
const W=24,H=16,tiles=[];for(let r=0;r<H;r++)for(let q=0;q<W;q++)tiles.push({id:tiles.length,q,r,terrain:(q*7+r*3)%5?'grassland':'plains',hill:(q+r)%4===0,hidden:(q>8&&q<16&&r>4&&r<12)});
const renderer={game:{map:{wrapX:false}},position:t=>({x:t.q*30+(t.r%2)*15,y:t.r*26}),heightAt:t=>t.hill?6:2};
const run=ts=>bakeRelief(renderer,ts,0,0,W*30,H*26,256,160,W*30).values;
const base=run(tiles);
const mutated=tiles.map(t=>t.hidden?{...t,terrain:'mountain',hill:true,resource:'iron',elevation:99}:t);
const after=run(mutated);
assert.strictEqual(Buffer.compare(Buffer.from(base),Buffer.from(after)),0,'hidden tile fields changed the relief bake');
const vis=tiles.map(t=>!t.hidden&&t.q===2&&t.r===2?{...t,terrain:'mountain'}:t);
assert.notStrictEqual(Buffer.compare(Buffer.from(base),Buffer.from(run(vis))),0,'sanity: visible change must alter bake');
console.log('relief-hidden-check PASS',base.length,'bytes identical; visible-change sanity ok');
