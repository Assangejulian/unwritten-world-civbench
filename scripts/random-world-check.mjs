import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {generateMap,neighbors} from '../src/world.mjs';
import {createGame,restore,serialize} from '../src/engine.mjs';
import {historicalNation,NATIONAL_TRADITIONS} from '../src/nations.mjs';
import {MAP_SIZES,isWater,dist,waterDepths,SHALLOW_WATER_LIMIT} from '../src/rules.mjs';

const checks=[],rows=[],timings=[],gallery=[],folder=new URL('../output/random-world-20261010/',import.meta.url);
const hash=v=>createHash('sha256').update(v).digest('hex'),pass=s=>{checks.push(s);console.log('PASS '+s);};
await mkdir(folder,{recursive:true});
function components(map,allowed){const seen=new Set(),groups=[],sizes=new Map();for(const t of map.tiles){if(!allowed(t)||seen.has(t.id))continue;const group=[t];seen.add(t.id);for(let i=0;i<group.length;i++)for(const n of neighbors(map,group[i]))if(allowed(n)&&!seen.has(n.id)){seen.add(n.id);group.push(n);}groups.push(group.length);for(const n of group)sizes.set(n.id,group.length);}return {groups:groups.sort((a,b)=>b-a),sizes};}
function inspect(map,minimumArea=48){
 const land=map.tiles.filter(t=>!isWater(t)),parts=components(map,t=>!isWater(t)),walkable=components(map,t=>!isWater(t)&&t.terrain!=='mountain');
 assert.equal(map.type,'random');assert.equal(new Set(map.starts).size,map.starts.length);
 for(const id of map.starts){const t=map.tiles[id],ns=neighbors(map,t);assert(!isWater(t)&&t.terrain!=='mountain');assert(walkable.sizes.get(id)>=minimumArea,map.seed+' has an isolated starting pocket');assert(ns.filter(n=>!isWater(n)&&n.terrain!=='mountain').length>=3);assert(ns.some(n=>n.resource==='wheat'));assert(ns.some(n=>n.resource==='iron'||n.resource==='horses'));for(const other of map.starts)if(other!==id)assert(dist(t,map.tiles[other],map)>=4);}
 const depths=waterDepths(map);assert(map.tiles.some(t=>t.terrain==='ocean'));assert(map.tiles.some(t=>t.terrain==='coast'));
 for(const t of map.tiles){if(isWater(t))assert.equal(t.terrain==='coast',depths.get(t.id)<=SHALLOW_WATER_LIMIT);if(t.resource==='fish')assert(isWater(t));if(t.terrain==='mountain')assert(!t.resource&&!t.feature&&!t.hill);}
 return {seed:map.seed,landFraction:land.length/map.tiles.length,largestLandShare:parts.groups[0]/land.length,majorLandmasses:parts.groups.filter(n=>n>=land.length*.075).length,components:parts.groups.length,mountains:land.filter(t=>t.terrain==='mountain').length,smallestStartArea:Math.min(...map.starts.map(id=>walkable.sizes.get(id)))};
}
for(let i=0;i<96;i++){
 const start=performance.now(),map=generateMap('FREE-WORLD-'+i,106,66,12);timings.push(performance.now()-start);rows.push(inspect(map));
 assert.equal(map.starts.length,12);assert(rows.at(-1).landFraction>=.269&&rows.at(-1).landFraction<=.641);
 if(i<3)assert.deepEqual(generateMap(map.seed,106,66,12,'random'),map);
 if(i<12)gallery.push(map);
}
const span=field=>({min:Math.min(...rows.map(r=>r[field])),max:Math.max(...rows.map(r=>r[field]))});
const summary={landFraction:span('landFraction'),largestLandShare:span('largestLandShare'),majorLandmasses:[...new Set(rows.map(r=>r.majorLandmasses))].sort((a,b)=>a-b),mountains:span('mountains')};
assert(summary.landFraction.max-summary.landFraction.min>.32);assert(summary.largestLandShare.max-summary.largestLandShare.min>.4);assert(summary.majorLandmasses.length>=3);
assert.equal(new Set(rows.map(r=>r.landFraction+':'+r.mountains+':'+r.largestLandShare)).size,rows.length);
pass('Ninety-six twelve-player seeds vary continuous sea coverage and connectivity instead of selecting preset profiles');
pass('All random starts have three exits, opening food/supply, four-cell separation and at least forty-eight reachable cells');
pass('Identical complete settings reproduce exactly and authoritative water, fish and mountain records remain consistent');
let configurations=0;
for(const [size,d]of Object.entries(MAP_SIZES))for(const wrapX of [true,false])for(let i=0;i<8;i++){
 const map=generateMap('FREE-SIZE-'+size+'-'+i,d.width,d.height,d.players,'random',wrapX);inspect(map);assert.equal(map.starts.length,d.players);configurations++;
}
pass('Eighty random size/topology seeds cover all five recommended six-to-sixteen-player worlds');
for(let i=0;i<24;i++){const map=generateMap('FREE-COMPACT-'+i,38,26,8);inspect(map,8);assert.equal(map.starts.length,8);}
pass('Twenty-four compact legacy-size random seeds retain separated usable opening sites');
const presetHashes={continents:'79bd4fd52b6ff4b935a769e5aac85933a776ca441fda819b9602e130c2cba204',pangaea:'bbdb4661aaa8048fe236e8ce5a439b5ec26b660adea32fce0f9f294ae4268e92',islands:'ad1f9dc96ec04f01352152c9d9c966b3503bc3aefb8d7b6cc3c8ada5f54470b8'};
for(const type of ['continents','pangaea','islands']){
 const bytes=await readFile(new URL('../output/map-diversity-20261010/after-'+type+'-0.json',import.meta.url));assert.equal(hash(bytes),presetHashes[type],'The frozen 2.22.0 preset reference changed');const reference=JSON.parse(bytes);
 const generated=generateMap('DIVERSITY-0',106,66,12,type);assert.deepEqual(JSON.parse(JSON.stringify(generated,(key,value)=>key==='index'?undefined:value)),reference);
}
const frozen=await readFile(new URL('../output/performance-optimization-20261010/rule-fixture.json',import.meta.url),'utf8'),normalized=JSON.parse(frozen);normalized.settings.aiAlgorithm??='A';normalized.settings.leaderRulesVersion??=1;for(const p of normalized.players){p.leaderRulesVersion??=1;if(historicalNation(p))p.trait=NATIONAL_TRADITIONS[p.id%8];}assert.deepEqual(JSON.parse(serialize(restore(frozen))),normalized);
const game=createGame({seed:'FREE-WORLD-0',size:'huge',players:12,barbarians:false});assert.equal(game.map.type,'random');const saved=serialize(game);assert.equal(serialize(restore(saved)),saved);
pass('Engine creation defaults to random; legacy saves normalize explicit algorithm/rule metadata and historical tradition labels, retain frozen geography and leave preset outputs unchanged');
const palette=['#173e58','#65aba7','#9caf78','#b8a56c','#d0b382','#9fa995','#e6e9dd','#626b6c'],terrains=['ocean','coast','grass','plains','desert','tundra','snow','mountain'];
const panels=gallery.map((map,i)=>({label:map.seed+' · 陆地 '+Math.round(rows[i].landFraction*100)+'% · 最大陆块 '+Math.round(rows[i].largestLandShare*100)+'%',width:map.width,height:map.height,starts:map.starts,data:map.tiles.map(t=>terrains.indexOf(t.terrain)).join('')}));
const html=`<!doctype html><meta charset="utf-8"><title>随机世界种子预览</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#f3efe4;color:#30372b;font:15px system-ui}h1{font-size:24px;margin:0 0 8px}p{margin:0 0 18px;color:#626657}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.label{font-size:13px;margin:0 0 7px}canvas{display:block;width:100%;height:auto;background:#173e58;border:1px solid #c9c6b8}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style><h1>同一种模式，十二颗种子</h1><p>全部选择「随机世界」，十二文明、106 × 66。红点为出生点；灰色为山脉。陆块数量、大小与海陆比例随种子变化。</p><div class="grid"></div><script>const panels=${JSON.stringify(panels)},colors=${JSON.stringify(palette)};for(const p of panels){const el=document.createElement('div');el.innerHTML='<div class="label">'+p.label+'</div><canvas></canvas>';document.querySelector('.grid').append(el);const c=el.querySelector('canvas');c.width=p.width*4+2;c.height=p.height*4;const ctx=c.getContext('2d');for(let id=0;id<p.data.length;id++){const row=Math.floor(id/p.width),x=id%p.width*4+(row%2)*2;ctx.fillStyle=colors[Number(p.data[id])];ctx.fillRect(x,row*4,4,4);}for(const id of p.starts){const row=Math.floor(id/p.width),x=id%p.width*4+(row%2)*2;ctx.fillStyle='#d65345';ctx.beginPath();ctx.arc(x+2,row*4+2,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff2dc';ctx.lineWidth=.8;ctx.stroke();}}</script>`;
await writeFile(new URL('preview.html',folder),html);
const sources=Object.fromEntries(await Promise.all(['src/world.mjs','src/engine.mjs','web/app.js'].map(async file=>[file,hash(await readFile(new URL('../'+file,import.meta.url)))])));
await writeFile(new URL('../output/random-world-checks.json',import.meta.url),JSON.stringify({passed:true,checks,sources,seeds:96,sizeConfigurations:configurations,compactSeeds:24,summary,rows,medianGenerationMs:timings.sort((a,b)=>a-b)[48],activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
console.log(JSON.stringify(summary));
