// The frontend family table also drives authoritative real-time impact deadlines.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import {UNITS,TECHS} from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {beginWar} from '../src/warfare.mjs';
import {UNIT_ANIMATION_HINTS} from '../web/unit-etchings.js';
import {UNIT_MOTIONS} from '../web/visuals.js';
import {attackTiming} from '../web/unit-combat.js';
import {field} from './imperial-fixture.mjs';
const checks=[];
for(const type of Object.keys(UNIT_ANIMATION_HINTS).filter(k=>!UNITS[k].civilian)){
 const {g,p,q,tile}=field();p.techs=Object.keys(TECHS);beginWar(g,p,q,E.event);
 const from=tile(8,8),to=tile(9,8);if(UNITS[type].domain==='sea')from.terrain=to.terrain='coast';
 const actor=E.addUnit(g,p.id,type,from.id),target=E.addUnit(g,q.id,UNITS[type].domain==='sea'?'galley':'warrior',to.id);E.refreshVisibility(g);
 const sim=new RealtimeSimulation(g);try{const now=g.realtime.time,seconds=attackTiming(type,UNIT_MOTIONS[type].family).impact*1.1;
  assert(sim.start(p,{type:'attack',unit:actor.id,targetUnit:target.id}),type+' legal timed attack');assert(Math.abs(actor.activity.ends-now-seconds)<1e-8,type+' shared timing');
  const settled=Math.ceil((seconds-1e-9)/.05)*.05;sim.advance(settled-.05);assert.equal(target.hp,100,type+' hit before impact');sim.advance(.05);assert(g.realtime.time>=now+seconds-1e-9);assert(target.hp<100,type+' missing actual impact');
  checks.push({type,family:UNIT_MOTIONS[type].family,seconds,targetHp:target.hp,actorHp:actor.hp});
 }finally{sim.dispose();}
}
fs.writeFileSync('output/unit-poses-20261019/impact-checks.json',JSON.stringify({passed:true,checks,scope:'Fifteen genuine timed unit attacks; no balance or complete campaign claim'},null,2)+'\n');
console.log(checks.length+' real impacts occur at the shared painted-family deadline');
