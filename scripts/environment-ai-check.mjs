// Real authority, compiled policy comparisons and disposable worlds only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as E from '../src/engine.mjs';
import * as N from '../src/natural-wonders.mjs';
import * as C from '../src/climate.mjs';
import * as R from '../src/rules.mjs';
import {neighbors,tilesInRange} from '../src/world.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {runProcess,driverInfo} from '../src/drivers.mjs';
import {cleanActions} from '../src/environment/projection.mjs';
import {field} from './imperial-fixture.mjs';
import {prepareSite} from './natural-wonders-fixture.mjs';
const out=process.env.ENVIRONMENT_AI_OUTPUT||'output/environment-ai-20261030';fs.mkdirSync(out,{recursive:true});
const checks=[],evidence=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
function fixture(){const f=field();f.p.techs=Object.keys(R.TECHS);f.home.population=8;f.g.settings.climateEnabled=true;f.g.settings.naturalWondersEnabled=true;delete f.g.naturalWonders;N.initializeNaturalWonders(f.g);return f;}
function initialize(f){delete f.g.climate;C.initializeClimate(f.g);E.refreshVisibility(f.g);return f;}
function districtField(){const f=fixture(),{g,p,home,tile}=f;prepareSite(g,'zhangjiajie',tile(4,2));N.placeNaturalWonder(g,'zhangjiajie',tile(4,2).id);for(const t of tilesInRange(g.map,g.map.tiles[home.tile],2))if(t.cityId==null&&!t.naturalWonder)Object.assign(t,{owner:0,territoryCity:home.id});initialize(f);const ops=E.productionOptions(g,p,home).filter(a=>a.item==='campus'&&neighbors(g.map,g.map.tiles[a.tile]).some(n=>n.naturalWonder));assert(ops.length>=2);const rich=g.map.tiles[ops[0].tile],safe=g.map.tiles[ops[1].tile];rich.feature='forest';safe.feature=null;E.refreshVisibility(g);return {...f,rich,safe};}
function powerField(){const f=fixture();f.home.buildings.push('industrial','workshop','factory','campus','library');return initialize(f);}
function workerField(){const f=fixture(),{g,p,home,tile}=f,plot=tile(4,3),center=tile(5,3);Object.assign(plot,{terrain:'desert',hill:true,owner:0,territoryCity:home.id,improvement:'mine',pillaged:true});center.terrain='desert';initialize(f);const worker=E.addUnit(g,0,'builder',plot.id);worker.hp=12;E.refreshVisibility(g);C.startDisaster(g,'duststorm',center.id,{severity:2});return {...f,worker,plot};}

{
  const f=fixture(),{g,p,tile}=f,site=tile(12,12),source=prepareSite(g,'zhangjiajie',tile(13,12));
  initialize(f);p.explored=tilesInRange(g.map,site,2).map(t=>t.id).filter(id=>id!==source.id);p.knownTiles=Object.fromEntries(p.explored.map(id=>[id,{...g.map.tiles[id]}]));const known=new Set(p.explored);
  const baseline=E.settlementValue(g,p,site,known,true);N.placeNaturalWonder(g,'zhangjiajie',source.id);
  assert.equal(E.settlementValue(g,p,site,known,true),baseline);
  p.explored.push(source.id);p.knownTiles[source.id]={...source};p.naturalDiscoveries.push('zhangjiajie');known.add(source.id);
  assert(E.settlementValue(g,p,site,known,true)>baseline);
  g.climate.rainfall=20;C.startDisaster(g,'drought',site.id,{severity:2});const invisible=E.settlementValue(g,p,site,known,true);g.climate.disasters=[];assert.equal(E.settlementValue(g,p,site,known,true),invisible);
  pass('Settlement values known natural district opportunities without hidden identities or remote live-weather leakage');
}
{
  const f=fixture(),{g,p,tile}=f,site=tile(12,12),source=prepareSite(g,'mount_fuji',tile(13,12));initialize(f);
  p.explored=[site.id];let known=new Set(p.explored);assert.equal(C.climateSitePenalty(g,p,site,known),0);
  N.placeNaturalWonder(g,'mount_fuji',source.id);assert.equal(C.climateSitePenalty(g,p,site,known),0);
  known.add(source.id);assert.equal(C.climateSitePenalty(g,p,site,known),12);
  g.climate.geography.coastal=[[site.id,1]];g.climate.phase=4;g.climate.seaLevel=1;assert(C.climateSitePenalty(g,p,site,known)>=42);
  g.climate.enabled=false;assert.equal(C.climateSitePenalty(g,p,site,known),0);
  pass('Known volcanic exposure and low coasts affect site risk; unseen origins and disabled climate do not');
}
{
  const f=districtField(),{g,p,home,rich,safe}=f;
  const options=()=>E.productionOptions(g,p,home).filter(a=>a.item==='campus');let rows=options();
  assert(rows.find(a=>a.tile===rich.id).placementLoss>0);assert.equal(rows.find(a=>a.tile===safe.id).placementLoss,0);
  const before=rows.find(a=>a.tile===rich.id).placementLoss;g.climate.fertility[rich.id]={food:2,production:0};rows=options();assert(rows.find(a=>a.tile===rich.id).placementLoss>before);
  p.manual=false;rows=options();assert(!rows.some(a=>a.tile===rich.id));
  const external=cleanActions(g,p);assert(!JSON.stringify(external).includes('placementLoss'));assert(!JSON.stringify(external).includes('siteRisk'));
  pass('Native district shortlist preserves aura/fertile plots; private scoring hints stay out of external player previews');
}
{
  function improvement(wonder,resource){const f=districtField(),{g,p,home,rich}=f;if(!wonder){delete g.map.tiles.find(t=>t.naturalWonder).naturalWonder;N.initializeNaturalWonders(g);}if(resource)rich.resource='wheat';const worker=E.addUnit(g,0,'builder',rich.id);E.refreshVisibility(g);const obs=E.observation(g,p),action=obs.legalActions.find(a=>a.unit===worker.id&&a.type===(resource?'chop':'improve'));assert(action);return {f,action,value:action.hint.improvementValue};}
  const aura=improvement(true,false),plain=improvement(false,false);assert.equal(aura.value,plain.value);
  const {g,p,rich}=aura.f,culture=R.tileYield({...rich,...N.naturalTileProjection(g,p,rich)},p).culture;E.applyAction(g,p,aura.action);assert.equal(rich.improvement,'lumbermill');assert.equal(R.tileYield(rich,p).culture,culture);
  const clearing=improvement(true,true),ordinary=improvement(false,true);assert(clearing.action.hint.requiresClear);assert(clearing.value<ordinary.value);
  E.applyAction(clearing.f.g,clearing.f.p,clearing.action);assert.equal(clearing.f.rich.feature,null);assert.equal(R.naturalTileBonus(clearing.f.rich,clearing.f.p).culture||0,0);
  pass('Actual lumbermill construction preserves the aura; resource-clearing estimates and actual chopping lose the forest-only bonus');
}
{
  const f=powerField(),{g,home}=f;home.buildings.push('coalplant');
  assert(C.climateProductionUtility(g,home,'windplant')>C.climateProductionUtility(g,home,'oilplant'));
  home.buildings.push('dam','hydroplant');assert(C.climateProductionUtility(g,home,'windplant')<0);
  assert(C.climateProductionUtility(g,home,'solarplant')>0);assert(C.climateProductionUtility(g,home,'carbonrecapture')<0);
  g.climate.co2=500;g.climate.phase=5;assert(C.climateProductionUtility(g,home,'carbonrecapture')>0);
  pass('Power utility measures the actual active-plant gain and emissions; redundant generation and empty carbon removal have negative value');
}
if(process.env.ENVIRONMENT_AI_ENGINE_ONLY==='1'){console.log(JSON.stringify({passed:true,engineOnly:true,groups:checks.length}));process.exit(0);}

const pool=new NativeDriverPool(),baselines=fs.existsSync(out+'/baseline-binaries.json')?JSON.parse(fs.readFileSync(out+'/baseline-binaries.json','utf8')):[];
try{for(const civ of R.CIVS){assert.equal((await driverInfo(civ.file)).status,'ready');
  async function decide(f,name,filter,expected){f.p.driver.file=civ.file;const obs=E.observation(f.g,f.p);obs.legalActions=obs.legalActions.filter(filter);assert(obs.legalActions.length>=2,name+' needs a genuine choice');let baseline=null;
    const old=baselines.find(b=>b.file===civ.file);if(old){let oldObservation=obs;const script=out+'/baseline/observe.mjs';if(fs.existsSync(script)){const read=await runProcess(process.execPath,[path.resolve(script)],{input:JSON.stringify({save:E.serialize(f.g),seat:f.p.id}),timeout:10000,maxOutput:8*1024*1024});assert.equal(read.code,0,read.stderr.slice(0,1000));oldObservation=JSON.parse(read.stdout);oldObservation.legalActions=oldObservation.legalActions.filter(filter);assert(oldObservation.legalActions.length>=2);}const result=await runProcess(path.resolve(old.binary),[],{input:JSON.stringify(oldObservation),timeout:10000});assert.equal(result.code,0);baseline=JSON.parse(result.stdout).orders[0]||null;}
    const reply=await pool.execute(f.p,obs),order=reply.orders[0];assert(order,civ.file+' '+name+' returned no order');assert(expected(order),civ.file+' '+name+': '+JSON.stringify(order));const applied=E.applyAction(f.g,f.p,order);assert(applied!==false);evidence.push({driver:civ.file,scenario:name,baseline,updated:order,legalActionApplied:true});return order;}
  {
    const f=powerField();await decide(f,'productive clean power',a=>a.type==='produce'&&a.city===f.home.id&&['coalplant','windplant'].includes(a.item),a=>a.item==='windplant');
  }
  {
    const f=powerField();f.home.buildings.push('dam','hydroplant');await decide(f,'skip equal-output power replacement',a=>a.type==='produce'&&a.city===f.home.id&&['windplant','research'].includes(a.item),a=>a.item==='research');
  }
  {
    const f=powerField();await decide(f,'skip carbon removal at zero CO2',a=>a.type==='produce'&&a.city===f.home.id&&['carbonrecapture','research'].includes(a.item),a=>a.item==='research');
  }
  {
    const f=districtField();await decide(f,'preserve the natural aura plot',a=>a.type==='produce'&&a.city===f.home.id&&a.item==='campus'&&[f.rich.id,f.safe.id].includes(a.tile),a=>a.tile===f.safe.id);
  }
  {
    const f=districtField();f.rich.feature=null;f.g.climate.fertility[f.rich.id]={food:2,production:0};E.refreshVisibility(f.g);await decide(f,'preserve fertile soil',a=>a.type==='produce'&&a.city===f.home.id&&a.item==='campus'&&[f.rich.id,f.safe.id].includes(a.tile),a=>a.tile===f.safe.id);
  }
  {
    const f=workerField();await decide(f,'evacuate before repairing lethal weather',a=>a.unit===f.worker.id&&(a.type==='repair'||a.type==='fortify'||a.type==='move'&&a.tile===f.home.tile),a=>a.type==='move'&&a.tile===f.home.tile);
  }
  {
    const f=workerField();f.g.climate.disasters=[];f.worker.hp=100;E.refreshVisibility(f.g);await decide(f,'repair safely after weather passes',a=>a.unit===f.worker.id&&(a.type==='repair'||a.type==='move'&&a.tile===f.home.tile),a=>a.type==='repair');assert.equal(f.plot.pillaged,false);
  }
}}finally{pool.dispose();}
pass('All eight compiled civilizations apply seven real legal-choice scenarios, with before-binary decisions retained for comparison');
const changed=evidence.filter(e=>JSON.stringify(e.baseline)!==JSON.stringify(e.updated)).length;
fs.writeFileSync(out+'/checks.json',JSON.stringify({passed:true,checks,actualCalls:evidence.length,baselineCalls:baselines.length?evidence.length:0,changedDecisions:changed,evidence,paidGameplayCalls:0,productionSaveWrites:false},null,2));console.log(JSON.stringify({passed:true,groups:checks.length,actualCalls:evidence.length,changedDecisions:changed}));
