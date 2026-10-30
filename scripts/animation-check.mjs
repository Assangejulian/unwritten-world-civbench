import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createGame,applyAction,addUnit,refreshVisibility,snapshot,serialize,restore,legalActions} from '../src/engine.mjs';
import {UNITS,TECHS,RESOURCES,dist} from '../src/rules.mjs';
import {UNIT_MOTIONS,RESOURCE_MARKS} from '../web/visuals.js';

export function scenario(type='warrior',victimHp=1){
  const g=createGame({seed:'ANIMATION-'+type,players:2,size:'small',barbarians:false});g.units=[];
  const p=g.players[0],other=g.players[1];p.manual=true;other.manual=true;p.techs=Object.keys(TECHS);other.techs=Object.keys(TECHS);
  p.relations[1].status='war';other.relations[0].status='war';
  const home=g.map.tiles.find(t=>t.row===20&&t.col===26),near=g.map.tiles.filter(t=>dist(home,t)<=4);
  for(const t of near){t.terrain=UNITS[type].domain==='sea'?'coast':'grass';t.feature=null;t.hill=false;t.camp=false;t.resource=null;t.owner=0;}
  const target=near.find(t=>dist(home,t)===1),actor=addUnit(g,0,type,home.id),victim=addUnit(g,1,'warrior',target.id);victim.hp=victimHp;
  refreshVisibility(g);return {g,actor,victim,home,target};
}
export function showcase(){
  const g=createGame({seed:'UNIT-PARADE',players:2,size:'huge',barbarians:false}),home=g.map.tiles.find(t=>t.row===28&&t.col===30);
  for(const t of g.map.tiles.filter(t=>dist(t,home)<=12)){t.terrain='grass';t.feature=null;t.hill=false;t.resource=null;t.camp=false;}
  const settlers=g.units.filter(u=>u.type==='settler');settlers[0].tile=home.id;settlers[1].tile=g.map.tiles.find(t=>t.row===29&&t.col===40).id;
  for(const p of g.players){p.manual=true;p.techs=Object.keys(TECHS);applyAction(g,p,{type:'found',unit:settlers[p.id].id});}
  g.units=[];g.cities[0].population=6;g.cities[0].walls=100;
  Object.keys(UNITS).forEach((type,i)=>{const t=g.map.tiles.find(t=>t.row===26+Math.floor(i/5)*2&&t.col===27+i%5*2);if(UNITS[type].domain==='sea')t.terrain='coast';addUnit(g,i%2,type,t.id);});
  Object.keys(RESOURCES).forEach((resource,i)=>{const t=g.map.tiles.find(t=>t.row===24+Math.floor(i/7)&&t.col===27+i%7);t.resource=resource;});
  for(const t of g.map.tiles.filter(t=>dist(t,home)<=4))t.owner=0;
  for(const t of g.map.tiles.filter(t=>t.row>=27&&t.row<=32&&t.col>=22&&t.col<=24)){t.terrain=t.col===22?'mountain':'grass';t.feature=t.col===23?'jungle':t.col===24?'forest':null;}
  refreshVisibility(g);return g;
}
async function main(){
  const checks=[];
  assert.deepEqual(Object.keys(UNIT_MOTIONS),Object.keys(UNITS));assert.deepEqual(Object.keys(RESOURCE_MARKS),Object.keys(RESOURCES));checks.push('28 motion profiles and 13 resource symbols cover the complete rules catalogs');
  for(const type of Object.keys(UNITS)){
    const {g,actor}=scenario(type);const move=legalActions(g,g.players[0]).find(a=>a.type==='move'&&a.unit===actor.id);assert(move);applyAction(g,g.players[0],move);assert(snapshot(g).visuals.events.some(e=>e.kind==='move'&&e.actor.type===type));
    const battle=scenario(type),{g:b,actor:a,victim:v}=battle;
    if(!UNITS[type].civilian){applyAction(b,b.players[0],{type:'attack',unit:a.id,targetUnit:v.id});const events=snapshot(b).visuals.events;assert(events.some(e=>e.kind==='attack'&&e.actor.type===type));assert(events.some(e=>e.kind==='hurt'&&e.actor.id===v.id));assert(events.some(e=>e.kind==='death'&&e.actor.id===v.id));}
    else {a.hp=1;b.units=b.units.filter(u=>u.id!==v.id);const tank=addUnit(b,1,'tank',battle.target.id);refreshVisibility(b);applyAction(b,b.players[1],{type:'attack',unit:tank.id,targetUnit:a.id});assert(snapshot(b).visuals.events.some(e=>e.kind==='death'&&e.actor.type===type));}
    const text=serialize(b);assert(!text.includes('visuals'));assert.equal(serialize(restore(text)),text);
  }checks.push('All 28 types move through legal orders, all 25 combat types attack, and civilians receive real damage and death events');
  const fog=scenario('tank'),distant=fog.g.map.tiles.find(t=>t.row===35&&t.col===55);distant.terrain='grass';fog.victim.tile=distant.id;const prey=addUnit(fog.g,-1,'warrior',fog.g.map.tiles.find(t=>dist(t,distant)===1).id);refreshVisibility(fog.g);assert(!fog.g.players[0].visible.includes(distant.id));applyAction(fog.g,fog.g.players[1],{type:'attack',unit:fog.victim.id,targetUnit:prey.id});assert.equal(snapshot(fog.g,0).visuals.events.length,0);checks.push('A battle outside player visibility never appears in that player animation journal');
  const old=await readFile(new URL('../output/before-animation-update.json',import.meta.url),'utf8');assert.equal(serialize(restore(old)),old);checks.push('The legacy turn 60 save round trip remains byte exact and transient effects never enter save files');
  await writeFile(new URL('../output/animation-checks.json',import.meta.url),JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,checks},null,2));
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
