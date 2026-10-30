import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {generateMap,neighbors} from '../src/world.mjs';
import {MAP_SIZES,isWater,dist,waterDepths,SHALLOW_WATER_LIMIT} from '../src/rules.mjs';
import {restore,serialize} from '../src/engine.mjs';
import {historicalNation,NATIONAL_TRADITIONS} from '../src/nations.mjs';

const checks=[],rows=[],timings=[],types=['continents','pangaea','islands'],folder=new URL('../output/map-diversity-20261010/',import.meta.url);
const hash=v=>createHash('sha256').update(v).digest('hex'),pass=s=>{checks.push(s);console.log('PASS '+s);};
await mkdir(folder,{recursive:true});
function components(map,allowed){const seen=new Set(),groups=[],sizes=new Map();for(const t of map.tiles){if(!allowed(t)||seen.has(t.id))continue;const group=[t];seen.add(t.id);for(let i=0;i<group.length;i++)for(const n of neighbors(map,group[i]))if(allowed(n)&&!seen.has(n.id)){seen.add(n.id);group.push(n);}groups.push(group.length);for(const n of group)sizes.set(n.id,group.length);}return {groups:groups.sort((a,b)=>b-a),sizes};}
function inspect(map){const land=map.tiles.filter(t=>!isWater(t)),mountains=land.filter(t=>t.terrain==='mountain'),parts=components(map,t=>!isWater(t)),walkable=components(map,t=>!isWater(t)&&t.terrain!=='mountain');return {seed:map.seed,type:map.type,width:map.width,height:map.height,land:land.length,landFraction:land.length/map.tiles.length,largestLandShare:parts.groups[0]/land.length,majorLandmasses:parts.groups.filter(n=>n>=land.length*.075).length,components:parts.groups,mountains:mountains.length,centralMountains:mountains.filter(t=>t.row>=map.height*.25&&t.row<=map.height*.75).length,mountainNeighbors:mountains.filter(t=>neighbors(map,t).some(n=>n.terrain==='mountain')).length,smallestStartArea:Math.min(...map.starts.map(id=>walkable.sizes.get(id))),smallestAdjacentLand:Math.min(...map.starts.map(id=>neighbors(map,map.tiles[id]).filter(t=>!isWater(t)&&t.terrain!=='mountain').length))};}
const gallery=[];
for(const type of types){
 const prior=JSON.parse(await readFile(new URL('before-'+type+'.json',folder),'utf8'));gallery.push({label:'旧版 · '+type,map:prior});
 for(let i=0;i<24;i++){
  const started=performance.now(),map=generateMap('DIVERSITY-'+i,106,66,12,type);timings.push(performance.now()-started);const row=inspect(map);rows.push(row);
  assert.equal(new Set(map.starts).size,12);assert(row.smallestStartArea>=48,type+' '+i+' starts trapped in a tiny pocket');assert(row.smallestAdjacentLand>=3);
  for(const id of map.starts){const t=map.tiles[id],ns=neighbors(map,t);assert(!isWater(t)&&t.terrain!=='mountain');assert(ns.some(n=>n.resource==='wheat'));assert(ns.some(n=>n.resource==='iron'||n.resource==='horses'));for(const other of map.starts)if(other!==id)assert(dist(t,map.tiles[other],map)>=4);}
  if(type==='continents'){assert(row.majorLandmasses>=2&&row.majorLandmasses<=5,type+' '+i+' must have separate substantial continents');assert(row.largestLandShare<.8);assert(row.landFraction>.3&&row.landFraction<.75);}
  if(type==='islands'){assert(row.components.filter(n=>n>=40).length>=8);assert(row.largestLandShare<.35);assert(row.landFraction>.17&&row.landFraction<.55);}
  if(type==='pangaea'){assert(row.largestLandShare>.8);assert(row.landFraction>.3&&row.landFraction<.8);}
  assert(row.mountains>20);const depths=waterDepths(map);assert(map.tiles.some(t=>t.terrain==='ocean'));assert(map.tiles.some(t=>t.terrain==='coast'));
  for(const t of map.tiles){if(isWater(t))assert.equal(t.terrain==='coast',depths.get(t.id)<=SHALLOW_WATER_LIMIT);if(t.resource==='fish')assert(isWater(t));if(t.terrain==='mountain')assert(!t.resource&&!t.hill&&!t.feature);for(const edge of t.riverEdges)assert(edge>=0&&edge<6);}
  if(i===0)assert.deepEqual(generateMap(map.seed,106,66,12,type),map);
  if(i<3){gallery.push({label:'新版 · '+type+' · '+map.seed,map});await writeFile(new URL('after-'+type+'-'+i+'.json',folder),JSON.stringify(map,(key,value)=>key==='index'?undefined:value));}
 }
}
pass('Seventy-two seeds preserve distinct continental, Pangaea and archipelago connectivity rather than merging every profile');
pass('All seventy-two twelve-player maps provide separated starts, two opening resource roles, three exits and at least forty-eight reachable land cells');
pass('Repeated seeds are exact; both water depths, coastal fish and valid mountain/river records remain consistent');
for(const type of types){const sample=rows.filter(r=>r.type===type),total=sample.reduce((n,r)=>n+r.mountains,0);assert(sample.reduce((n,r)=>n+r.centralMountains,0)/total>.6);assert(sample.reduce((n,r)=>n+r.mountainNeighbors,0)/total>.7);}
assert(new Set(rows.filter(r=>r.type==='continents').map(r=>r.majorLandmasses)).size>=2);
assert(new Set(rows.map(r=>r.land.toString()+':'+r.mountains)).size===rows.length);
pass('Mountain chains have real neighboring peaks and mainly occupy the interior; seeds vary continental count, shape and terrain density');
let configurations=0;
for(const [size,dimensions]of Object.entries(MAP_SIZES))for(const type of types)for(const wrapX of [true,false]){
 const map=generateMap('SIZE-'+size+'-'+type,dimensions.width,dimensions.height,dimensions.players,type,wrapX),row=inspect(map);assert.equal(map.starts.length,dimensions.players);assert.equal(new Set(map.starts).size,dimensions.players);assert(row.smallestStartArea>=48);assert(row.smallestAdjacentLand>=3);for(const id of map.starts)for(const other of map.starts)if(id!==other)assert(dist(map.tiles[id],map.tiles[other],map)>=4);configurations++;
}
pass('All five current sizes and six-to-sixteen player recommendations work in all three profiles with wrapped and bounded topology');
for(const type of types)for(let i=0;i<12;i++){const map=generateMap('SMALL-DIVERSITY-'+i,38,26,8,type);assert.equal(new Set(map.starts).size,8);for(const id of map.starts)for(const other of map.starts)if(id!==other)assert(dist(map.tiles[id],map.tiles[other],map)>=4);}
pass('Thirty-six compact legacy-size seeds retain eight separated valid opening sites');
const legacy=await readFile(new URL('../output/performance-optimization-20261010/rule-fixture.json',import.meta.url)),loaded=restore(legacy.toString()),expected=JSON.parse(legacy);expected.settings.aiAlgorithm??='A';expected.settings.leaderRulesVersion??=1;for(const p of expected.players){p.leaderRulesVersion??=1;if(historicalNation(p))p.trait=NATIONAL_TRADITIONS[p.id%8];}assert.deepEqual(JSON.parse(serialize(loaded)),expected);assert.equal(hash(JSON.stringify(loaded.map.tiles)),hash(JSON.stringify(JSON.parse(legacy).map.tiles)));assert.equal(serialize(restore(serialize(loaded))),serialize(loaded));
pass('An existing frozen saved world retains every gameplay field and its original geography, with explicit legacy version metadata and historical tradition labels');
const names={continents:'大陆与海洋',pangaea:'盘古大陆',islands:'群岛'},palette=['#173e58','#65aba7','#9caf78','#b8a56c','#d0b382','#9fa995','#e6e9dd','#626b6c'],terrains=['ocean','coast','grass','plains','desert','tundra','snow','mountain'];
const panels=gallery.map(({label,map})=>({label:label.replace(map.type,names[map.type]),width:map.width,height:map.height,starts:map.starts,data:map.tiles.map(t=>terrains.indexOf(t.terrain)).join(''),hills:map.tiles.filter(t=>t.hill).map(t=>t.id)}));
const html=`<!doctype html><meta charset="utf-8"><title>地图生成前后对比</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#f3efe4;color:#30372b;font:15px system-ui}h1{font-size:24px;margin:0 0 8px}p{margin:0 0 18px;color:#626657}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.label{font-size:13px;margin:0 0 7px}canvas{display:block;width:100%;height:auto;background:#173e58;border:1px solid #c9c6b8}.legend{margin-top:20px;display:flex;gap:20px}.swatch{display:inline-block;width:12px;height:12px;margin-right:6px}</style><h1>同一组种子，地图生成前后对比</h1><p>每行依次为：旧版 DIVERSITY-0、新版 DIVERSITY-0、DIVERSITY-1、DIVERSITY-2。红点是文明出生点；灰色山系、褐色丘陵。</p><div class="grid"></div><div class="legend"><span><i class="swatch" style="background:#173e58"></i>深海</span><span><i class="swatch" style="background:#65aba7"></i>浅海</span><span><i class="swatch" style="background:#9caf78"></i>草原</span><span><i class="swatch" style="background:#626b6c"></i>山脉</span><span><i class="swatch" style="background:#d65345"></i>出生点</span></div><script>const panels=${JSON.stringify(panels)},colors=${JSON.stringify(palette)};for(const p of panels){const el=document.createElement('div');el.innerHTML='<div class="label">'+p.label+'</div><canvas></canvas>';document.querySelector('.grid').append(el);const c=el.querySelector('canvas');c.width=p.width*4+2;c.height=p.height*4;const ctx=c.getContext('2d');for(let id=0;id<p.data.length;id++){const row=Math.floor(id/p.width),x=id%p.width*4+(row%2)*2;ctx.fillStyle=colors[Number(p.data[id])];ctx.fillRect(x,row*4,4,4);}ctx.fillStyle='#6e704e';for(const id of p.hills){const row=Math.floor(id/p.width),x=id%p.width*4+(row%2)*2;ctx.fillRect(x+1,row*4+2,2,1);}for(const id of p.starts){const row=Math.floor(id/p.width),x=id%p.width*4+(row%2)*2;ctx.fillStyle='#d65345';ctx.beginPath();ctx.arc(x+2,row*4+2,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff2dc';ctx.lineWidth=.8;ctx.stroke();}}</script>`;
await writeFile(new URL('preview.html',folder),html);
const sources=Object.fromEntries(await Promise.all(['src/world.mjs','src/river-network.mjs','src/rules.mjs'].map(async file=>[file,hash(await readFile(new URL('../'+file,import.meta.url)))])));
const summary=Object.fromEntries(types.map(type=>{const sample=rows.filter(r=>r.type===type);return [type,{largestLandShare:{min:Math.min(...sample.map(r=>r.largestLandShare)),max:Math.max(...sample.map(r=>r.largestLandShare))},majorLandmasses:[...new Set(sample.map(r=>r.majorLandmasses))].sort(),centralMountainShare:sample.reduce((n,r)=>n+r.centralMountains,0)/sample.reduce((n,r)=>n+r.mountains,0)}];}));
await writeFile(new URL('../output/map-diversity-checks.json',import.meta.url),JSON.stringify({passed:true,checks,sources,seeds:rows.length,sizeConfigurations:configurations,compactSeeds:36,rows,summary,medianGenerationMs:timings.sort((a,b)=>a-b)[Math.floor(timings.length/2)],activeSaveWritten:false,gameLaunched:false},null,2)+'\n');console.log(JSON.stringify({summary,sizeConfigurations:configurations}));
