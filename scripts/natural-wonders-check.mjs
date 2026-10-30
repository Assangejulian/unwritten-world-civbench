import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as N from '../src/natural-wonders.mjs';
import * as C from '../src/climate.mjs';
import * as H from '../src/heritage.mjs';
import * as W from '../src/warfare.mjs';
import {neighbors,tilesInRange} from '../src/world.mjs';
import {field} from './imperial-fixture.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {naturalWorld,prepareSite} from './natural-wonders-fixture.mjs';
const checks=[],pass=label=>{checks.push(label);console.log('PASS '+label);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function sameSave(a,b){
  if(a===b)return;
  const diffs=[];
  function walk(x,y,path=''){if(diffs.length>=12)return;if(x===y)return;if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const key of new Set([...Object.keys(x),...Object.keys(y)]))walk(x[key],y[key],path+'/'+key);}else diffs.push({path,actual:x,expected:y});}
  walk(JSON.parse(a),JSON.parse(b));assert.fail('Save differs: '+JSON.stringify(diffs));
}
function fixture(){const f=field();f.g.settings.naturalWondersEnabled=true;delete f.g.naturalWonders;N.initializeNaturalWonders(f.g);C.initializeClimate(f.g);return f;}
function own(f,t){t.owner=f.p.id;t.territoryCity=f.home.id;return t;}
function known(f,t){f.p.explored=[...new Set([...f.p.explored,t.id])];E.refreshVisibility(f.g);}

{
  const definitions=Object.entries(R.NATURAL_WONDERS);assert.equal(definitions.length,35);
  assert.equal(new Set(definitions.map(([,s])=>s.name)).size,35);
  for(const [key,spec]of definitions){
    assert.equal(spec.origin,'real');assert.match(spec.reference,/^https:\/\//);
    assert(!['meteorfall_basin','aurora_icefield','echo_canyon','emberheart_caldera'].includes(key));
    const {g,tile}=fixture(),t=prepareSite(g,key,tile(5,5));
    t.terrain='ocean';assert.throws(()=>N.placeNaturalWonder(g,key,t.id),/Invalid natural wonder placement/);
    prepareSite(g,key,t);N.placeNaturalWonder(g,key,t.id);assert.equal(t.naturalWonder,key);
    delete g.climate;C.initializeClimate(g);assert.equal(g.climate.geography.volcanoes.includes(t.id),!!spec.volcano);
  }
  pass('Exactly 35 unique real sites accept valid geography, reject ocean substitutes and classify active volcanoes correctly');
}

{
  for(const key of ['iguazu_falls','victoria_falls','niagara_falls','uluru','grand_canyon','ha_long_bay','lake_baikal','mount_everest','mount_fuji','lencois_maranhenses']){
    const {g,tile}=fixture(),t=prepareSite(g,key,tile(5,5)),ns=neighbors(g.map,t);
    const rule=R.NATURAL_WONDERS[key].placement;
    if(rule.river)t.river=false;
    else if(rule.hill!==undefined)t.hill=!rule.hill;
    else if(rule.minWater)for(const n of ns)n.terrain='grass';
    else if(rule.nearCold)for(const n of ns)n.terrain='grass';
    else if(rule.noWater)ns[0].terrain='coast';
    else if(rule.coastWithin)for(const n of tilesInRange(g.map,t,rule.coastWithin))if(n!==t)n.terrain='grass';
    assert.throws(()=>N.placeNaturalWonder(g,key,t.id),/Invalid natural wonder placement/,key);
  }
  const {g,tile}=fixture(),t=prepareSite(g,'mount_everest',tile(5,5));g.climate.geography.volcanoes.push(t.id);
  N.placeNaturalWonder(g,'mount_everest',t.id);assert(!g.climate.geography.volcanoes.includes(t.id));
  pass('River, hill, cold, coast and land restrictions reject inappropriate sites; nonvolcanic mountains remove random eruption origins');
}

for(const seed of ['LANDMARKS-A','LANDMARKS-B','LANDMARKS-C']){
  const config={players:4,size:'small',seed,barbarians:false,autosaveEnabled:false};
  const a=E.createGame(config),b=E.createGame(config),plain=E.createGame({...config,naturalWondersEnabled:false});
  const locations=g=>g.map.tiles.filter(t=>t.naturalWonder).map(t=>[t.id,t.naturalWonder]);
  assert.deepEqual(locations(a),locations(b));assert.ok(locations(a).length>=2&&locations(a).length<=8);
  assert.deepEqual(a.map.starts,plain.map.starts);assert.equal(a.rngState,plain.rngState);assert.equal(a.encounters.rngState,plain.encounters.rngState);
  const terrain=g=>g.map.tiles.map(({naturalWonder,...tile})=>tile);assert.deepEqual(terrain(a),terrain(plain));
  const nodes=a.map.tiles.filter(t=>t.naturalWonder);
  assert.equal(new Set(nodes.map(t=>t.naturalWonder)).size,nodes.length);
  for(const t of nodes){assert.ok(a.map.starts.every(id=>R.dist(t,a.map.tiles[id],a.map)>5));assert.ok(nodes.every(o=>o===t||R.dist(o,t,a.map)>=8));assert.ok(!t.resource&&!t.camp&&!t.village&&!t.cityState&&!t.improvement&&!t.district);}
  assert.ok(a.players.every(p=>p.naturalDiscoveries.length===0));
}
pass('Independent deterministic placement preserves base maps, starts and unrelated RNG, with real geography, spacing and clean landmarks');

for(const [speed,pace]of Object.entries(R.GAME_SPEEDS)){
  const f=fixture();f.g.settings.gameSpeed=speed;const source=f.tile(5,3);source.terrain='desert';N.placeNaturalWonder(f.g,'eye_of_the_sahara',source.id);
  const culture=f.p.cultureBank||0,score=f.p.age.score;E.refreshVisibility(f.g);
  assert.equal(f.p.cultureBank-culture,Math.round(10*pace.factor));assert.equal(f.p.age.score-score,2);
  E.refreshVisibility(f.g);assert.equal(f.p.cultureBank-culture,Math.round(10*pace.factor));
}
pass('Discovery culture scales through all six game speeds; repeated exploration never duplicates culture or era points');

{
  const f=naturalWorld(),{g,p,cells}=f;
  p.explored=g.map.tiles.map(t=>t.id);E.refreshVisibility(g);
  assert.equal(p.naturalDiscoveries.length,35);
  for(const [key,t]of Object.entries(cells)){
    const baseline={...t};delete baseline.naturalWonder;
    const base=R.tileYield(baseline,p),actual=R.tileYield(t,p),spec=R.NATURAL_WONDERS[key];
    for(const kind of R.YIELD_KEYS)near(actual[kind],spec.workable?base[kind]+(spec.yields[kind]||0):0);
  }
  assert.equal(JSON.stringify(g.map.tiles).includes('naturalAuras'),false);
  const restored=E.restore(E.serialize(g));assert.equal(N.naturalWonderView(restored,0).landmarks.length,35);
  pass('All 35 real-world definitions have actual workable yields or unworkable mountains, with derived auras excluded from saves');
}

const fog=fixture();
{
  const {g,p,home,tile}=fog,old=g.map.tiles[home.tile];old.cityId=null;
  home.tile=tile(6,7).id;Object.assign(tile(6,7),{cityId:home.id,owner:p.id,territoryCity:home.id});
  const source=tile(10,7),plot=own(fog,tile(9,7));source.terrain='mountain';plot.feature='forest';
  N.placeNaturalWonder(g,'zhangjiajie',source.id);E.refreshVisibility(g);
  assert.ok(p.visible.includes(plot.id));assert.ok(!p.explored.includes(source.id));
  const before=E.cityYields(g,home),snapshot=E.snapshot(g,p.id),shown=snapshot.map.tiles[plot.id];
  assert.equal(shown.naturalYield,undefined);assert.equal(N.naturalWonderView(g,p.id).landmarks.length,0);
  const culture=p.cultureBank||0,era=p.age.score;
  known(fog,source);
  assert.equal(p.cultureBank,culture+Math.round(10*R.gamePace(g).factor));assert.equal(p.age.score,era+2);
  assert.ok(home.worked.includes(plot.id));assert.ok(E.cityYields(g,home).culture>before.culture);
  const human=E.snapshot(g,0),native=E.observation(g,p),projected=human.map.tiles[plot.id];
  assert.equal(projected.naturalYield.culture,1);assert.deepEqual(R.tileYield(projected,human.players[0]),R.tileYield(plot,p));
  assert.deepEqual(native.tiles.find(t=>t.id===plot.id).yields,R.tileYield(projected,human.players[0]));
  assert.equal(human.naturalWonders.landmarks[0].key,'zhangjiajie');assert.equal(E.snapshot(g,1).naturalWonders.landmarks.length,0);
  const earned=p.cultureBank,points=p.age.score;for(let i=0;i<3;i++){E.refreshVisibility(g);E.snapshot(g,0);E.observation(g,p);}
  assert.equal(p.cultureBank,earned);assert.equal(p.age.score,points);
  const text=E.serialize(g),restored=E.restore(text);sameSave(E.serialize(restored),text);E.refreshVisibility(restored);assert.equal(restored.players[0].cultureBank,earned);
  pass('Hidden sources grant no aura or identity; discovery rewards once, affects actual city work and matches human/native views and exact save restoration');
}

{
  const f=fixture(),{g,p,home,tile}=f,cell=own(f,tile(5,3));cell.terrain='desert';
  p.techs=Object.keys(R.TECHS);N.placeNaturalWonder(g,'eye_of_the_sahara',cell.id);E.refreshVisibility(g);
  assert.equal(E.canSettle(g,p,cell),false);assert.equal(E.buildable(g,p,home,'campus',cell.id),false);
  assert.equal(R.improvementFor(p,cell),null);assert.equal(R.canChop(p,{...cell,feature:'forest'}),false);
  const builder=E.addUnit(g,0,'builder',cell.id),charges=builder.charges,gold=p.gold;
  assert.deepEqual(W.fieldActions(g,p,builder),[]);assert.equal(W.canBuildFort(g,p,builder,cell),false);
  for(const action of [{type:'improve',item:'mine'},{type:'buildRoad'},{type:'buildFort'},{type:'chop'}])assert.throws(()=>E.applyAction(g,p,{...action,unit:builder.id}));
  assert.equal(builder.charges,charges);assert.equal(p.gold,gold);assert.equal(cell.improvement,null);
  assert.ok(!E.legalActions(g,p).some(a=>a.unit===builder.id&&['improve','chop','buildFort','buildRoad'].includes(a.type)));
  assert.ok(E.reachable(g,p,builder).length>0);
  pass('Real founding, district placement and worker/fort/road authority protects landmarks while normal movement remains available');
}

{
  const f=fixture(),{g,p,home,tile}=f,source=own(f,tile(5,3)),campus=own(f,tile(4,3));source.terrain='desert';
  N.placeNaturalWonder(g,'eye_of_the_sahara',source.id);assert.equal(E.adjacency(g,p,campus,'campus'),0);E.refreshVisibility(g);
  assert.equal(E.adjacency(g,p,campus,'campus'),2);home.buildings.push('campus');home.districts.push({item:'campus',tile:campus.id});campus.district={item:'campus',kind:'district',city:home.id};
  assert.equal(N.cityHasNaturalWonder(g,p,home),true);
  const person=H.GREAT_PEOPLE.find(s=>s.targetRequirement==='natural_wonder_or_coast_campus'),unit=E.addUnit(g,0,'great_person',home.tile);
  unit.greatPerson=person.key;unit.charges=person.charges||1;unit.activations=0;p.greatPeople.owned.push({key:person.key,unit:unit.id});g.heritage.recruited[person.key]={owner:0,turn:g.turn};
  assert.equal(H.activationError(g,p,unit,{city:home.id}),null);
  const reserve=(p.heritageScienceReserve||0)+(p.scienceBank||0);E.applyAction(g,p,{type:'activateGreatPerson',unit:unit.id,city:home.id});
  assert.ok((p.heritageScienceReserve||0)+(p.scienceBank||0)>reserve);
  pass('Known landmark adjacency changes actual district income and enables real inland natural-wonder scientist activation');
}

{
  const f=fixture(),{g,p,tile}=f,source=tile(10,10),plot=own(f,tile(11,10));source.terrain='mountain';plot.improvement='farm';
  g.settings.climateEnabled=true;g.settings.disasterIntensity=0;delete g.climate;C.initializeClimate(g);tile(10,11).terrain='coast';N.placeNaturalWonder(g,'mount_etna',source.id);
  known(f,source);assert.ok(g.climate.geography.volcanoes.includes(source.id));
  const base=R.tileYield(plot,p);assert.equal(base.production,1);
  const soldier=E.addUnit(g,0,'warrior',plot.id);C.startDisaster(g,'eruption',source.id,{severity:2});g.turn++;C.settleClimate(g);
  assert.equal(plot.pillaged,true);assert.ok(soldier.hp<100);assert.equal(source.naturalWonder,'mount_etna');
  for(let i=0;i<18;i++){while(g.climate.disasters.length){g.turn++;C.settleClimate(g);}C.startDisaster(g,'eruption',source.id);g.turn++;C.settleClimate(g);}
  assert.ok(Object.values(g.climate.fertility).some(v=>v.food+v.production>0));assert.ok(Object.values(g.climate.fertility).every(v=>v.food+v.production<=2));
  assert.equal(R.naturalAuraYield(plot,p).food,1);assert.equal(R.naturalAuraYield(plot,p).production,1);
  pass('The real Etna volcano is a real eruption origin, damages units/infrastructure and retains independent bounded aura and fertility effects');
}

{
  const clean=E.createGame({players:2,size:'small',seed:'NATURAL-LEGACY',barbarians:false,naturalWondersEnabled:false}),data=JSON.parse(E.serialize(clean));
  delete data.naturalWonders;delete data.settings.naturalWondersEnabled;for(const p of data.players)delete p.naturalDiscoveries;
  const text=JSON.stringify(data),legacy=E.restore(text);assert.equal(legacy.naturalWonders,undefined);sameSave(E.serialize(legacy),text);
  assert.throws(()=>E.createGame({naturalWondersEnabled:'yes'}));
  const state=JSON.parse(E.serialize(fog.g));
  for(const edit of [g=>{g.naturalWonders.version=9;},g=>{g.players[0].naturalDiscoveries.push('missing');},g=>{delete g.players[0].naturalDiscoveries;},g=>{g.map.tiles[0].naturalYield={science:99};},g=>{g.map.tiles[0].naturalAuras=['zhangjiajie'];},g=>{g.naturalWonders.enabled=false;}]){const broken=structuredClone(state);edit(broken);assert.throws(()=>E.restore(JSON.stringify(broken)));}
  pass('Legacy worlds remain byte-identical without retroactive landmarks/rewards; malformed identity, disclosure and derived-yield saves reject');
}

{
  const g=E.restore(E.serialize(fog.g));for(const p of g.players)assignController(p,'agent',{displayName:'fixture'});
  const runtime=await MatchRuntime.create({players:3,size:'small',naturalWondersEnabled:false,execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
  try{await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});const token=runtime.seatTokens.get(0),view=await runtime.observe(token,{section:'natural_wonders'}),rules=runtime.rules(token,{kind:'natural_wonder',limit:40});
    assert.equal(view.value.landmarks.length,1);assert.equal(view.value.landmarks[0].key,'zhangjiajie');assert.equal(rules.total,35);assert.equal(rules.entries.length,35);assert(rules.entries.every(e=>e.rule.origin==='real'));assert.ok(JSON.stringify(rules).includes('mount_etna'));
    assert.equal((await runtime.observe(runtime.seatTokens.get(1),{section:'natural_wonders'})).value.landmarks.length,0);
  }finally{runtime.simulation?.dispose?.();}
  pass('The real match boundary exposes public natural-wonder rules and only the querying civilization\'s discovered landmarks');
}
await mkdir('output/natural-wonders-real35-20261030',{recursive:true});
await writeFile('output/natural-wonders-real35-20261030/rules.json',JSON.stringify({passed:true,checks,productionSaveWrites:false,paidModelCalls:false},null,2)+'\n');
