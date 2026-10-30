import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {restore,serialize,snapshot,observation,cityYields,buildable,refreshVisibility,addUnit,event,finishTurn,applyAction} from '../src/engine.mjs';
import {BUILDINGS,DISTRICT_LEVELS,POWER_PLANTS,districtStage,districtStatus,civilizationEra,cityEraStyle,dist,TECHS,CIVICS} from '../src/rules.mjs';
import {geopoliticalContext,geopoliticalPressure} from '../src/geopolitics.mjs';
import {diplomacyTurn,beginWar,truceRemaining} from '../src/warfare.mjs';
import {militaryAssessment} from '../src/strategy.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

const bytes=await readFile(new URL('../output/modernization-save-input.json',import.meta.url)),checks=[],metrics={},pass=name=>{checks.push(name);console.log('PASS '+name);};
const fresh=()=>restore(bytes.toString());
{
 for(const [item,levels]of Object.entries(DISTRICT_LEVELS)){const city={buildings:[]};for(const [index,group]of levels.entries()){city.buildings.push(group[0]);assert.equal(districtStatus(item,city).level,index+1);assert.equal(districtStage(item,city),group[0]);}assert.equal(districtStage(item,{buildings:[item]}),item);}pass('Every district reports actual completed stages, independent of researched technologies');
 const city={buildings:['industrial','workshop','factory',...POWER_PLANTS]};assert.equal(districtStatus('industrial',city).level,4);assert.equal(districtStage('industrial',city),'powerplant');pass('Alternative coal, oil and nuclear power stations occupy the same fourth tier');
}
{
 const g=fresh(),c=g.cities.find(c=>c.buildings.includes('factory')),p=g.players[c.owner];c.buildings=c.buildings.filter(k=>!POWER_PLANTS.includes(k));const old=cityYields(g,c).production;c.buildings.push('powerplant');const nuclear=cityYields(g,c).production;c.buildings.push('coalplant','oilplant');assert.equal(cityYields(g,c).production,nuclear);assert(nuclear>old);assert(!buildable(g,p,c,'coalplant'));assert(!buildable(g,p,c,'oilplant'));pass('Real city yields count only the highest constructed power station and reject obsolete downgrades');
 const staged=fresh(),d=staged.cities.find(c=>c.buildings.includes('factory')),owner=staged.players[d.owner];d.buildings=d.buildings.filter(k=>!POWER_PLANTS.includes(k));owner.techs.push('steam');assert(buildable(staged,owner,d,'coalplant'));d.production={item:'coalplant',progress:10000};finishTurn(staged,{actions:false});assert(d.buildings.includes('coalplant'));assert.equal(districtStage('industrial',d),'coalplant');pass('A coal power station completes through actual city production and updates its district stage');
}
{
 for(let era=0;era<9;era++){const p={techs:Object.keys(TECHS).filter(k=>TECHS[k].era<=era),civics:[]};assert.equal(civilizationEra(p),era);assert(cityEraStyle(era));}assert.equal(civilizationEra({techs:[],civics:['professional']}),CIVICS.professional.era);assert.equal(cityEraStyle(7),'information');pass('All nine eras map to six contemporary city appearances using both technology and civic progress');
 const g=fresh(),s=snapshot(g,5,{manualOptionsOnly:true}),foreign=s.cities.find(c=>c.owner!==5);assert(foreign);assert.equal(foreign.visualEra,civilizationEra(g.players[foreign.owner]));assert.deepEqual(s.players[foreign.owner].techs,undefined);assert.deepEqual(foreign.buildings,[]);pass('Visible foreign city architecture exposes a public era scalar while keeping research and building lists private');
 const p=g.players[5],d=g.map.tiles.find(t=>t.district&&t.owner!==5&&p.visible.includes(t.id));assert(d);refreshVisibility(g);const remembered=p.knownTiles[d.id].district.stage;p.visible=p.visible.filter(id=>id!==d.id);const c=g.cities.find(c=>c.id===d.district.city);c.buildings.push('nuclear','powerplant','broadcast');assert.equal(snapshot(g,5).map.tiles[d.id].district.stage,remembered);pass('Unseen district upgrades retain the last observed stage without leaking hidden construction');
}
{
 const g=fresh(),p=g.players[5],q=g.players[2],a=geopoliticalPressure(g,p,q),b=geopoliticalPressure(g,q,p);metrics.englandTang={england:a,tang:b};assert(a.borderPressure>25&&b.borderPressure>25);assert(a.interleaving>0&&a.cityProximity>0&&a.coastalRivalry>0);assert.equal(a.allianceMitigation,true);const grievances=p.relations[q.id].grievances;diplomacyTurn(g,event);assert(p.relations[q.id].grievances>grievances);assert.equal(p.relations[q.id].status,'alliance');pass('The captured England/Tang border creates material city, interleaving and coastal tension even while allied');
 const base=geopoliticalPressure(g,p,q);p.relations[q.id].status='peace';p.relations[q.id].openBorders=false;assert(geopoliticalPressure(g,p,q).borderPressure>base.borderPressure);pass('Alliances mitigate geographical rivalry without erasing it or forcing immediate war');
 const before=geopoliticalPressure(g,p,q),unseen=g.map.tiles.find(t=>!p.visible.includes(t.id)&&t.owner!==p.id);addUnit(g,q.id,'tank',unseen.id);unseen.owner=q.id;unseen.resource='uranium';assert.deepEqual(geopoliticalPressure(g,p,q),before);pass('Hidden armies and live unseen border/resource changes cannot affect geopolitical decisions');
 p.visible=[];assert.equal(geopoliticalPressure(g,p,q).militaryPressure,0);pass('Troop pressure disappears outside current visibility while remembered border rivalry remains');
}
{
 const g=fresh(),p=g.players[5],q=g.players[2],base=geopoliticalPressure(g,p,q),frontier=geopoliticalContext(g,p).frontier.get(q.id);for(const id of frontier.keys())p.knownTiles[id].terrain='mountain';assert(geopoliticalPressure(g,p,q).borderPressure<base.borderPressure);pass('Known mountain barriers reduce traversable shared-border pressure');
 for(const t of Object.values(p.knownTiles))if(t.owner===q.id)t.owner=null;p.knownCities=Object.fromEntries(Object.entries(p.knownCities).filter(([,c])=>c.owner!==q.id));assert.equal(geopoliticalPressure(g,p,q).borderPressure,0);pass('A distant opponent with no remembered neighboring territory or cities creates no invented border conflict');
}
{
 const g=fresh(),p=g.players[5],q=g.players[2],strength=u=>({tank:70,warrior:20}[u.type]||40),base=militaryAssessment(g,p,q,strength);p.gold=0;p.warWeariness=50;p.relations[0].status='war';const pressured=militaryAssessment(g,p,q,strength);assert(pressured.opportunity<=base.opportunity);assert(pressured.supplyPenalty>base.supplyPenalty);pass('Native military opportunity discounts insolvency, war weariness and multiple existing fronts');
 p.relations[q.id].status='peace';q.relations[p.id].status='peace';p.relations[q.id].truceUntil=(g.realtime?.time||g.turn*20)+400;assert(truceRemaining(g,p.id,q.id)>0);assert.throws(()=>beginWar(g,p,q,event));pass('Higher geopolitical discontent never bypasses the twenty-period truce');
}
{
 const g=fresh(),p=g.players[5],cold=performance.now();for(const a of g.players){const context=geopoliticalContext(g,a,{cached:true});for(const id of a.met)geopoliticalPressure(g,a,g.players[id],context);}metrics.coldMs=performance.now()-cold;
 const start=performance.now();for(let i=0;i<100;i++)for(const a of g.players){const context=geopoliticalContext(g,a,{cached:true});for(const id of a.met)geopoliticalPressure(g,a,g.players[id],context);}metrics.warmAllPairsMs=(performance.now()-start)/100;assert(metrics.warmAllPairsMs<10);
 const context=geopoliticalContext(g,p,{cached:true}),old=geopoliticalPressure(g,p,g.players[2],context);p.relations[2].status='peace';p.relations[2].openBorders=false;assert(geopoliticalPressure(g,p,g.players[2],context).borderPressure>old.borderPressure);pass('Cached per-perspective pressure reuses unchanged calculations and immediately invalidates treaty changes');
 const pool=new NativeDriverPool();try{const campaign=fresh(),nation=campaign.players[5];campaign.players.forEach(p=>p.manual=true);let dissolved=false;for(let cycle=0;cycle<50&&!dissolved;cycle++){campaign.turn++;campaign.realtime.time+=20;diplomacyTurn(campaign,event);const obs=observation(campaign,nation);obs.legalActions=obs.legalActions.filter(a=>a.type==='endAlliance'&&a.player===2);assert(obs.legalActions[0].hint.sharedEdges>0);const result=await pool.execute(nation,obs);const end=result.orders.find(a=>a.type==='endAlliance');if(end){applyAction(campaign,nation,end);dissolved=true;metrics.allianceReconsiderationPeriods=cycle+1;assert.equal(nation.relations[2].status,'peace');assert(truceRemaining(campaign,5,2)>=80);}}assert(dissolved);pass('Real C++ AI gradually reconsiders the captured England/Tang alliance from actual accumulated rivalry and preserves break protection');}finally{pool.dispose();}
 const original=fresh();original.cities.find(c=>c.buildings.includes('factory')).buildings.push('coalplant');const normalized=serialize(restore(serialize(original)));assert(serialize(restore(normalized))===normalized,'Normalized building and diplomatic state must round-trip idempotently');pass('New building and diplomacy projections retain save round-trip determinism');
}
const art=JSON.parse(await readFile(new URL('../art-source/modernization-20261006/manifest.json',import.meta.url)));assert.equal(art.frames.length,22);assert(art.bytes<600000);pass('Twenty-two generated structures share one bounded transparent runtime atlas');
await writeFile(new URL('../output/modernization-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,artBytes:art.bytes,sourceTurn:JSON.parse(bytes).turn,activeSaveWritten:false,gameLaunched:false},null,2));
