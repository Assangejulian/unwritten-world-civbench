import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,addUnit,foundCity,applyAction,legalActions,unitStrength,movementCost,finishTurn,refreshVisibility,observation,serialize,restore,event} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {VETERAN_TRAITS,veteranCapacity,veteranChoices,UNITS,TECHS} from '../src/rules.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {beginWar} from '../src/warfare.mjs';
import {neighbors} from '../src/world.mjs';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
function field(){const g=createGame({seed:'VETERAN-TRAINING',players:2,size:'small',barbarians:false});for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,river:false,riverEdges:[],owner:null,cityId:null,camp:false,ruin:false,district:null,improvement:null});g.units=[];for(const p of g.players){p.manual=true;p.gold=1000;p.met=[1-p.id];const t=g.map.tiles[(10+p.id*8)*g.map.width+12];foundCity(g,p,addUnit(g,p.id,'settler',t.id));}g.units=[];const p=g.players[0],tile=g.map.tiles[g.cities[0].tile],u=addUnit(g,0,'archer',tile.id);u.level=1;u.xp=25;u.hp=55;const sim=new RealtimeSimulation(g);refreshVisibility(g);return {g,sim,p,u,tile};}
function ready(u){u.acted=false;u.moves=UNITS[u.type].moves;u.cooldownUntil=0;delete u.activity;}
{
 const {g,sim,p,u}=field();u.attackUntil=30;u.moveUntil=20;const hp=u.hp;assert.equal(veteranCapacity(u),1);sim.enqueue(p,[{type:'trainVeteran',unit:u.id,item:'assault'}]);sim.tick(.05);assert.equal(u.activity.ends-u.activity.started,6);assert(!u.veteranTraits);sim.tick(5.9);assert(!u.veteranTraits);const clone=restore(serialize(g)),resumed=new RealtimeSimulation(clone);sim.tick(.1);resumed.tick(.1);assert.deepEqual(u.veteranTraits,['assault']);assert.equal(u.hp,hp);assert.equal(u.attackUntil,30);assert.equal(u.moveUntil,20);assert(u.cooldownUntil>g.realtime.time);assert.deepEqual(clone.units,g.units);sim.dispose();resumed.dispose();pass('Training takes six seconds, resumes mid-action identically, never heals on learning and preserves independent movement/attack clocks');
}
{
 const {g,sim,p,u,tile}=field();sim.enqueue(p,[{type:'trainVeteran',unit:u.id,item:'medicine'}]);sim.tick(.05);tile.owner=1;sim.tick(6);assert(!u.veteranTraits);assert.equal(sim.stats.rejected,1);tile.owner=0;ready(u);u.level=0;assert.throws(()=>sim.start(p,{type:'trainVeteran',unit:u.id,item:'assault'}));u.level=1;tile.terrain='coast';assert.throws(()=>sim.start(p,{type:'trainVeteran',unit:u.id,item:'assault'}));sim.dispose();pass('Admission and completion reject unavailable slots, embarked training and a training ground lost during the action');
}
{
 const {g,sim,p,u}=field();for(const [rank,slots]of [[0,0],[1,1],[2,1],[3,2],[4,2],[5,3],[99,3]]){u.level=rank;assert.equal(veteranCapacity(u),slots);}u.level=5;u.xp=125;for(const item of ['assault','bastion','medicine']){ready(u);applyAction(g,p,{type:'trainVeteran',unit:u.id,item});}ready(u);assert.equal(veteranChoices(u).length,0);assert.throws(()=>applyAction(g,p,{type:'trainVeteran',unit:u.id,item:'terrain'}));assert.throws(()=>applyAction(g,p,{type:'trainVeteran',unit:u.id,item:'assault'}));assert.equal(veteranCapacity({...u,type:'builder'}),0);assert(!veteranChoices({...u,type:'galley',veteranTraits:[]}).includes('terrain'));assert(!veteranChoices({...u,type:'bomber',veteranTraits:[]}).includes('terrain'));sim.dispose();pass('Ranks 1/3/5 unlock bounded unique slots; civilians are excluded and ships/aircraft cannot learn land terrain training');
}
{
 const {g,sim,u,tile}=field();u.hp=100;const normalAttack=unitStrength(g,u),normalDefense=unitStrength(g,u,true);u.veteranTraits=['assault'];assert.equal(unitStrength(g,u),normalAttack+2);assert.equal(unitStrength(g,u,true),normalDefense);u.veteranTraits=['bastion'];assert.equal(unitStrength(g,u,true),normalDefense+3);tile.owner=1;assert.equal(unitStrength(g,u,true),normalDefense-5);tile.owner=0;tile.hill=true;u.veteranTraits=['terrain'];assert.equal(unitStrength(g,u,true),normalDefense+5);tile.terrain='coast';const transport=unitStrength(g,u,true);u.veteranTraits=['assault','bastion'];assert.equal(unitStrength(g,u,true),transport);sim.dispose();pass('Combat bonuses are conditional, do not stack incorrectly and disappear while embarked');
}
{
 const {g,sim,p,u,tile}=field();const next=neighbors(g.map,tile)[0];next.owner=0;next.hill=true;next.feature='forest';assert.equal(movementCost(g,p,u,tile,next),2);u.veteranTraits=['terrain'];assert.equal(movementCost(g,p,u,tile,next),1);next.river=true;assert.equal(movementCost(g,p,u,tile,next),2);tile.road=next.road=true;assert(movementCost(g,p,u,tile,next)>0);next.terrain='mountain';assert(!Number.isFinite(movementCost(g,p,u,tile,next)));sim.dispose();pass('Terrain training reduces hill/forest cost without free movement, removing river penalties or bypassing impassable mountains');
}
{
 const {g,sim,p,u}=field();u.veteranTraits=['medicine'];u.hp=40;ready(u);applyAction(g,p,{type:'fortify',unit:u.id});assert.equal(u.hp,64);const moveUntil=u.moveUntil=12,attackUntil=u.attackUntil=15;finishTurn(g,{actions:false});assert.equal(u.hp,72);assert.equal(u.moveUntil,moveUntil);assert.equal(u.attackUntil,attackUntil);sim.dispose();pass('Medical preparation affects actual rest and economy healing without resetting action clocks');
}
{
 const {g,sim,p,u,tile}=field();u.level=3;u.xp=75;u.veteranTraits=['assault'];u.type='warrior';p.techs=Object.keys(TECHS);tile.resource='iron';tile.improvement='mine';const upgrade=legalActions(g,p).find(a=>a.type==='upgrade'&&a.unit===u.id);assert(upgrade);applyAction(g,p,upgrade);assert.deepEqual(u.veteranTraits,['assault']);for(const traits of [['assault','assault'],['invented'],['assault','bastion','medicine']]){const bad=JSON.parse(serialize(g));bad.units[0].veteranTraits=traits;assert.throws(()=>restore(JSON.stringify(bad)));}const bad=JSON.parse(serialize(g));bad.units[0].type='bomber';bad.units[0].veteranTraits=['terrain'];assert.throws(()=>restore(JSON.stringify(bad)));sim.dispose();pass('Equipment upgrades retain earned specializations; duplicate, unknown, over-budget and role-incompatible saved traits are rejected');
}
{
 const {g,sim,p,u,tile}=field();const pool=new NativeDriverPool();try{let obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&a.type==='trainVeteran');let result=await pool.execute(p,obs);assert.equal(result.orders[0].item,'medicine');u.hp=100;obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&a.type==='trainVeteran');result=await pool.execute(p,obs);assert.equal(result.orders[0].item,'assault');beginWar(g,p,g.players[1],event);const enemy=addUnit(g,1,'archer',neighbors(g.map,tile)[0].id);refreshVisibility(g);obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&['trainVeteran','attack'].includes(a.type));result=await pool.execute(p,obs);assert(result.orders.some(a=>a.type==='attack'&&a.targetUnit===enemy.id));pass('Real native C++ chooses medical training for injured veterans, attack training for healthy archers and fighting over training under immediate threat');}finally{pool.dispose();sim.dispose();}
}
{
 const {g,sim,p,u}=field(),pool=new NativeDriverPool();u.hp=100;p.strategy='culture';
 try{const obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&a.type==='trainVeteran');const result=await pool.execute(p,obs);assert.equal(result.orders[0].item,'bastion');pass('A real native cultural strategy selects defensive training for a healthy home-city garrison without inventing a strategy key');}finally{pool.dispose();sim.dispose();}
}
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));await writeFile(new URL('../output/veteran-checks.json',import.meta.url),JSON.stringify({passed:true,checks,gameLaunched:false,save:{turn:JSON.parse(before).turn,unchanged:true,sha256:createHash('sha256').update(before).digest('hex')}},null,2));
