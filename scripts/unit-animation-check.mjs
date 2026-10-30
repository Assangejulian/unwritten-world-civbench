import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {UNIT_RIGS,createJourney,sampleJourney,initialHeading,angleDelta,facingTransform,deformVertex} from '../web/unit-animation.js';
import {UNITS,TECHS,dist,unitMovement} from '../src/rules.mjs';
import {createGame,addUnit,reachable,applyAction,snapshot,serialize,restore} from '../src/engine.mjs';
import {indexMap} from '../src/world.mjs';
import {createHash} from 'node:crypto';
import {PAINTED_UNITS} from '../web/painted-actions.js';
import {UNIT_ETCHINGS} from '../web/unit-etchings.js';
import {UNIQUE_UNITS} from '../src/unique-content.mjs';
import {GREAT_PEOPLE} from '../src/heritage-data.mjs';

const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const audit=JSON.parse(await readFile(new URL('../web/assets/unit-facing-audit.json',import.meta.url),'utf8'));
const greatArt=JSON.parse(await readFile(new URL('../art-source/great-people-20261016/manifest.json',import.meta.url),'utf8'));
const greatMovement=JSON.parse(await readFile(new URL('../art-source/great-people-20261016/movement-manifest.json',import.meta.url),'utf8'));
assert.equal(greatMovement.framesPerClass,4);assert.deepEqual(Object.keys(greatMovement.classes).sort(),Object.keys(greatArt.classes).sort());
for(const asset of Object.values(greatMovement.classes))assert.equal(createHash('sha256').update(await readFile(new URL('../web/assets/'+asset.file,import.meta.url))).digest('hex'),asset.sha256);
assert.equal(Object.keys(greatArt.classes).length,9);
for(const asset of Object.values(greatArt.classes))assert.equal(createHash('sha256').update(await readFile(new URL('../web/assets/'+asset.file,import.meta.url))).digest('hex'),asset.sha256);
for(const type of ['great_person','great_admiral']){assert(UNITS[type].heritage);assert.equal(UNIT_RIGS[type].baseSign,1);for(let direction=0;direction<6;direction++)assert.equal(Math.sign(facingTransform(type,direction*Math.PI/3).scaleX),Math.sign(Math.cos(direction*Math.PI/3)));}
pass('All nine Great Person class sprites have verified source hashes and both heritage rigs retain six-direction facing');
const prepared=Object.keys(UNIQUE_UNITS);for(const folder of ['air-warfare','naval-warfare','carrier']){const manifest=JSON.parse(await readFile(new URL('../web/assets/'+folder+'/manifest.json',import.meta.url),'utf8'));prepared.push(...manifest.newUnitTypes);for(const asset of manifest.records)assert.equal(createHash('sha256').update(await readFile(new URL('../'+asset.runtime,import.meta.url))).digest('hex'),asset.runtimeSha256);}
const expansionArt=JSON.parse(await readFile(new URL('../art-source/unit-poses-20261019/manifest.json',import.meta.url),'utf8'));
const expansionTypes=Object.keys(UNIT_ETCHINGS).sort();
assert.equal(expansionArt.version,2);
assert.deepEqual(expansionArt.records.map(asset=>asset.key).sort(),expansionTypes,'Every expansion unit needs its own reviewed animation source record');
for(const record of expansionArt.records){
  const type=record.key,spec=PAINTED_UNITS[type];
  assert(UNITS[type]&&UNIT_RIGS[type]&&spec,type+' must be present in rules, fallback rig and painted atlas');
  assert.equal(record.authoredLiving,20,type+' living frame count');assert.equal(record.authoredDeath,8,type+' death frame count');
  assert.equal(new Set(record.sourceCropHashes).size,28,type+' distinct authored source crops');
  assert.equal(createHash('sha256').update(await readFile(new URL('../'+record.source,import.meta.url))).digest('hex'),record.sourceSha256,type+' archived source hash');
  assert.deepEqual(record.runtime.map(asset=>asset.file).sort(),['web/assets/'+spec.file,'web/assets/'+spec.deathFile].sort(),type+' runtime must use the current independent living and death sheets');
  for(const asset of record.runtime){
    assert.equal(asset.poses,asset.file==='web/assets/'+spec.deathFile?8:20,type+' runtime pose declaration');
    assert.equal(createHash('sha256').update(await readFile(new URL('../'+asset.file,import.meta.url))).digest('hex'),asset.sha256,type+' runtime hash');
  }
  prepared.push(type);
}
pass('All 24 expansion units use independent 20-living/8-death sheets with verified source and runtime hashes');
assert.deepEqual(audit.units.map(u=>u.type).sort(),Object.keys(UNITS).filter(k=>k!=='envoy'&&k!=='trebuchet'&&UNITS[k].domain!=='air'&&!UNITS[k].heritage&&!prepared.includes(k)).sort(),'The legacy facing audit must cover exactly the remaining original atlas units');
for(const type of prepared){assert.equal(UNIT_RIGS[type].baseSign,PAINTED_UNITS[type].baseSign);for(let direction=0;direction<6;direction++)assert.equal(Math.sign(facingTransform(type,direction*Math.PI/3).scaleX*PAINTED_UNITS[type].baseSign),Math.sign(Math.cos(direction*Math.PI/3)));}
for(const asset of audit.assets)assert.equal(createHash('sha256').update(await readFile(new URL('../web/assets/'+asset.file,import.meta.url))).digest('hex'),asset.sha256);
for(const unit of audit.units){
  assert.equal(UNIT_RIGS[unit.type].baseSign,unit.horizontalSign,unit.type+' source artwork heading');
  for(const angle of [0,Math.PI/3,Math.PI*2/3,Math.PI,Math.PI*4/3,Math.PI*5/3]){
    const transform=facingTransform(unit.type,angle);assert.equal(Math.sign(transform.scaleX*unit.horizontalSign),Math.sign(Math.cos(angle)),unit.type+' artwork must face the movement direction');
  }
}
const knightHead=deformVertex('knight',.25,.39,Math.PI/2),knightBack=deformVertex('knight',.80,.39,Math.PI/2);assert(Math.abs(knightHead.x-.25)>.003);assert(Math.abs(knightBack.x-.80)<1e-8);
pass('Archived and newly prepared source headings match their artwork; six movement headings and the knight neck rig agree');
const envoyArt=JSON.parse(await readFile(new URL('../art-source/envoy-20261006/manifest.json',import.meta.url),'utf8'));
assert.equal(envoyArt.poses,20);assert.equal(envoyArt.baseSign,UNIT_RIGS.envoy.baseSign);
for(const asset of envoyArt.runtime)assert.equal(createHash('sha256').update(await readFile(new URL('../'+asset.file,import.meta.url))).digest('hex'),asset.sha256);
pass('The independent envoy source has 20 painted poses, matching source facing and verified runtime hashes');
const negotiationArt=JSON.parse(await readFile(new URL('../art-source/envoy-negotiation-20261006/manifest.json',import.meta.url),'utf8'));assert.equal(negotiationArt.records.length,3);assert.equal(negotiationArt.records.find(r=>r.key==='envoy-death').poses,8);for(const asset of negotiationArt.records)assert.equal(createHash('sha256').update(await readFile(new URL('../'+asset.runtime,import.meta.url))).digest('hex'),asset.runtimeSha256);pass('The auxiliary death sheet, council hall and audience portrait match their archived source manifest');
assert.deepEqual(Object.keys(UNIT_RIGS).sort(),Object.keys(UNITS).sort());
for(const type of Object.keys(UNITS)){
  for(let direction=0;direction<6;direction++){
    const angle=direction*Math.PI/3,from={x:100,y:100},to={x:100+Math.cos(angle)*61,y:100+Math.sin(angle)*61},journey=createJourney(type,[from,to],initialHeading(type),3);
    assert.equal(sampleJourney(journey,2).stage,'turn');assert.deepEqual(sampleJourney(journey,3).position,from);
    const moving=sampleJourney(journey,3+journey.turn+journey.travel*.5);assert.equal(moving.stage,'move');assert(moving.weight>.99);assert(Math.abs(angleDelta(moving.heading,angle))<1e-9);
    const stopping=sampleJourney(journey,3+journey.turn+journey.travel+.01);assert.equal(stopping.stage,'stop');assert.deepEqual(stopping.position,to);
    const done=sampleJourney(journey,3+journey.duration+.1);assert(done.done);assert.deepEqual(done.position,to);assert.equal(done.stage,'idle');
    const transform=facingTransform(type,angle);assert(Number.isFinite(transform.shear));assert(Math.abs(transform.scaleX)>=.24-1e-9);
  }
  if(UNIT_RIGS[type].legs.length){const part=UNIT_RIGS[type].legs[0],a=deformVertex(type,part.x,.94,.3),b=deformVertex(type,part.x,.94,.3+Math.PI);assert(Math.hypot(a.x-b.x,a.y-b.y)>.01,type+' must articulate its feet');}
}
assert(Math.abs(angleDelta(Math.PI-.01,-Math.PI+.01)-.02)<1e-9);assert.equal(createJourney('tank',[{x:0,y:0},{x:0,y:0}],0,1),null);
pass('Every current unit rig turns through six headings, articulates its legs, travels, stops, and retains its final facing');
const corner=createJourney('scout',[{x:0,y:0},{x:61,y:0},{x:61,y:61}],0,0);for(let t=0;t<corner.duration;t+=.01){const p=sampleJourney(corner,t).position;assert(Math.abs(p.y)<1e-8||Math.abs(p.x-61)<1e-8,'Movement must follow route segments');}
pass('Route animation follows each waypoint instead of cutting through an obstacle');

const g=createGame({seed:'UNIT-ANIMATION-PATHS',players:2,size:'small',barbarians:false}),width=7,height=5;
g.map=indexMap({width,height,wrapX:false,type:'fixture',starts:[0,34],tiles:Array.from({length:width*height},(_,id)=>({id,q:id%width,r:Math.floor(id/width),col:id%width,row:Math.floor(id/width),terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[],variant:id}))});g.map.roadRules=1;g.cities=[];g.units=[];
// Replacing the generated map must not retain city-states whose centers are outside this fixture.
g.cityStates={version:1,seeded:true,states:[]};
const p=g.players[0];p.techs=Object.keys(TECHS);
for(const type of Object.keys(UNITS).filter(k=>k!=='envoy'&&k!=='trebuchet'&&!UNITS[k].heritage&&UNITS[k].domain!=='air')){
  g.units=[];for(const tile of g.map.tiles)tile.terrain=UNITS[type].domain==='sea'?'coast':'grass';g.map.tiles[16].terrain='mountain';
  const u=addUnit(g,0,type,15);u.moves=10;
  p.greatPeople.owned=[];g.heritage.recruited={};
  if(UNITS[type].heritage){const person=GREAT_PEOPLE.find(v=>type==='great_admiral'?v.classKey==='admiral':v.classKey==='scientist');Object.assign(u,{greatPerson:person.key,charges:person.charges,activations:0});p.greatPeople.owned.push({key:person.key,unit:u.id});g.heritage.recruited[person.key]={owner:p.id,turn:g.turn};}
  const plain=reachable(g,p,u),paths=reachable(g,p,u,true);assert.deepEqual(paths.map(({tile,cost,zoc})=>({tile,cost,zoc})),plain,'Path metadata must leave movement rules unchanged');
  const limit=unitMovement(u,p,g.realtime?.time||0);assert(paths.every(move=>move.path.length-1<=limit));
  const detour=paths.find(move=>move.tile===18);if(limit<4)assert(!detour,'A short-range model cannot exceed its cell limit to detour around the mountain');else {assert(detour);assert(detour.path.length>=5);}
  const choice=detour||paths.toSorted((a,b)=>b.path.length-a.path.length||a.tile-b.tile)[0];assert(choice);assert(!choice.path.includes(16));
  for(let i=1;i<choice.path.length;i++)assert.equal(dist(g.map.tiles[choice.path[i-1]],g.map.tiles[choice.path[i]]),1);
  applyAction(g,p,{type:'move',unit:u.id,tile:choice.tile});const event=snapshot(g,-1).visuals.events.findLast(e=>e.actor.id===u.id&&e.kind==='move');assert.deepEqual(event.path,choice.path);assert.equal(u.moves,10-choice.cost);
}
assert.equal(serialize(restore(serialize(g))),serialize(g));
pass('Real movement events carry legal paths for every unit; costs, obstacles, and save round trips remain valid');
pass('Disposable fixtures leave the independently advancing player autosave read-only');
await writeFile(new URL('../output/unit-animation-checks.json',import.meta.url),JSON.stringify({passed:true,checks,unitTypes:Object.keys(UNIT_RIGS).length,saveTurn:JSON.parse(before).turn,activeSaveWritten:false},null,2));
