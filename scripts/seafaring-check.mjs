import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,restore,observation,addUnit,foundCity,refreshVisibility,applyAction,reachable,legalActions} from '../src/engine.mjs';
import {CIVS,UNITS,isWater,canEmbark} from '../src/rules.mjs';
import {indexMap} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const checks=[],metrics={},pass=name=>{checks.push(name);console.log('PASS '+name);};
const input=await readFile(new URL('../output/seafaring-save-input.json',import.meta.url));
const {NativeDriverPool}=await import('../src/driver-pool.mjs'),pool=new NativeDriverPool();
function archipelago(known=false){
  const g=createGame({players:2,size:'small',seed:'SEAFARING-FIXTURE',barbarians:false});g.units=[];g.cities=[];g.cityStates={version:1,seeded:true,states:[]};delete g.realtime;g.turn=90;
  const width=38,height=10;
  g.map=indexMap({width,height,wrapX:false,tiles:Array.from({length:width*height},(_,id)=>{const row=Math.floor(id/width),col=id%width;return {id,col,row,q:col-Math.floor(row/2),r:row,terrain:'ocean',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false};})});
  const tile=(col,row)=>g.map.tiles[row*width+col];
  for(let row=3;row<=5;row++)for(let col=2;col<=4;col++)tile(col,row).terrain='grass';
  for(let row=2;row<=7;row++)for(let col=22;col<=27;col++)tile(col,row).terrain='grass';
  tile(35,4).terrain='grass';
  for(const p of g.players){p.explored=[];p.visible=[];p.knownTiles={};p.knownCities={};p.memory=null;p.techs=['pottery','sailing','writing','celestial'];p.gold=500;p.manual=true;}
  const p=g.players[0];foundCity(g,p,addUnit(g,0,'settler',tile(3,4).id));foundCity(g,g.players[1],addUnit(g,1,'settler',tile(35,4).id));g.units=[];
  const u=addUnit(g,0,'settler',tile(3,4).id);refreshVisibility(g);
  if(known){p.explored=g.map.tiles.map(t=>t.id);p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,tile:c.tile,owner:c.owner}]));}
  return {g,p,u,tile};
}
async function decide(g,p,u){const obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&['move','found','fortify'].includes(a.type));const response=await pool.execute(p,obs);p.memory=response.memory;return response.orders.find(a=>a.unit===u.id);}
try{
  {
    const g=restore(input.toString()),p=g.players[5];const settlers=g.units.filter(u=>u.owner===p.id&&u.type==='settler');assert(p.techs.includes('celestial')&&!p.techs.includes('shipbuilding'));
    const orders=[];for(const u of settlers){u.acted=false;u.moves=UNITS.settler.moves;u.activity=null;u.moveUntil=0;u.healUntil=0;assert(canEmbark(p,u.type));const command=await decide(g,p,u);assert.equal(command?.type,'move');const hint=observation(g,p).legalActions.find(a=>a.type==='move'&&a.unit===u.id&&a.tile===command.tile).hint;assert(hint.settleProgress>0);orders.push({unit:u.id,tile:command.tile,progress:hint.settleProgress,distance:hint.settleDistance});}metrics.capturedEngland=orders;pass('Both actual captured England settlers leave their cities toward colony routes without shipbuilding or a transport entity');
  }
  {
    const {g,p,u}=archipelago(true);const moves=legalActions(g,p).filter(a=>a.type==='move'&&a.unit===u.id);assert(Math.min(...moves.map(a=>a.hint.settleDistance))>12);
    const drivers=[];for(const civ of CIVS){p.driver.file=civ.file;p.memory=null;const command=await decide(g,p,u);assert.equal(command?.type,'move',civ.file);const hint=moves.find(a=>a.tile===command.tile).hint;assert(hint.settleProgress>0);drivers.push(civ.file);}metrics.longRouteDrivers=drivers;pass('All eight compiled native strategies advance on long sea routes instead of preferring permanent fortification');
  }
  for(const known of [true,false]){
    const {g,p,u}=archipelago(known);p.driver.file=CIVS[5].file;const initial=g.cities.filter(c=>c.owner===0).length;let oceanMoves=0,steps=0;
    while(g.units.includes(u)&&steps<80){u.acted=false;u.moves=2;refreshVisibility(g);const command=await decide(g,p,u);assert(command,'Settler lost its colony/exploration route');if(command.type==='move'&&isWater(g.map.tiles[command.tile]))oceanMoves++;assert.notEqual(command.type,'fortify','Safe settler stopped in an archipelago');applyAction(g,p,command);g.turn++;steps++;}
    assert.equal(g.cities.filter(c=>c.owner===0).length,initial+1);assert(oceanMoves>5);metrics[known?'knownIsland':'fogIsland']={steps,oceanMoves};pass(known?'A native settler completes a long deep-ocean voyage, lands and actually founds a colony':'A native settler with no known city site explores through fog, discovers a new island and actually founds a colony');
  }
  {
    const {g,p,u}=archipelago(false),sim=new RealtimeSimulation(g);p.driver.file=CIVS[5].file;let decisions=0;
    try{while(g.units.includes(u)&&g.realtime.time<180){if(!u.acted&&!u.activity&&(u.moveUntil||0)<=g.realtime.time){const command=await decide(g,p,u);assert(command);sim.enqueue(p,[command],{manual:true});decisions++;}sim.tick(.25);}assert.equal(g.cities.filter(c=>c.owner===0).length,2);assert.equal(sim.stats.rejected,0);metrics.realtimeColony={seconds:g.realtime.time,decisions,accepted:sim.stats.accepted};pass('The actual concurrent scheduler completes fog exploration and colony founding with movement timings and cooldowns intact');}finally{sim.dispose();}
  }
  {
    const {g,p,u}=archipelago(true);p.techs=['sailing'];assert(!reachable(g,p,u).some(a=>g.map.tiles[a.tile].terrain==='ocean'));p.techs=[];assert(!reachable(g,p,u).some(a=>isWater(g.map.tiles[a.tile])));pass('Exploration cannot bypass missing coastal or deep-ocean embarkation technology');
    const heavy=addUnit(g,0,'tank',u.tile);g.units=g.units.filter(v=>v.id!==u.id);p.techs=['sailing','celestial'];assert(!reachable(g,p,heavy).some(a=>isWater(g.map.tiles[a.tile])));p.techs.push('steam');assert(reachable(g,p,heavy).some(a=>isWater(g.map.tiles[a.tile])));pass('Heavy transports still require steam, independently of ocean navigation');
  }
  {
    const {g,p,u}=archipelago(true);for(const t of g.map.tiles)if(t.col>=19&&t.col<=20)t.owner=1;p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));const command=await decide(g,p,u);assert.notEqual(command?.type,'move');pass('A known closed foreign territorial barrier blocks colony routing');
  }
  {
    const {g,p,u,tile}=archipelago(false);const before=legalActions(g,p).filter(a=>a.unit===u.id&&a.type==='move');for(const t of g.map.tiles.filter(t=>!p.visible.includes(t.id)))Object.assign(t,{terrain:'mountain',hill:true,resource:'uranium',owner:1});g.cities[1].tile=tile(21,4).id;
    assert.deepEqual(legalActions(g,p).filter(a=>a.unit===u.id&&a.type==='move'),before);pass('Hidden geography, resources, borders and unknown cities cannot alter settlement/exploration hints');
  }
  {
    const {g,p,u,tile}=archipelago(true);const before=legalActions(g,p).filter(a=>a.unit===u.id&&a.type==='move');for(const t of g.map.tiles.filter(t=>!p.visible.includes(t.id)))Object.assign(t,{terrain:'mountain',resource:'uranium',owner:1});g.cities[1].tile=tile(21,4).id;
    assert.deepEqual(legalActions(g,p).filter(a=>a.unit===u.id&&a.type==='move'),before);pass('Previously explored but currently hidden island changes use remembered settlement yields and city locations');
  }
  {
    const {g,p,u,tile}=archipelago(true);for(let row=0;row<10;row++)for(let col=20;col<=29;col++)tile(col,row).terrain='mountain';
    for(let row=6;row<=8;row++)for(let col=12;col<=15;col++)tile(col,row).terrain='grass';
    p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.driver.file=CIVS[5].file;let steps=0;
    while(g.units.includes(u)&&steps<30){u.acted=false;u.moves=2;refreshVisibility(g);const command=await decide(g,p,u);assert(command);applyAction(g,p,command);g.turn++;steps++;}
    const colony=g.cities.find(c=>c.owner===0&&!c.isCapital);assert(colony&&g.map.tiles[colony.tile].col<20);pass('Colony planning chooses a reachable alternative island when another known site is sealed behind mountains');
  }
  {
    const {g,p,u}=archipelago(true),guard=addUnit(g,0,'warrior',u.tile);u.linkedUnit=guard.id;guard.linkedUnit=u.id;
    const command=await decide(g,p,u);assert.equal(command.type,'move');applyAction(g,p,command);assert.equal(u.tile,guard.tile);assert.equal(g.units.filter(v=>v.tile===u.tile).length,2);pass('An explicit settler escort embarks together without creating additional boats or illegal stacking');
  }
  assert((await readFile(new URL('../output/seafaring-save-input.json',import.meta.url))).equals(input));pass('Frozen user world stays byte-exact; isolated tests never write the live autosave or start the game server');
  await writeFile(new URL('../output/seafaring-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,inputSha256:createHash('sha256').update(input).digest('hex'),activeSaveWritten:false,gameLaunched:false},null,2));
}finally{pool.dispose();}
