import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as F from '../src/religion.mjs';
import * as C from '../src/encounters.mjs';
import {random,gameRandom,indexMap,neighbors} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {maxUnitHp} from '../src/air-warfare.mjs';
import {lendableSupply} from '../src/peace-terms.mjs';
import {zocSources} from '../src/movement-rules.mjs';

const checks=[],metrics={},out=new URL('../output/encounters-faith-20261018/',import.meta.url);
function field(){
 const g=E.createGame({players:2,size:'small',seed:'ENCOUNTER-CHECK',barbarians:false});g.units=[];g.cities=[];delete g.encounters;g.cityStates={version:1,seeded:true,states:[]};
 g.map=indexMap({width:26,height:20,wrapX:false,roadRules:1,tiles:Array.from({length:520},(_,id)=>({id,col:id%26,row:Math.floor(id/26),q:id%26-Math.floor(Math.floor(id/26)/2),r:Math.floor(id/26),terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[],camp:false,ruin:false,village:false}))});
 for(const p of g.players){p.techs=['pottery','mining','bronze','ironwork'];p.civics=['code','mysticism','training'];p.research='writing';p.boosts=[];p.inspirations=[];p.manual=true;p.religion=null;p.gold=10000;p.faith=10000;p.visible=[];p.explored=[];p.knownTiles={};p.faithOrders=0;p.faithOrdersByType={missionary:0,apostle:0,inquisitor:0};}
 const tile=(x,y)=>g.map.tiles[y*26+x];
 const home=E.foundCity(g,g.players[0],E.addUnit(g,0,'settler',tile(3,3).id));
 const other=E.foundCity(g,g.players[1],E.addUnit(g,1,'settler',tile(22,16).id));g.units=[];
 C.initializeEncounters(g);return {g,p:g.players[0],q:g.players[1],home,other,tile};
}
const ctx={addUnit:E.addUnit,deploymentFree:E.deploymentFree,event:E.event,maxUnitHp,freeUpgrades:(g,p,u)=>E.successorsFor(p,u.type).filter(key=>{const spec=R.UNITS[key];return (!spec.tech||p.techs.includes(spec.tech))&&(!spec.civic||p.civics.includes(spec.civic))&&(!spec.resource||E.playerResources(g,p)[spec.resource]);})};
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS '+name);};

check('Seeded worlds contain distinct villages and at most ten guarded initial camps',()=>{
 const a=E.createGame({players:4,size:'small',seed:'SAME-VILLAGES'}),b=E.createGame({players:4,size:'small',seed:'SAME-VILLAGES'});
 assert(a.map.tiles.some(t=>t.village));assert(a.map.tiles.some(t=>t.ruin));assert(a.map.tiles.filter(t=>t.camp).length<=10);
 assert.deepEqual(a.map.tiles.map(t=>[t.village||false,t.camp]),b.map.tiles.map(t=>[t.village||false,t.camp]));
 for(const t of a.map.tiles.filter(t=>t.camp))assert(a.units.some(u=>u.owner===-1&&u.tile===t.id));
 const serialized=E.serialize(a),restored=E.restore(serialized);assert.deepEqual(restored.encounters,a.encounters);assert.equal(restored.map.tiles.filter(t=>t.village).length,a.map.tiles.filter(t=>t.village).length);
 metrics.initial={villages:a.map.tiles.filter(t=>t.village).length,ruins:a.map.tiles.filter(t=>t.ruin).length,camps:a.map.tiles.filter(t=>t.camp).length};
});

for(const kind of ['gold','faith','eureka','inspiration','experience','healing','upgrade','population','builder','scout','resources'])check('Actual movement grants a valid, one-time '+kind+' village reward',()=>{
 const {g,p,home,tile}=field();p.villageResources={iron:2};const target=tile(7,4);target.village=true;const unit=E.addUnit(g,0,'warrior',tile(6,4).id);unit.hp=45;
 const options=C.villageRewardOptions(g,p,unit,ctx),option=options.find(r=>r.key===kind);assert(option,kind+' should be available');const total=options.reduce((n,r)=>n+r.weight,0),low=options.slice(0,options.indexOf(option)).reduce((n,r)=>n+r.weight,0);
 let seed;for(let n=0;n<100000;n++){const value=gameRandom({rngState:n})*total;if(value>=low&&value<low+option.weight){seed=n;break;}}assert.notEqual(seed,undefined);g.rngState=seed;
 const prior={gold:p.gold,faith:p.faith,pop:home.population,xp:unit.xp,level:unit.level,boosts:p.boosts.length,inspirations:p.inspirations.length,units:g.units.length,resources:JSON.stringify(p.villageResources)};
 E.applyAction(g,p,{type:'move',unit:unit.id,tile:target.id});assert.equal(unit.tile,target.id);assert.equal(target.village,false);assert.equal(unit.acted,true);
 if(kind==='gold')assert(p.gold>prior.gold);if(kind==='faith')assert(p.faith>prior.faith);if(kind==='eureka')assert.equal(p.boosts.length,prior.boosts+1);if(kind==='inspiration')assert.equal(p.inspirations.length,prior.inspirations+1);
 if(kind==='experience')assert.equal(unit.level,prior.level+1);if(kind==='healing')assert.equal(unit.hp,maxUnitHp(unit.type));if(kind==='upgrade'){assert.notEqual(unit.type,'warrior');assert.equal(unit.hp,45);assert.equal(unit.id,g.units.find(u=>u.id===unit.id).id);}
 if(kind==='population')assert.equal(home.population,prior.pop+1);if(['builder','scout'].includes(kind)){assert.equal(g.units.length,prior.units+1);assert(g.units.some(u=>u.type===kind&&u.owner===0));}
 if(kind==='resources')assert.notEqual(JSON.stringify(p.villageResources),prior.resources);
 const events=g.events.filter(e=>e.type==='explore'||e.text?.includes('访问部落村庄'));assert(g.events.some(e=>(e.text||e.message||'').includes('访问部落村庄')));
 assert.equal(C.visitVillage(g,p,unit,ctx),null);E.restore(E.serialize(g));
});

check('Unavailable rewards are filtered; known boosts cannot repeat and bonuses never reset action cooldowns',()=>{
 const {g,p,tile}=field();g.cities=[];p.techs=Object.keys(R.TECHS);p.civics=Object.keys(R.CIVICS);p.villageResources={iron:1000,horses:1000,oil:1000,uranium:1000};const u=E.addUnit(g,0,'builder',tile(7,4).id);u.moveUntil=77;
 assert.deepEqual(C.villageRewardOptions(g,p,u,ctx).map(r=>r.key).sort(),['faith','gold']);tile(7,4).village=true;C.visitVillage(g,p,u,ctx);assert.equal(u.moveUntil,77);
});
check('Realtime villages reward only actual arrival, and restored movement does not collect twice',()=>{
 const {g,p,tile}=field(),t=tile(7,4);t.village=true;const u=E.addUnit(g,0,'scout',tile(6,4).id),sim=new RealtimeSimulation(g);let saved;
 try{sim.start(p,{type:'move',unit:u.id,tile:t.id});assert(t.village);saved=E.serialize(g);sim.tick(5);assert.equal(t.village,false);}finally{sim.dispose();}
 const copy=E.restore(saved),other=new RealtimeSimulation(copy);try{other.tick(5);assert.equal(copy.map.tiles[t.id].village,false);assert.equal(copy.players[0].gold,p.gold);assert.equal(copy.players[0].faith,p.faith);assert.equal(copy.rngState,g.rngState);}finally{other.dispose();}
});
check('Legacy migration places villages only in unexplored neutral land and never resurrects consumed sites',()=>{
 const {g,p,q}=field();delete g.encounters;for(const t of g.map.tiles)delete t.village;p.explored=[10,11,12];q.explored=[13,14];C.initializeEncounters(g,{populate:true});for(const id of [...p.explored,...q.explored])assert(!g.map.tiles[id].village);const site=g.map.tiles.find(t=>t.village);assert(site);site.village=false;C.initializeEncounters(g,{populate:true});assert.equal(site.village,false);
});
check('Strategic gifts supply real recruitment but cannot be re-lent and expire after twenty settlements',()=>{
 const {g,p}=field();p.villageResources={iron:20};assert.equal(E.observation(g,p).player.villageResources.iron,20);assert.equal(E.playerResources(g,p).iron,1);assert.equal(lendableSupply(g,0,'iron'),0);
 for(let n=0;n<19;n++)C.spendVillageReserves(g);assert.equal(E.playerResources(g,p).iron,1);C.spendVillageReserves(g);assert(!E.playerResources(g,p).iron);
});
check('Barbarian knowledge is a prerequisite-closed subset within 75 percent of the living technology leader',()=>{
 const {g,p,q}=field();p.techs=Object.keys(R.TECHS);q.techs=['pottery'];q.civics=Object.keys(R.CIVICS);const a=C.barbarianTechnology(g),weight=p.techs.reduce((n,k)=>n+R.TECHS[k].cost,0);assert.equal(a.budget,Math.floor(weight*.75));assert.equal(a.leader,p.id);assert(a.spent<=a.budget);assert(a.techs.length<p.techs.length);for(const key of a.techs)assert(R.TECHS[key].requires.every(k=>a.techs.includes(k)));p.alive=false;assert.equal(C.barbarianTechnology(g).leader,q.id);metrics.barbarianTech=a;
});
check('A guarded camp sends adjacent reinforcements after its random interval and never replaces its garrison',()=>{
 const {g,p,q,tile}=field();g.settings.barbarians=true;p.techs=Object.keys(R.TECHS);const t=tile(12,10);t.camp=true;t.campNextTurn=g.turn+8;const guard=E.addUnit(g,-1,'warrior',t.id);assert(C.isCampGuard(g,guard));const before=g.units.length;
 C.encountersTurn(g,ctx);assert.equal(g.units.length,before);g.turn=t.campNextTurn;C.encountersTurn(g,ctx);assert.equal(g.units.length,before+1);assert.equal(guard.tile,t.id);assert(g.units.some(u=>u.owner===-1&&u.tile!==t.id));assert(t.campNextTurn>=g.turn+8&&t.campNextTurn<=g.turn+14);
 guard.hp=0;C.clearEmptyCamps(g);assert.equal(t.camp,false);assert.equal(t.campNextTurn,undefined);
});
check('Turn-based ranged barbarians use actual ranged attacks while guards remain on their camp',()=>{
 const {g,p,tile}=field();g.settings.barbarians=true;g.players.forEach(p=>p.manual=true);const camp=tile(12,10);camp.camp=true;camp.campNextTurn=100;const archer=E.addUnit(g,-1,'archer',camp.id),victim=E.addUnit(g,0,'warrior',tile(10,10).id),hp=victim.hp;E.finishTurn(g);assert(victim.hp<hp);assert.equal(archer.tile,camp.id);assert(camp.camp);
});
check('New camps spawn atomically with a guard, away from cities and visible land, with a slow persisted schedule',()=>{
 const {g,p,q}=field();g.settings.barbarians=true;p.visible=[];q.visible=[];g.turn=g.encounters.nextCampTurn;const count=g.map.tiles.filter(t=>t.camp).length;C.encountersTurn(g,ctx);assert.equal(g.map.tiles.filter(t=>t.camp).length,count+1);const t=g.map.tiles.find(t=>t.camp);assert(g.units.some(u=>u.owner===-1&&u.tile===t.id));assert(g.cities.every(c=>R.dist(t,g.map.tiles[c.tile],g.map)>=5));assert(g.encounters.nextCampTurn>=g.turn+18&&g.encounters.nextCampTurn<=g.turn+30);
 const restored=E.restore(E.serialize(g));assert.deepEqual(restored.encounters,g.encounters);assert.equal(restored.map.tiles[t.id].campNextTurn,t.campNextTurn);
 const projected=E.snapshot(g,-1);assert(projected.map.tiles.every(t=>!Object.hasOwn(t,'campNextTurn')));metrics.campSchedule={newCamp:g.encounters.nextCampTurn-g.turn,reinforce:t.campNextTurn-g.turn};
});
check('Actual ranged destruction of the last garrison immediately clears a camp and pays the clearing reward once',()=>{
 const {g,p,tile}=field();const t=tile(7,4);t.camp=true;t.campNextTurn=10;const defender=E.addUnit(g,-1,'warrior',t.id);defender.hp=1;const attacker=E.addUnit(g,0,'archer',tile(6,4).id),gold=p.gold;E.refreshVisibility(g);
 E.applyAction(g,p,{type:'attack',unit:attacker.id,targetUnit:defender.id});assert.equal(t.camp,false);assert.equal(p.gold,gold+35);assert.equal(t.campNextTurn,undefined);C.clearEmptyCamps(g);assert.equal(p.gold,gold+35);
});
check('Realtime guards attack without abandoning the camp; campaign spawning honors barbarian and global caps',()=>{
 const {g,p,q,tile}=field();g.settings.barbarians=true;const t=tile(12,10);t.camp=true;t.campNextTurn=1;const guard=E.addUnit(g,-1,'warrior',t.id);const sim=new RealtimeSimulation(g);
 try{sim.tick(3);assert.equal(guard.tile,t.id);assert(t.camp);}finally{sim.dispose();}
 for(let n=g.units.filter(u=>u.owner===-1).length;n<24;n++)E.addUnit(g,-1,'warrior',tile(n%20,18).id);const count=g.units.length;g.turn=30;g.encounters.nextCampTurn=1;C.encountersTurn(g,ctx);assert.equal(g.units.length,count);
 g.settings.barbarians=false;g.turn=100;C.encountersTurn(g,ctx);assert.equal(g.units.length,count);
});

function church(f,source=0){const {g,p,home,tile}=f;g.players[source].religion=Object.keys(R.RELIGIONS)[source];const holy=tile(4,3);holy.owner=0;holy.district={item:'holy',kind:'district',city:home.id};home.districts.push({item:'holy',tile:holy.id});home.buildings.push('holy','shrine','temple');home.faithPressure={secular:0,[source]:1000};F.updateFollowers(g,home);E.refreshVisibility(g);return holy;}
check('A shrine and city majority unlock missionary Faith purchase without Theology, while higher religious units need their civics and temple',()=>{
 const f=field(),{g,p,home}=f;church(f);home.buildings=home.buildings.filter(k=>k!=='temple');assert(F.canRecruitReligious(g,p,'missionary',home));assert(!F.canRecruitReligious(g,p,'apostle',home));assert(E.legalActions(g,p).some(a=>a.type==='recruitFaith'&&a.item==='missionary'));
 assert(!E.productionOptions(g,p,home).some(a=>a.item==='missionary'));const quote=F.religiousRecruitmentCost(g,p,'missionary',home),gold=p.gold;E.applyAction(g,p,{type:'recruitFaith',item:'missionary',city:home.id});assert.equal(p.faith,10000-quote);assert.equal(p.gold,gold);assert.equal(g.units.find(u=>u.type==='missionary').religionOwner,0);
});
check('Faith purchase inflation is independent by unit type and preserves old-save initial quoted costs',()=>{
 const f=field(),{g,p,home}=f;church(f);p.civics.push('theology');const before=F.religiousRecruitmentCost(g,p,'apostle',home),missionary=F.religiousRecruitmentCost(g,p,'missionary',home);E.applyAction(g,p,{type:'recruitFaith',item:'missionary',city:home.id});assert.equal(F.religiousRecruitmentCost(g,p,'apostle',home),before);assert(F.religiousRecruitmentCost(g,p,'missionary',home)>missionary);
 delete p.faithOrdersByType;p.faithOrders=5;const quote=F.religiousRecruitmentCost(g,p,'apostle',home);F.initializeReligion(g);assert.equal(F.religiousRecruitmentCost(g,p,'apostle',home),quote);E.restore(E.serialize(g));
});
check('An unfounded nation recruits its city majority religion and the unit keeps that faith after the city converts',()=>{
 const f=field(),{g,p,q,home,other,tile}=f;church(f,1);assert.equal(p.religion,null);E.applyAction(g,p,{type:'recruitFaith',item:'missionary',city:home.id});const u=g.units.find(u=>u.type==='missionary');assert.equal(u.religionOwner,1);home.faithPressure={secular:1000};F.updateFollowers(g,home);u.tile=tile(21,16).id;other.faithPressure={secular:500};F.updateFollowers(g,other);E.refreshVisibility(g);p.visible=g.map.tiles.map(t=>t.id);const before=other.faithPressure[1]||0;E.applyAction(g,p,{type:'spread',unit:u.id,targetCity:other.id});assert(other.faithPressure[1]>before);assert.equal(other.faithPressure[0],undefined);E.restore(E.serialize(g));
});
check('Pillaged holy sites and majority-free cities cannot recruit; religion ZOC distinguishes faiths rather than national flags',()=>{
 const f=field(),{g,p,q,home,tile}=f,holy=church(f);holy.pillaged=true;assert(!F.canRecruitReligious(g,p,'missionary',home));holy.pillaged=false;home.faithPressure={secular:1000};F.updateFollowers(g,home);assert(!F.canRecruitReligious(g,p,'missionary',home));
 const u=E.addUnit(g,0,'apostle',tile(7,4).id),v=E.addUnit(g,1,'apostle',tile(8,4).id);u.religionOwner=0;v.religionOwner=0;E.refreshVisibility(g);assert.equal(zocSources(g,u,g.map.tiles[u.tile],{known:false}).length,0);q.religion=Object.keys(R.RELIGIONS)[1];v.religionOwner=1;assert(zocSources(g,u,g.map.tiles[u.tile],{known:false}).length);
});
check('Malformed schedules, village reserves, faith purchase counts and unit religious identities reject cleanly',()=>{
 for(const edit of [g=>g.encounters.nextCampTurn=-1,g=>g.map.tiles[0].village='yes',g=>g.players[0].villageResources={iron:-1},g=>g.players[0].faithOrdersByType={missionary:-1},g=>{const u=E.addUnit(g,0,'warrior',1);u.religionOwner=0;}]){const {g}=field();edit(g);assert.throws(()=>E.restore(E.serialize(g)));}
});
await mkdir(out,{recursive:true});await writeFile(new URL('engine-checks.json',out),JSON.stringify({passed:true,checks,metrics,saveWritten:false,liveGameControlled:false},null,2)+'\n');console.log('PASS '+checks.length+' encounter and faith groups');
