import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as H from '../src/heritage.mjs';
import {HERITAGE_DESIGN as design} from '../src/heritage-data.mjs';
import {indexMap,neighbors,tilesInRange} from '../src/world.mjs';
import {beginWar} from '../src/warfare.mjs';
const checks=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(){const g=E.createGame({players:2,size:'small',seed:'HERITAGE-CHECK',barbarians:false});g.units=[];g.cities=[];g.cityStates.states=[];g.map=indexMap({width:24,height:18,wrapX:false,roadRules:1,tiles:Array.from({length:432},(_,id)=>({id,col:id%24,row:Math.floor(id/24),q:id%24-Math.floor(Math.floor(id/24)/2),r:Math.floor(id/24),terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[]}))});for(const p of g.players){p.gold=10000;p.faith=10000;p.techs=Object.keys(R.TECHS);p.civics=Object.keys(R.CIVICS);p.manual=true;E.foundCity(g,p,E.addUnit(g,p.id,'settler',p.id?230:125));}g.units=[];E.refreshVisibility(g);return {g,p:g.players[0],q:g.players[1],c:g.cities[0],d:g.cities[1]};}
function building(g,c,key){if(c.buildings.includes(key))return;c.buildings.push(key);if(R.BUILDINGS[key]?.kind==='district'){const tile=neighbors(g.map,g.map.tiles[c.tile]).find(t=>!t.district&&t.cityId===null);tile.owner=c.owner;tile.district={item:key,city:c.id,kind:'district'};c.districts.push({item:key,tile:tile.id});}}
function selectCandidate(g,key){const target=H.GREAT_PEOPLE.find(p=>p.key===key);g.heritage.skipped=[...new Set([...g.heritage.skipped,...H.GREAT_PEOPLE.slice(0,H.GREAT_PEOPLE.indexOf(target)).filter(p=>p.classKey===target.classKey).map(p=>p.key)])];}
function ready(u){u.acted=false;u.moves=3;delete u.activity;}
{
 assert.equal(H.HERITAGE_WONDERS.length,design.statistics.wondersCount);assert.equal(H.GREAT_PEOPLE.length,design.statistics.greatPeopleCount);assert.equal(H.GREAT_PERSON_CLASSES.length,9);assert.equal(Object.keys(R.WONDERS).length,H.HERITAGE_WONDERS.length);assert.equal(new Set(H.GREAT_PEOPLE.map(p=>p.key)).size,H.GREAT_PEOPLE.length);
 for(const w of H.HERITAGE_WONDERS){assert(!w.tech||R.TECHS[w.tech],w.key);assert(!w.civic||R.CIVICS[w.civic],w.key);assert.equal(w.footprintHexes,1);}
 for(const person of H.GREAT_PEOPLE)assert(design.recipeRegistry[person.recipeType],person.key);
 pass('Canonical '+H.HERITAGE_WONDERS.length+'/'+H.GREAT_PEOPLE.length+'/9 catalogue, global uniqueness and executable recipe references');
}
{
 const {g,p,c}=field();building(g,c,'campus');building(g,c,'library');assert.equal(H.greatPersonRate(g,p,'scientist'),2);g.map.tiles[c.districts[0].tile].pillaged=true;assert.equal(H.greatPersonRate(g,p,'scientist'),0);g.map.tiles[c.districts[0].tile].pillaged=false;
 selectCandidate(g,'zhang_heng');H.heritagePeriod(g);assert.equal(p.greatPeople.points.scientist,2);const person=H.greatPersonCandidate(g,'scientist');assert.equal(person.key,'zhang_heng');p.greatPeople.points.scientist=140;E.applyAction(g,p,{type:'recruitGreatPerson',item:person.key});assert.equal(p.greatPeople.points.scientist,20);assert.equal(g.units.filter(u=>u.greatPerson===person.key).length,1);assert.throws(()=>E.applyAction(g,p,{type:'recruitGreatPerson',item:person.key}));
 const u=g.units.find(u=>u.greatPerson===person.key);u.tile=c.tile;const actions=E.legalActions(g,p).filter(a=>a.type==='activateGreatPerson'&&a.unit===u.id);assert(actions.length);const before=E.cityYields(g,c).science;E.applyAction(g,p,actions[0]);assert(p.boosts.includes('engineering'));assert(E.cityYields(g,c).science>before);assert(!g.units.includes(u));assert.throws(()=>E.applyAction(g,p,actions[0]));
 pass('Operational replacement-aware points, recruit once, surplus, legal activation, actual science and retirement');
}
{
 const {g,p,c}=field();g.settings.gameSpeed='marathon';selectCandidate(g,'zhang_heng');const terms=H.recruitmentTerms(g,p,'zhang_heng');assert.equal(terms.threshold,360);assert.equal(terms.gold,1620);const gold=p.gold;E.applyAction(g,p,{type:'patronizeGreatPerson',item:'zhang_heng',currency:'gold'});assert.equal(p.gold,gold-1620);assert.equal(H.greatPersonCandidate(g,'scientist').key,'hypatia');
 pass('Patronage scales threshold once and advances the shared global candidate');
}
{
 const {g,p,c}=field();const spec=H.GREAT_PEOPLE.find(p=>p.key==='homer'),u=E.addUnit(g,0,'great_person',c.tile);u.greatPerson=spec.key;u.charges=2;u.activations=0;p.greatPeople.owned.push({key:spec.key,unit:u.id});g.heritage.recruited[spec.key]={owner:0,turn:1};E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id});assert.equal(g.heritage.works.length,1);assert.equal(u.charges,1);ready(u);const before=E.serialize(g);assert.throws(()=>E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id}));assert.equal(E.serialize(g),before);building(g,c,'theater');building(g,c,'amphitheater');const slot=H.workSlots(g,c).find(s=>s.type==='writing');const w=g.heritage.works[0];E.applyAction(g,p,{type:'moveGreatWork',work:w.id,slot:slot.id});assert.equal(H.greatWorkYields(g,c).culture||0,0);g.turn++;H.heritagePeriod(g);assert.equal(H.greatWorkYields(g,c).culture,2);E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id});assert.equal(H.greatWorkYields(g,c).culture,4);g.map.tiles[c.districts.find(d=>d.item==='theater').tile].pillaged=true;assert.equal(H.greatWorkYields(g,c).culture||0,2);
 pass('Great Works require real slots, rejected activation is atomic, timed transfer and pillage stop actual yields');
}
{
 const {g,p,c}=field();const legacy=JSON.parse(E.serialize(g));delete legacy.heritage;for(const p of legacy.players)delete p.greatPeople;legacy.settings.leaderRulesVersion=1;legacy.players.forEach(p=>p.leaderRulesVersion=1);const restored=E.restore(JSON.stringify(legacy));assert.equal(restored.heritage.version,1);assert.equal(restored.players[0].leaderRulesVersion,1);const round=E.restore(E.serialize(restored));assert.equal(round.players[0].leaderRulesVersion,1);const view=E.snapshot(g,1);assert.equal(view.players[0].greatPeople,undefined);assert.equal(view.greatPeople.catalogue.length,H.GREAT_PEOPLE.length);const invalid=JSON.parse(E.serialize(g));invalid.players[0].greatPeople.points.scientist=-1;assert.throws(()=>E.restore(JSON.stringify(invalid)));
 pass('Independent feature migration preserves leader rules and hides opposing recruitment balances');
}
{
 const activated=[];
 for(const person of H.GREAT_PEOPLE){const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]);for(const t of tilesInRange(g.map,g.map.tiles[c.tile],3)){t.owner=0;t.territoryCity=c.id;}ring[0].terrain=ring[1].terrain='coast';const free=tilesInRange(g.map,g.map.tiles[c.tile],3).filter(t=>t.id!==c.tile&&t.owner===0);c.buildings=Object.keys(R.BUILDINGS).filter(k=>!R.BUILDINGS[k].leader);c.districts=[];for(const key of c.buildings.filter(k=>R.BUILDINGS[k].kind==='district')){const t=free.shift();t.district={item:key,city:c.id,kind:'district'};c.districts.push({item:key,tile:t.id});}c.production={item:'pyramids',tile:free[0].id,cost:100000,progress:0};const u=E.addUnit(g,0,person.classKey==='admiral'?'great_admiral':'great_person',person.classKey==='admiral'?ring[0].id:c.tile);u.greatPerson=person.key;u.charges=person.charges;u.activations=0;p.greatPeople.owned.push({key:person.key,unit:u.id});g.heritage.recruited[person.key]={owner:0,turn:g.turn};const target=E.addUnit(g,0,person.classKey==='admiral'?(person.targetRequirement==='naval_submarine_or_destroyer'?'nuclearsubmarine':person.targetRequirement==='naval_ironclad_or_cruiser'?'destroyer':'aircraftcarrier'):person.targetRequirement.includes('cavalry')?'knight':person.targetRequirement.includes('siege')||person.targetRequirement.includes('artillery')?'artillery':'warrior',person.classKey==='admiral'?ring[1].id:ring[2].id);target.hp=40;
  for(let i=0;i<person.charges;i++){ready(u);E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id,targetUnit:target.id,religion:'wisdom'});assert.equal(u.charges,person.charges-i-1,person.key);}
  assert(!g.units.includes(u),person.key);assert(p.greatPeople.retired.some(v=>v.key===person.key),person.key);
  if(person.recipeParams.workType)assert.equal(g.heritage.works.length,person.recipeParams.works.length,person.key);
  if(person.recipeParams.instantGold)assert(p.gold>=10000+person.recipeParams.instantGold,person.key);
  if(person.recipeParams.cityPermanentScience)assert(H.heritageEffects(g,c).science>=person.recipeParams.cityPermanentScience,person.key);
  if(person.recipeParams.targetUnitCombatBonus)assert(H.heritageEffects(g,target).combat>=person.recipeParams.targetUnitCombatBonus,person.key);
  E.restore(E.serialize(g));activated.push(person.key);
 }
 assert.equal(new Set(activated).size,H.GREAT_PEOPLE.length);pass('All '+H.GREAT_PEOPLE.length+' people execute every charge through authoritative actions, retire once and round-trip their resulting state');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]),general=E.addUnit(g,0,'great_person',c.tile),gun=E.addUnit(g,0,'artillery',ring[0].id),rocket=E.addUnit(g,0,'rocketartillery',ring[1].id);general.greatPerson='napoleon_bonaparte';general.charges=1;general.activations=0;assert.equal(H.heritageRangeBonus(g,gun),1);assert.equal(H.heritageRangeBonus(g,rocket),0);g.players[1].visible=[];assert.equal(H.heritageCombatBonus(g,gun,false,null,1),0);g.players[1].visible=[general.tile];assert.equal(H.heritageCombatBonus(g,gun,false,null,1),5);
 const ship=E.addUnit(g,0,'frigate',ring[2].id);ship.heritageEffects={nelson:{shieldSeconds:3}};const before=ship.hp;assert.equal(H.heritageDamage(g,ship,999,gun),before-1);assert.equal(ship.hp,1);assert.equal(H.heritageDamage(g,ship,999,gun),0);assert.deepEqual(E.attackTargets(g,p,ship),[]);g.turn++;H.heritageDamage(g,ship,999,gun);assert(ship.hp<=0);
 pass('Aura era/domain/fog restrictions hold; Napoleon does not extend era-6 rockets; Nelson shield triggers exactly once');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]);ring[0].terrain='desert';ring[0].hill=false;ring[0].owner=0;ring[0].district=null;g.wonders.petra={item:'petra',owner:0,city:c.id,tile:ring[1].id,birthGranted:true};c.buildings.push('petra');const a=E.cityYields(g,c),b=E.cityYields(g,c);assert.deepEqual(a,b);assert(c.worked.includes(ring[0].id));g.map.tiles[ring[1].id].pillaged=true;const reduced=E.cityYields(g,c);assert.deepEqual(reduced,a);assert.throws(()=>E.applyAction(g,p,{type:'repairWonder',city:c.id,item:'petra'}));const restored=E.restore(E.serialize(g));assert.equal(restored.map.tiles[ring[1].id].pillaged,false);assert.equal(c.production,null);assert.equal(g.wonders.petra.birthGranted,true);
 pass('Petra keeps its deterministic citizen yields despite obsolete damage flags and rejects repair orders');
}
{
 for(const wonder of H.HERITAGE_WONDERS){const {g,p,c}=field(),site=neighbors(g.map,g.map.tiles[c.tile])[0],r=wonder.placement;Object.assign(site,{owner:0,territoryCity:c.id,terrain:r.validTerrains[0],hill:!!r.hill,river:!!r.requiresRiver});const adj=neighbors(g.map,site).filter(t=>t.cityId===null&&t.id!==site.id);for(const t of adj)t.owner=0;
  if(r.requiresAdjacentDistrict){const t=adj.shift(),key=r.requiresAdjacentDistrict;Object.assign(t,{terrain:key==='harbor'?'coast':'grass',district:{item:key,city:c.id,kind:'district'}});c.buildings.push(key);c.districts.push({item:key,tile:t.id});let parent=r.requiresDistrictBuilding;while(parent){if(!c.buildings.includes(parent))c.buildings.push(parent);parent=R.BUILDINGS[parent]?.building;}}
  if(r.requiresDistrictBuilding&&!r.requiresAdjacentDistrict){let parent=r.requiresDistrictBuilding;while(parent){if(!c.buildings.includes(parent))c.buildings.push(parent);if(R.BUILDINGS[parent]?.kind==='district'){const t=adj.shift();Object.assign(t,{terrain:parent==='harbor'?'coast':'grass',district:{item:parent,city:c.id,kind:'district'}});c.districts.push({item:parent,tile:t.id});}parent=R.BUILDINGS[parent]?.building;}}
  if(r.requiresAdjacentFeature){const t=adj.shift();if(r.requiresAdjacentFeature==='mountain')t.terrain='mountain';else t.feature=r.requiresAdjacentFeature;}
  if(r.requiresAdjacentResource)adj.shift().resource=r.requiresAdjacentResource;
  if(r.requiresAdjacentAny?.length){const condition=r.requiresAdjacentAny[0],t=adj.shift();if(condition.type==='feature')t.terrain=condition.key;else{t.district={item:condition.key,city:c.id,kind:'district'};c.districts.push({item:condition.key,tile:t.id});c.buildings.push(condition.key);}}
  if(r.requiresWaterTransit&&wonder.key==='panama_canal')for(const t of adj.slice(0,2))t.terrain='coast';
  assert(E.buildable(g,p,c,wonder.key,site.id),wonder.key+' valid placement');const originalOwner=site.owner;site.owner=1;assert(!E.buildable(g,p,c,wonder.key,site.id),wonder.key+' rejects foreign land');site.owner=originalOwner;
  E.applyAction(g,p,{type:'produce',city:c.id,item:wonder.key,tile:site.id});c.production.progress=c.production.cost;E.finishTurn(g,{actions:false});assert.equal(g.wonders[wonder.key]?.city,c.id,wonder.key+' construction');assert.equal(g.wonders[wonder.key]?.birthGranted,true);assert(!E.buildable(g,p,c,wonder.key,site.id));const after=E.serialize(g);H.heritageCompleted(g,p,c,wonder.key,{});assert.equal(E.serialize(g),after,wonder.key+' birth idempotency');site.pillaged=true;assert(H.operationalWonder(g,wonder.key,0));assert(!E.legalActions(g,p).some(a=>a.type==='repairWonder'));assert.throws(()=>E.applyAction(g,p,{type:'repairWonder',city:c.id,item:wonder.key}));const restored=E.restore(E.serialize(g));assert(H.operationalWonder(restored,wonder.key,0),wonder.key+' permanent completion');assert.equal(restored.map.tiles[site.id].pillaged,false);
 }
 pass('All '+H.HERITAGE_WONDERS.length+' wonders pass valid/foreign placement, real construction, once-only birth, permanent completion, rejected repairs and save restoration');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]);ring[0].terrain=ring[1].terrain='coast';ring[0].owner=ring[1].owner=0;p.techs=['sailing'];p.civics=[];g.wonders.venetian_arsenal={item:'venetian_arsenal',owner:0,city:c.id,tile:ring[2].id,birthGranted:true};E.applyAction(g,p,{type:'produce',city:c.id,item:'galley'});c.production.progress=c.production.cost;E.finishTurn(g,{actions:false});assert.equal(g.units.filter(u=>u.type==='galley').length,2);assert.equal(g.heritage.pendingGrants?.length||0,0);E.finishTurn(g,{actions:false});assert.equal(g.units.filter(u=>u.type==='galley').length,2);assert.equal(g.units.filter(u=>u.isDuplicated).length,1);assert.equal(g.heritage.pendingGrants.length,0);E.finishTurn(g,{actions:false});assert.equal(g.units.filter(u=>u.type==='galley').length,2);
 pass('Venetian Arsenal delivers one bounded, marked naval copy with normal upkeep and never recursively duplicates it');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]);ring[0].terrain=ring[1].terrain='coast';ring[0].owner=ring[1].owner=0;p.techs=['sailing'];p.civics=[];const guard=E.addUnit(g,0,'galley',ring[0].id);g.wonders.venetian_arsenal={item:'venetian_arsenal',owner:0,city:c.id,tile:ring[2].id,birthGranted:true};E.applyAction(g,p,{type:'produce',city:c.id,item:'galley'});c.production.progress=c.production.cost;E.finishTurn(g,{actions:false});assert.equal(g.heritage.pendingGrants.length,1);assert.equal(g.units.filter(u=>u.type==='galley').length,2);E.restore(E.serialize(g));guard.tile=400;g.map.tiles[400].terrain='coast';E.finishTurn(g,{actions:false});assert.equal(g.heritage.pendingGrants.length,0);assert.equal(g.units.filter(u=>u.type==='galley').length,3);assert.equal(g.units.filter(u=>u.isDuplicated).length,1);
 pass('A blocked Arsenal gift waits without duplication, round-trips its pending grant and arrives exactly once after a launch tile opens');
}
{
 const {g,p}=field();p.techs=['pottery'];p.research='writing';p.researchProgress={};p.heritageScienceReserve=5000;E.finishTurn(g,{actions:false});assert(p.techs.includes('writing'));assert(p.heritageScienceReserve>4500&&p.heritageScienceReserve<5000);const reserve=p.heritageScienceReserve;E.restore(E.serialize(g));E.finishTurn(g,{actions:false});assert.equal(p.heritageScienceReserve,reserve);
 pass('Large gifted research reserves pay the real technology cost and retain unused credit rather than losing it to the ordinary overflow cap');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]),u=E.addUnit(g,0,'great_person',c.tile),a=E.addUnit(g,0,'warrior',ring[0].id),b=E.addUnit(g,0,'warrior',ring[1].id);Object.assign(u,{greatPerson:'scipio_africanus',charges:1,activations:0});a.hp=b.hp=40;E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id,targetUnit:a.id});assert.equal(a.hp,70);assert.equal(b.hp,70);assert.equal(H.heritageMovementBonus(g,a),1);assert.equal(H.heritageMovementBonus(g,b),1);assert.equal(H.heritageEffects(g,p).barracksInitialXp,undefined);g.turn+=4;assert.equal(H.heritageMovementBonus(g,a),0);assert.equal(H.heritageMovementBonus(g,b),0);
 pass('Scipio affects actual armies within two cells and both speed bonuses expire after exactly four periods');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]);ring[0].terrain=ring[1].terrain='coast';g.map.tiles[350].terrain='coast';const u=E.addUnit(g,0,'great_admiral',ring[0].id),ship=E.addUnit(g,0,'frigate',ring[1].id),far=E.addUnit(g,0,'frigate',350);Object.assign(u,{greatPerson:'david_farragut',charges:1,activations:0});E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id,targetUnit:ship.id});assert.equal(H.heritageEffects(g,far).harborCombat,8);assert.equal(H.heritageMovementBonus(g,far),1);g.turn+=5;assert.equal(H.heritageMovementBonus(g,far),0);assert.equal(H.heritageEffects(g,far).harborCombat,undefined);
 pass('Farragut reaches the whole current navy, including distant ships, and expires after five periods');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]);building(g,c,'barracks');const u=E.addUnit(g,0,'great_person',c.tile),target=E.addUnit(g,0,'warrior',ring[0].id);Object.assign(u,{greatPerson:'sun_tzu',charges:1,activations:0});E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id,targetUnit:target.id});assert.equal(H.heritageEffects(g,p).barracksInitialXp,undefined);assert.equal(H.heritageEffects(g,c).barracksInitialXp,5);assert.equal(H.heritageEffects(g,c).barracksCulture,2);c.owner=1;assert.equal(H.heritageEffects(g,c).barracksInitialXp,5);assert.equal(H.heritageEffects(g,p).barracksCulture,undefined);
 pass('Sun Tzu city training/culture belongs to its physical city, survives capture and never spreads to unrelated cities');
}
{
 const {g,p,c}=field();building(g,c,'industrial');const u=E.addUnit(g,0,'great_person',c.tile);Object.assign(u,{greatPerson:'li_chun',charges:3,activations:0});c.production={item:'research',progress:0,cost:10000,tile:null};E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id});assert.equal(c.production.progress,120);assert.equal(H.heritageEffects(g,c).riverProduction,undefined);ready(u);E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id});assert.equal(H.heritageEffects(g,c).riverProduction,1);ready(u);E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id});assert.equal(H.heritageEffects(g,c).riverProduction,1);assert.equal(H.heritageEffects(g,c).riverGold,1);
 pass('Li Chun executes construction then river infrastructure; an extra charge cannot double the same city effect');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]),u=E.addUnit(g,0,'great_person',c.tile),a=E.addUnit(g,0,'knight',ring[0].id),b=E.addUnit(g,0,'warrior',ring[1].id);assert(R.dist(g.map.tiles[a.tile],g.map.tiles[b.tile],g.map)<=1);Object.assign(u,{greatPerson:'hannibal_barca',charges:1,activations:0});E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id,targetUnit:a.id});assert.equal(H.heritageEffects(g,a).attack,4);assert.equal(H.heritageEffects(g,b).attack,4);assert.equal(H.heritageMovementBonus(g,a),1);g.turn+=6;assert.equal(H.heritageEffects(g,a).attack,undefined);
 pass('Hannibal grants the same six-period burst to the primary unit and adjacent allies without an empty-effect overwrite');
}
{
 const {g,p,c}=field();building(g,c,'campus');const site=neighbors(g.map,g.map.tiles[c.tile]).find(t=>!t.district&&t.cityId===null);Object.assign(site,{owner:0,terrain:'grass',hill:false});assert(!H.validWonderPlacement(g,p,c,'greatlibrary',site));c.production={item:'greatlibrary',tile:site.id,cost:R.productionCost(g,'greatlibrary'),progress:R.productionCost(g,'greatlibrary')};const original=structuredClone(c.production),old=JSON.parse(E.serialize(g));delete old.heritage;for(const p of old.players)delete p.greatPeople;const restored=E.restore(JSON.stringify(old)),city=restored.cities.find(v=>v.id===c.id);assert.deepEqual(city.production,original);E.finishTurn(restored,{actions:false});assert(restored.wonders.greatlibrary);assert.equal(city.production,null);assert.equal(restored.players[0].leaderRulesVersion,p.leaderRulesVersion);
 pass('Old in-progress wonder sites finish under their original placement without changing saved progress or leader rules');
}
{
 const {g,p,q,c}=field(),refuge=E.foundCity(g,p,E.addUnit(g,0,'settler',365)),u=E.addUnit(g,0,'great_person',c.tile);Object.assign(u,{greatPerson:'zhang_heng',charges:1,activations:0});p.greatPeople.owned.push({key:u.greatPerson,unit:u.id});g.heritage.recruited[u.greatPerson]={owner:0,turn:g.turn};p.met=[1];q.met=[0];beginWar(g,q,p,E.event);const attacker=E.addUnit(g,1,'warrior',neighbors(g.map,g.map.tiles[c.tile])[0].id);c.hp=0;c.walls=0;E.refreshVisibility(g);E.applyAction(g,q,{type:'move',unit:attacker.id,tile:c.tile});assert.equal(c.owner,1);assert(g.units.includes(u));assert(R.dist(g.map.tiles[u.tile],g.map.tiles[refuge.tile],g.map)<=2);assert(!p.visible.includes(c.tile));assert(!E.snapshot(g,0).units.some(v=>v.id===attacker.id));attacker.tile=neighbors(g.map,g.map.tiles[refuge.tile])[0].id;ready(attacker);refuge.hp=0;refuge.walls=0;E.refreshVisibility(g);E.applyAction(g,q,{type:'move',unit:attacker.id,tile:refuge.tile});assert(!g.units.includes(u));assert(p.greatPeople.retired.some(v=>v.key==='zhang_heng'&&v.dispersed));E.restore(E.serialize(g));
 pass('Actual city capture evacuates its Great Person without capture/death, refreshes fog and disperses it only after the last city falls');
}
{
 const {g,p,c}=field(),ring=neighbors(g.map,g.map.tiles[c.tile]),target=E.addUnit(g,0,'knight',ring[0].id);
 for(const key of ['bai_qi','li_jing','richard_the_lionheart']){const u=E.addUnit(g,0,'great_person',c.tile);Object.assign(u,{greatPerson:key,charges:1,activations:0});E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id,targetUnit:target.id});}
 assert.equal(H.heritageEffects(g,target).combat,6);assert.equal(H.heritageCombatBonus(g,target,false,null),8);assert.equal(H.heritageCombatBonus(g,target,true,null),6);assert.equal(H.heritageMovementBonus(g,target),1);
 const joan=E.addUnit(g,0,'great_person',c.tile),scipio=E.addUnit(g,0,'great_person',ring[1].id);joan.greatPerson='joan_of_arc';scipio.greatPerson='scipio_africanus';assert.equal(H.heritageCombatBonus(g,target,false,null),8);assert.equal(H.heritageCombatBonus(g,target,true,null),8);assert.equal(H.heritageMovementBonus(g,target),1);g.units=g.units.filter(u=>u!==joan&&u!==scipio);p.heritageEffects={carl_von_clausewitz:{armyCombatBonus:3}};assert.equal(H.heritageCombatBonus(g,target,false,null),8);
 const nap=E.addUnit(g,0,'great_person',c.tile),gustav=E.addUnit(g,0,'great_person',c.tile),gun=E.addUnit(g,0,'artillery',ring[2].id);nap.greatPerson='napoleon_bonaparte';gustav.greatPerson='gustavus_adolphus';assert.equal(H.heritageRangeBonus(g,gun),1);
 ring[3].terrain='coast';const carrier=E.addUnit(g,0,'aircraftcarrier',ring[3].id),admiral=E.addUnit(g,0,'great_admiral',ring[3].id),bomber=E.addUnit(g,0,'bomber',ring[3].id);admiral.greatPerson='chester_nimitz';bomber.carrierId=carrier.id;p.heritageEffects.dwight_eisenhower={airSupportRange:2};assert.equal(H.heritageRangeBonus(g,bomber),2);assert.equal(R.UNITS.rocketartillery.range,4);assert.equal(R.UNITS.antiair.range,4);
 p.heritageEffects.dwight_eisenhower.unitUpkeepDiscount=.2;p.heritageEffects.hayreddin_barbarossa={navalUpkeepDiscount:.15};const discounted=R.unitUpkeep('frigate',p);delete p.heritageEffects.hayreddin_barbarossa;assert.deepEqual(R.unitUpkeep('frigate',p),discounted);p.heritageEffects.dwight_eisenhower.militaryProductionMultiplier=.25;c.heritageEffects={gustavus_adolphus:{militaryProductionMultiplier:.25}};assert.equal(H.heritageProductionMultiplier(g,c,{item:'infantry'}),1.25);
 pass('Actual retirement marks, overlapping auras and empire commander effects take the highest applicable combat/movement/range/production/upkeep bonus; aircraft range is +2 rather than +4');
}
{
 const {g,p,c}=field(),tile=neighbors(g.map,g.map.tiles[c.tile])[0],horse=E.addUnit(g,0,'knight',tile.id),u=E.addUnit(g,0,'great_person',c.tile);Object.assign(u,{greatPerson:'subutai',charges:1,activations:0});E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id,targetUnit:horse.id});assert.equal(H.heritageEffects(g,p).pillageYieldMultiplier,1);g.turn+=6;assert.equal(H.heritageEffects(g,p).pillageYieldMultiplier,undefined);assert.equal(H.heritageCombatBonus(g,horse,false,null),6);assert.equal(H.heritageMovementBonus(g,horse),1);
 pass('Subutai keeps the target cavalry bonus permanently while the nationwide pillage bonus expires after six periods');
}
{
 const {g,p,c}=field();building(g,c,'harbor');building(g,c,'airport');const u=E.addUnit(g,0,'great_admiral',c.tile);Object.assign(u,{greatPerson:'chester_nimitz',charges:1,activations:0});E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:c.id});assert.equal(H.heritageEffects(g,c).carrierBomberDamageMultiplier,.25);assert.equal(g.units.filter(u=>u.type==='fighter').length,1);const tile=c.districts.find(d=>d.item==='airport').tile,bomber=E.addUnit(g,0,'bomber',tile),victim=E.addUnit(g,1,'infantry',230);assert.equal(H.heritageDamage(g,victim,40,bomber),50);
 const withoutBase=field(),v=E.addUnit(withoutBase.g,0,'great_admiral',withoutBase.c.tile);Object.assign(v,{greatPerson:'chester_nimitz',charges:1,activations:0});assert.throws(()=>E.applyAction(withoutBase.g,withoutBase.p,{type:'activateGreatPerson',unit:v.id,city:withoutBase.c.id}));assert.equal(v.charges,1);
 pass('Nimitz can activate at an operational naval/air base, grants a real fighter and increases actual base bomber damage; missing bases reject atomically');
}
{
 const {g,p,c}=field(),site=neighbors(g.map,g.map.tiles[c.tile])[0];g.wonders.statue_of_liberty={item:'statue_of_liberty',owner:0,city:c.id,tile:site.id,birthGranted:true};c.loyalty=4;assert.equal(H.heritageLoyaltyFloor(g,c),100);site.pillaged=true;assert.equal(H.heritageLoyaltyFloor(g,c),100);delete g.wonders.statue_of_liberty;g.wonders.mount_rushmore={item:'mount_rushmore',owner:0,city:c.id,tile:c.tile,birthGranted:true};p.relations[1].status='war';p.relations[1].aggressor=1;assert.equal(H.heritageLoyaltyFloor(g,c),1);p.relations[1].aggressor=0;assert.equal(H.heritageLoyaltyFloor(g,c),0);
 pass('Liberty locks loyalty at 100 while operational; Rushmore prevents revolt only during a defensive war and preserves low-loyalty penalties');
}
{
 const {g,p,c}=field(),tile=neighbors(g.map,g.map.tiles[c.tile])[0];p.visible=[];p.explored.push(tile.id);p.knownTiles[tile.id]=structuredClone(tile);g.wonders.pyramids={item:'pyramids',owner:1,city:c.id,tile:tile.id,birthGranted:true};tile.district={kind:'wonder',item:'pyramids',city:c.id};assert.equal(E.snapshot(g,0).wonders.pyramids,undefined);p.knownTiles[tile.id].district={...tile.district};p.knownTiles[tile.id].owner=0;assert.equal(E.snapshot(g,0).wonders.pyramids.owner,0);
 pass('Previously explored fog reveals neither newly built wonders nor a hidden ownership change');
}
{
 const baseline=JSON.parse(await readFile(new URL('../output/wonders-great-people-20261015/expanded-v2.0.3.json',import.meta.url),'utf8')),original=new Set(baseline.wonders.map(w=>w.key));
 for(const wonder of H.HERITAGE_WONDERS.filter(w=>!original.has(w.key))){const {g,p,c}=field(),site=neighbors(g.map,g.map.tiles[c.tile])[0],before=Object.fromEntries(H.GREAT_PERSON_CLASSES.map(cls=>[cls.key,H.greatPersonRate(g,p,cls.key)]));g.wonders[wonder.key]={item:wonder.key,owner:p.id,city:c.id,tile:site.id,birthGranted:true};c.buildings.push(wonder.key);
  for(const cls of H.GREAT_PERSON_CLASSES){const field='great'+cls.key[0].toUpperCase()+cls.key.slice(1)+'Points';assert.equal(H.greatPersonRate(g,p,cls.key)-before[cls.key],wonder.passiveEffects[field]||0,wonder.key+' '+cls.key+' points');}
  for(const [kind,type]of [['Writing','writing'],['Art','art'],['Music','music'],['Relic','relic']])assert.equal(H.workSlots(g,c).filter(s=>s.host===wonder.key&&s.type===type&&s.active).length,wonder.passiveEffects['greatWork'+kind+'Slots']||0,wonder.key+' '+type+' slots');
  site.pillaged=true;for(const cls of H.GREAT_PERSON_CLASSES){const field='great'+cls.key[0].toUpperCase()+cls.key.slice(1)+'Points';assert.equal(H.greatPersonRate(g,p,cls.key),before[cls.key]+(wonder.passiveEffects[field]||0));}assert(H.workSlots(g,c).filter(s=>s.host===wonder.key).every(s=>s.active));
 }
 pass('Every new wonder grants its exact declared Great Person points and Great Work slots once; legacy damage cannot disable either');
}
{
 const {g,p,c}=field();building(g,c,'holy');building(g,c,'shrine');building(g,c,'temple');const site=neighbors(g.map,g.map.tiles[c.tile]).find(t=>!t.district);g.wonders.saint_basil={item:'saint_basil',owner:p.id,city:c.id,tile:site.id,birthGranted:true};c.buildings.push('saint_basil');const slot=H.workSlots(g,c).find(s=>s.type==='relic');g.heritage.works.push({id:g.heritage.nextWork++,creator:'martyr:fixture',type:'relic',title:'Test relic',faith:4,tourism:4,city:c.id,slot:slot.id});assert.equal(H.greatWorkYields(g,c).tourism,8);assert.equal(H.heritageCityBonuses(g,c).flat.tourism,16);site.pillaged=true;assert.equal(H.heritageCityBonuses(g,c).flat.tourism,16);
 pass('Saint Basil adds exactly 100 percent relic tourism, including the actual radio-era work yield, and retains the bonus despite obsolete damage flags');
}
{
 const {g,p}=field();p.greatPeople.retired=H.GREAT_PEOPLE.map(v=>({key:v.key,turn:g.turn}));for(const person of H.GREAT_PEOPLE)g.heritage.recruited[person.key]={owner:p.id,turn:g.turn};const restored=E.restore(E.serialize(g));assert.equal(restored.players[0].greatPeople.retired.length,H.GREAT_PEOPLE.length);const forged=JSON.parse(E.serialize(g));forged.players[0].greatPeople.retired.push({...forged.players[0].greatPeople.retired[0]});assert.throws(()=>E.restore(JSON.stringify(forged)));
 pass('A full-catalogue national retirement history survives save/load beyond the former 100-person cap and still rejects duplicate identities');
}
await writeFile(new URL('../output/wonder-lifecycle-ai-20261016/core-checks.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),checks,scope:'Core lifecycle, full-roster execution, complete wonder construction/repair, tactical durations, staged charges, actual conquest, highest-only commanders, naval bases, fog and complete roster histories; native checks recorded separately'},null,2));
