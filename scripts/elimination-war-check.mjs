import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {beginWar,propose} from '../src/warfare.mjs';
import {transferCityTerritory} from '../src/territory.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const checks=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
const g=E.createGame({players:3,size:'small',seed:'ELIMINATED-WAR',barbarians:false});g.units=[];
for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,territoryCity:null,district:null,improvement:null,camp:false,ruin:false});
for(const p of g.players){p.manual=true;p.met=g.players.filter(q=>q.id!==p.id).map(q=>q.id);E.foundCity(g,p,E.addUnit(g,p.id,'settler',g.map.tiles[(8+p.id*9)*g.map.width+12].id));}g.units=[];
const [p,q,r]=g.players,sim=new RealtimeSimulation(g),emit=()=>{};
try{beginWar(g,p,q,emit);beginWar(g,p,r,emit);p.warWeariness=25;const campaign=g.diplomacy.wars.find(w=>w.to===q.id),c=g.cities.find(c=>c.owner===q.id);g.realtime.time=200;propose(g,q,p.id,'peace',emit);c.owner=p.id;transferCityTerritory(g,c,p.id);E.finishTurn(g,{actions:false});assert.equal(q.alive,false);assert.equal(p.relations[q.id].status,'peace');assert.equal(q.relations[p.id].status,'peace');assert.equal(p.relations[r.id].status,'war');assert.equal(campaign.status,'closed');assert(g.diplomacy.proposals.every(o=>o.status!=='pending'));E.refreshVisibility(g);assert.equal(E.serialize(E.restore(E.serialize(g))),E.serialize(g));pass('Actual elimination closes bilateral war and offers immediately while preserving a separate living front and exact restoration');}
finally{sim.dispose();}
const legacy=await readFile(new URL('../output/full-game-fixed/checkpoint.json',import.meta.url),'utf8'),raw=JSON.parse(legacy);assert.equal(raw.players[1].relations[8].status,'war');assert.equal(raw.players[8].alive,false);const loaded=E.restore(legacy),continued=new RealtimeSimulation(loaded);
try{for(const [a,b]of [[1,8],[9,11]]){assert.equal(loaded.players[a].relations[b].status,'peace');assert(loaded.diplomacy.wars.filter(w=>[a,b].includes(w.from)&&[a,b].includes(w.to)).every(w=>w.status==='closed'));}const p=loaded.players[1],weariness=p.warWeariness;E.finishTurn(loaded,{actions:false});assert(p.warWeariness<weariness);assert.equal(E.serialize(E.restore(E.serialize(loaded))),E.serialize(loaded));pass('The actual period-200 legacy match releases both phantom wars and starts peacetime weariness recovery');}
finally{continued.dispose();}
await writeFile(new URL('../output/elimination-war-checks.json',import.meta.url),JSON.stringify({passed:true,checks},null,2)+'\n');
