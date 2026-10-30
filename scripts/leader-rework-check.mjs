// Disposable worlds only. This focused check never listens or writes active saves.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createGame,foundCity,addUnit,applyAction,buildable,successorsFor,cityYields,leaderCityBonuses,serialize,restore,refreshVisibility,unitCombatProfile,unitUpgradeOptions,reachable,movementAllowance,canLinkUnits,finishTurn,orderCost,observation,unitUpgradeCost} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {LEADERS,UNITS,BUILDINGS,TECHS,leaderFor,unitUpkeep,purchaseCost,cityAttackDamage,unitMovement,siegeMatchesWall} from '../src/rules.mjs';
import {UNIQUE_UNITS,UNIQUE_BUILDINGS,hasBuilding,baseItem} from '../src/unique-content.mjs';
import {leaderInstant,conquestEffects,operationalBuilding,uniqueCombatBonus} from '../src/leader-events.mjs';
import {citizenPressures,loyaltyStatus} from '../src/domestic.mjs';
import {fieldActions} from '../src/warfare.mjs';
import {neighbors,tilesInRange} from '../src/world.mjs';
const report=[],pass=name=>{report.push(name);console.log('PASS '+name);};
function field(key='qin',version=2){
 const g=createGame({seed:'LEADER-REWORK',players:2,size:'small',barbarians:false,leaderRulesVersion:version,leaders:[key,key==='sejong'?'qin':'sejong']});
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,resource:null,owner:null,cityId:null,district:null,improvement:null,fort:null});
 g.realtime={version:1,time:0,period:20,nextEconomy:20,queues:{},sequence:0};
 const p=g.players[0],q=g.players[1];let a=g.units.find(u=>u.owner===0&&u.type==='settler'),b=g.units.find(u=>u.owner===1&&u.type==='settler');a.tile=20*g.map.width+20;b.tile=20*g.map.width+28;
 const c=foundCity(g,p,a),enemy=foundCity(g,q,b);g.units=[];p.gold=10000;c.population=8;
 for(const t of tilesInRange(g.map,g.map.tiles[c.tile],3))if(t.owner===null){t.owner=p.id;t.territoryCity=c.id;}
 p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];return {g,p,q,c,enemy};
}
assert.equal(Object.keys(UNIQUE_UNITS).length,25);assert.equal(Object.keys(UNIQUE_BUILDINGS).length,25);
for(const leader of LEADERS){const {g,p}=field(leader.key);const resolved=leaderFor(p);assert.equal(resolved.key,leader.key);assert(resolved.uniqueUnit&&resolved.uniqueBuilding);assert.deepEqual(resolved.effects,resolved.active.effects||{});assert.equal(restore(serialize(g)).players[0].leaderRulesVersion,2);}
pass('All 25 normalized leaders and 50 registered replacements retain versioned save identities');
for(const [key,spec]of Object.entries(UNIQUE_UNITS)){
 const {g,p,q,c}=field(spec.leader);p.techs=[UNITS[key].tech,'ironwork','horseback','mining','animal','bronze'].filter(Boolean);p.civics=[UNITS[key].civic].filter(Boolean);
 const plots=neighbors(g.map,g.map.tiles[c.tile]);Object.assign(plots[0],{resource:'iron',improvement:'mine'});Object.assign(plots[1],{resource:'horses',improvement:'pasture'});if(UNITS[key].domain==='sea')plots[2].terrain='coast';
 assert(buildable(g,p,c,key),key+' should build for its owner');assert(!buildable(g,q,c,key),key+' must remain exclusive');assert(!buildable(g,p,c,spec.replaces),key+' should replace the base');
 const u=addUnit(g,p.id,key,c.tile);assert(restore(serialize(g)).units.some(v=>v.type===key));assert.equal(baseItem(key),spec.replaces);
 c.production={item:spec.replaces,progress:10};assert(buildable(g,p,c,spec.replaces),'Grandfathered queued base '+spec.replaces);
 for(const predecessor of Object.keys(UNITS))if(successorsFor({...p,leaderRulesVersion:1},predecessor).includes(spec.replaces))assert(successorsFor(p,predecessor).includes(key));
}
pass('All 25 unique units enforce owner eligibility, inherited resources, scoped upgrade entrances and existing queues');
for(const [key,spec]of Object.entries(UNIQUE_UNITS)){
 const {g,p,c}=field(spec.leader),u=UNITS[key];p.techs=[u.tech,'ironwork','horseback','mining','animal','bronze'].filter(Boolean);p.civics=[u.civic].filter(Boolean);
 const plots=neighbors(g.map,g.map.tiles[c.tile]);Object.assign(plots[0],{resource:'iron',improvement:'mine'});Object.assign(plots[1],{resource:'horses',improvement:'pasture'});if(u.domain==='sea')plots[2].terrain='coast';
 applyAction(g,p,{type:'produce',city:c.id,item:key});c.production.progress=orderCost(g,c);finishTurn(g,{actions:false});
 const recruit=g.units.find(x=>x.owner===p.id&&x.type===key);assert(recruit,key+' completes through authoritative production');assert(!c.production);
 assert.equal(recruit.level,spec.initialLevel||0);assert.deepEqual(recruit.innateTraits||[],spec.initialTraits||[]);assert.equal(restore(serialize(g)).units.find(x=>x.id===recruit.id).type,key);
}
pass('All 25 unique units complete authoritative production with their actual starting level, traits and saved identity');
for(const [key,spec]of Object.entries(UNIQUE_BUILDINGS)){
 const {g,p,q,c}=field(spec.leader);const b=BUILDINGS[key];p.techs=[b.tech].filter(Boolean);p.civics=[b.civic].filter(Boolean);c.buildings=b.building?[b.building]:[];
 const target=neighbors(g.map,g.map.tiles[c.tile]).find(t=>!t.cityId);assert(buildable(g,p,c,key,b.kind==='district'?target.id:undefined),key+' must build');assert(!buildable(g,q,c,key,target.id));
 c.buildings.push(key);assert(hasBuilding(c,spec.replaces));assert(!buildable(g,p,c,key,target.id),'No duplicate unique '+key);assert(!buildable(g,p,c,spec.replaces,target.id),'No base/unique stacking '+key);
}
pass('All 25 structures inherit placement, satisfy base prerequisites and prevent duplicate stacking');
for(const [key,spec]of Object.entries(UNIQUE_BUILDINGS)){
 const {g,p,c}=field(spec.leader),b=BUILDINGS[key];p.techs=[b.tech].filter(Boolean);p.civics=[b.civic].filter(Boolean);c.buildings=b.building?[b.building]:[];
 const target=neighbors(g.map,g.map.tiles[c.tile]).find(t=>t.cityId===null);applyAction(g,p,{type:'produce',city:c.id,item:key,...(b.kind==='district'?{tile:target.id}:{})});c.production.progress=orderCost(g,c);finishTurn(g,{actions:false});
 assert(c.buildings.includes(key),key+' completes through authoritative production');assert(hasBuilding(c,spec.replaces));
 let foundation=key;while(BUILDINGS[foundation]?.building)foundation=BUILDINGS[foundation].building;
 assert(operationalBuilding(g,c,key));
 if(BUILDINGS[foundation]?.kind==='district'){
  if(b.kind!=='district'){c.districts.push({item:foundation,tile:target.id});target.district={item:foundation,city:c.id,kind:'district'};}
  target.pillaged=true;assert(!operationalBuilding(g,c,key),key+' disables after its foundation is pillaged');target.pillaged=false;assert(operationalBuilding(g,c,key));
 }
 assert(restore(serialize(g)).cities.find(x=>x.id===c.id).buildings.includes(key));
}
pass('All 25 structures complete production and preserve saves; district-based structures disable/recover with actual foundation pillage');
{
 const {g,p,c}=field('elizabeth');assert.equal(UNITS.sea_dog.moves,5);assert.equal(UNITS.sea_dog.strength,UNITS.frigate.strength+2);assert.equal(UNITS.sea_dog.ranged,UNITS.frigate.ranged+2);assert(!UNITS.sea_dog.canCapture&&!UNITS.sea_dog.periodHeal&&!UNITS.sea_dog.homeKillGold);
 const {g:h,p:r,c:d}=field('shaka');const cost=unitUpkeep('zulu_impi',r),base=unitUpkeep('pikeman',{policies:[]});assert(cost.total+1e-9>=base.total*.4);r.policies=['conscription'];assert(unitUpkeep('zulu_impi',r).total>=base.total*.2-.02);
 pass('Sea Dog adds only modest hull combat and movement; stacked Zulu discounts preserve an upkeep floor');
}
{
 const {g,p,c,enemy}=field('tokugawa');c.population=1;enemy.population=30;const pressure={own:1,foreign:30,foreignOwner:1,foreignPressures:[],source:null};const y=cityYields(g,c),before=loyaltyStatus(g,c,y,pressure);addUnit(g,0,'warrior',c.tile);const after=loyaltyStatus(g,c,y,pressure);assert(after.population<0&&after.population>before.population);
 p.leaderKey='alexander';p.warWeariness=60;const cityState=loyaltyStatus(g,c,y,pressure);p.warWeariness=0;assert.equal(loyaltyStatus(g,c,y,pressure).domestic,cityState.domestic);p.warWeariness=60;assert.equal(p.warWeariness,60);
 const near=addUnit(g,0,'warrior',c.tile),far=addUnit(g,0,'warrior',enemy.tile);near.hp=far.hp=40;conquestEffects(g,p,c);assert.equal(near.hp,52);assert.equal(far.hp,40);
 pass('Tokugawa reduces pressure conditionally without immunity; Alexander retains diplomatic weariness and heals locally');
}
{
 const {g,p,c}=field('saladin');const rider=addUnit(g,0,'horseman',c.tile),foot=addUnit(g,0,'warrior',c.tile),doctor=addUnit(g,0,'herbalist',c.tile);for(const u of g.units)u.hp=40;
 applyAction(g,p,{type:'leaderAbility'});assert.equal(rider.hp,52);assert.equal(doctor.hp,52);assert.equal(foot.hp,40);
 p.leaderKey='wu-zetian';p.leaderAbility=null;c.loyalty=50;applyAction(g,p,{type:'leaderAbility'});assert.equal(c.loyalty,60);
 pass('Instant effects obey troop-class scopes and standalone city loyalty rewards execute');
}
{
 const {g,p,c}=field('caesar');p.techs=['masonry','ironwork'];const tile=neighbors(g.map,g.map.tiles[c.tile])[0],legion=addUnit(g,0,'roman_legion',tile.id);assert(fieldActions(g,p,legion).some(a=>a.type==='buildFort'));applyAction(g,p,{type:'buildFort',unit:legion.id});assert(tile.fort);assert.equal(legion.charges,0);assert(g.units.includes(legion));
 const wall={hp:200,walls:100,wallLevel:1,buildings:['walls']};assert.equal(cityAttackDamage('qin_crossbow',wall,40,p,{wallSpecialty:false}).wallDamage,1);assert(cityAttackDamage('qin_crossbow',wall,40,p,{wallSpecialty:true}).wallDamage>1);wall.wallLevel=2;wall.buildings=['walls','medievalwalls'];assert.equal(cityAttackDamage('qin_crossbow',wall,40,p,{wallSpecialty:true}).wallDamage,1);
 pass('Roman engineering consumes a charge without deleting troops; Qin weak wall damage is contextual and ancient-only');
}
{
 const {g,p,c}=field('mansa-musa');const raw=purchaseCost(g,'warrior');assert(purchaseCost(g,'warrior',p,c)<raw);const withoutMarket=purchaseCost(g,'warrior',p,c);c.buildings=['commercial','suguba_market'];assert(purchaseCost(g,'warrior',p,c)<raw*.8);
 const marketTile=neighbors(g.map,g.map.tiles[c.tile])[0];c.districts.push({item:'commercial',tile:marketTile.id});marketTile.district={item:'commercial',city:c.id,kind:'district'};marketTile.pillaged=true;assert.equal(purchaseCost(g,'warrior',p,c),withoutMarket);marketTile.pillaged=false;assert(purchaseCost(g,'warrior',p,c)<withoutMarket);
 const {g:h,p:q,c:d}=field('cyrus');const soldier=addUnit(h,0,'warrior',d.tile);applyAction(h,q,{type:'leaderAbility'});assert.equal(unitMovement(soldier,q,0),3);assert.equal(unitMovement(soldier,q,140),2);
 pass('Funding discounts affect authoritative quotes and timed movement bonuses expire');
}
{
 const {g,p,c}=field('qin',1);assert.equal(leaderFor(p).passive.effects.chopMultiplier,undefined);assert(!buildable(g,p,c,'qin_crossbow'));const raw=JSON.parse(serialize(g));delete raw.settings.leaderRulesVersion;for(const player of raw.players)delete player.leaderRulesVersion;const old=restore(JSON.stringify(raw));assert.equal(old.settings.leaderRulesVersion,1);assert.equal(old.players[0].leaderRulesVersion,1);
 const bad=JSON.parse(serialize(g));bad.settings.leaderRulesVersion=9;assert.throws(()=>restore(JSON.stringify(bad)));
 pass('Legacy saves remain version 1 and malformed rule versions fail restoration');
}
{
 for(const initiator of ['keshig','builder']){
  const {g,p,c}=field('genghis');p.manual=true;
  const rider=addUnit(g,0,'keshig',c.tile),builder=addUnit(g,0,'builder',c.tile);
  applyAction(g,p,{type:'linkUnits',unit:rider.id,targetUnit:builder.id});
  const sim=new RealtimeSimulation(g);sim.ready();const actor=initiator==='keshig'?rider:builder;
  assert.equal(movementAllowance(g,builder),movementAllowance(g,rider));
  const move=reachable(g,p,actor,true).find(m=>m.path.length===UNITS.keshig.moves+1);assert(move,'Full escort route from '+initiator);
  sim.enqueue(p,[{type:'move',unit:actor.id,tile:move.tile}],{manual:true});sim.play();sim.tick(.2);assert(rider.activity&&builder.activity);
  const copy=restore(serialize(g)),resumed=new RealtimeSimulation(copy);resumed.play();sim.tick(15);resumed.tick(15);
  assert.equal(rider.tile,move.tile);assert.equal(builder.tile,move.tile);
  assert.equal(copy.units.find(u=>u.id===builder.id).tile,move.tile);assert.equal(resumed.stats.rejected,0);assert.equal(sim.stats.rejected,0);
  delete rider.linkedUnit;delete builder.linkedUnit;sim.tick(20);sim.ready();assert.equal(movementAllowance(g,builder),UNITS.builder.moves);
  assert(reachable(g,p,builder,true).every(m=>m.path.length<=UNITS.builder.moves+1));
  const envoy=addUnit(g,0,'envoy',rider.tile);assert(!canLinkUnits(g,rider,envoy));sim.dispose();resumed.dispose();
 }
 pass('Keshig escorts move from either member, resume timed routes, lose shared speed after unlink and exclude envoys');
}
{
 for(const [key,spec]of Object.entries(UNIQUE_UNITS)){
  const {g,p,q,enemy}=field(spec.leader);q.leaderKey=spec.leader;const nearby=neighbors(g.map,g.map.tiles[enemy.tile]),defender=addUnit(g,q.id,key,nearby[0].id);
  p.visible=[defender.tile];const before=uniqueCombatBonus(g,defender,true,null,p.id,!!UNITS[key].ranged);
  enemy.buildings.push('campus','holy');enemy.religion=q.id;g.wonders.oracle={city:enemy.id,tile:enemy.tile};
  for(const type of ['warrior','catapult','ptolemaic_flagship','maurya_war_elephant'])addUnit(g,q.id,type,nearby[1].id);
  assert.equal(uniqueCombatBonus(g,defender,true,null,p.id,!!UNITS[key].ranged),before,key+' must not expose hidden support or city infrastructure through combat previews');
 }
 const {g,p,enemy}=field('suleiman');enemy.buildings=['walls','medievalwalls'];enemy.walls=100;
 assert(siegeMatchesWall('catapult',enemy,p));p.leaderRulesVersion=1;assert(!siegeMatchesWall('catapult',enemy,p));
 pass('All 25 visible enemy unit bonuses ignore hidden support/infrastructure; Suleiman wall-tier flexibility remains versioned');
}
{
 for(const mode of ['queued','active']){
  const {g,p,c}=field('han-wudi');p.techs=Object.keys(TECHS);p.manual=true;Object.assign(neighbors(g.map,g.map.tiles[c.tile])[0],{resource:'horses',improvement:'pasture'});const rider=addUnit(g,p.id,'han_cavalry',c.tile),option=unitUpgradeOptions(g,p,rider).find(o=>o.available);assert(option);
  assert(option.goldCost<unitUpgradeCost(g,rider.type,option.item));assert.equal(option.goldCost,unitUpgradeCost(g,rider.type,option.item,p));
  const sim=new RealtimeSimulation(g);if(mode==='queued')rider.cooldownUntil=10;sim.ready();sim.enqueue(p,[{type:'upgrade',unit:rider.id,item:option.item,expectedCost:option.goldCost}],{manual:true});if(mode==='active')sim.tick(.05);
  assert.equal(observation(g,p).player.committedGold,option.goldCost,mode+' reserves the same discounted amount as its authoritative quote');
  const gold=p.gold;sim.play();sim.tick(15);assert.equal(rider.type,option.item);assert.equal(p.gold,gold-option.goldCost);assert.equal(observation(g,p).player.committedGold,0);sim.dispose();
 }
 pass('Queued and active cavalry refits reserve and charge the exact discounted quote once');
}
const sourceFiles=[...fs.readdirSync('src').filter(f=>f.endsWith('.mjs')).map(f=>'src/'+f),'web/visuals.js','web/unit-combat.js','sdk/civ.hpp','scripts/leader-rework-check.mjs'];
const sources=Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.mkdirSync('output/leader-rework-20261012',{recursive:true});fs.writeFileSync('output/leader-rework-20261012/focused.json',JSON.stringify({passed:true,checks:report,sources,scope:'Headless versioned rules and all replacement eligibility; artwork/native/release evidence separate'},null,2));
