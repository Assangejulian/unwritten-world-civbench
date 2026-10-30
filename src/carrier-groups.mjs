import {unitDetected} from './movement-rules.mjs';
import {heritageRangeBonus} from './heritage.mjs';
import {UNITS,dist,isWater} from './rules.mjs';

export const FLEET_RULES={radius:3,strength:20,range:2};
const caches=new WeakMap();
export function invalidateFleets(g){caches.delete(g);}
export function carrierFor(g,u){return u?.carrierId===undefined?null:g.units.find(c=>c.id===u.carrierId&&c.owner===u.owner&&c.hp>0&&UNITS[c.type]?.airCapacity&&c.tile===u.tile)||null;}
export function deckAircraft(g,c){return g.units.filter(u=>u.hp>0&&u.owner===c.owner&&u.carrierId===c.id&&u.tile===c.tile&&UNITS[u.type]?.domain==='air');}
export function carrierBusy(g,c){return !!c.activity||deckAircraft(g,c).some(u=>u.activity)||g.units.some(u=>u.hp>0&&u.activity?.action.type==='rebase'&&u.activity.action.carrier===c.id);}
export function deckAvailable(g,c,except=-1){
 if(!c||c.hp<=0||!UNITS[c.type]?.airCapacity||c.activity||!isWater(g.map.tiles[c.tile]))return false;
 const parked=deckAircraft(g,c).filter(u=>u.id!==except).length;
 const inbound=g.units.filter(u=>u.id!==except&&u.hp>0&&u.activity?.action.type==='rebase'&&u.activity.action.carrier===c.id).length;
 return parked+inbound<UNITS[c.type].airCapacity;
}
export function fleetGroups(g,viewer=null){
 let views=caches.get(g);if(!views){views=new Map();caches.set(g,views);}if(views.has(viewer))return views.get(viewer);
 const visible=viewer===null?null:new Set(g.players[viewer]?.visible||[]),seen=u=>!visible||u.owner===viewer||(visible.has(u.tile)&&unitDetected(g,u,viewer));
 const units=g.units.filter(u=>u.hp>0&&u.owner>=0&&seen(u)),assigned=new Set(),groups=[];
 for(const c of units.filter(u=>UNITS[u.type]?.airCapacity&&isWater(g.map.tiles[u.tile])).sort((a,b)=>a.id-b.id)){
  const nearby=units.filter(u=>u.owner===c.owner&&!assigned.has(u.id)&&UNITS[u.type]?.domain==='sea'&&isWater(g.map.tiles[u.tile])&&dist(g.map.tiles[c.tile],g.map.tiles[u.tile],g.map)<=FLEET_RULES.radius);
  const aircraft=units.filter(u=>u.owner===c.owner&&u.carrierId===c.id&&u.tile===c.tile&&UNITS[u.type]?.domain==='air'&&!UNITS[u.type].consumable);
  // The existing destroyer successor retains its escort role in later eras.
  if(!aircraft.length||!nearby.some(u=>['missilecruiser','battleship'].includes(u.type))||!nearby.some(u=>['destroyer','assaultship'].includes(u.type))||!nearby.some(u=>UNITS[u.type].submarine))continue;
  const members=[...nearby.filter(u=>!UNITS[u.type].airCapacity||u.id===c.id),...aircraft],group={carrier:c.id,owner:c.owner,members:members.map(u=>u.id)};
  members.forEach(u=>assigned.add(u.id));groups.push(group);
 }
 views.set(viewer,groups);return groups;
}
export function groupFor(g,u,viewer=null){
 if(!Number.isInteger(u.id)||!['sea','air'].includes(UNITS[u.type]?.domain))return null;
 const groups=fleetGroups(g,viewer),group=groups.find(group=>group.members.includes(u.id));if(!group)return null;
 const actual=g.units.find(v=>v.id===u.id);
 if(actual&&actual.tile!==u.tile&&UNITS[u.type]?.domain==='sea'&&g.units.some(v=>UNITS[v.type]?.airCapacity))return fleetGroups({...g,units:g.units.map(v=>v.id===u.id?u:v)},viewer).find(group=>group.members.includes(u.id))||null;
 return group;
}
export function fleetStrength(g,u,viewer=null){return groupFor(g,u,viewer)?FLEET_RULES.strength:0;}
export function baseRange(g,u){if(UNITS[u.type]?.rangedTech&&!g.players[u.owner]?.techs.includes(UNITS[u.type].rangedTech))return 1;return u.type==='drone'&&(g.players[u.owner]?.spaceLaunchDone||g.players[u.owner]?.spaceStage>0)?24:UNITS[u.type]?.range||1;}
export function fleetRange(g,u,viewer=null){const s=UNITS[u.type],spotter=s?.siege&&!['sea','air'].includes(s.domain)&&g.units.some(v=>v.owner===u.owner&&v.hp>0&&UNITS[v.type]?.support==='spotter'&&!v.embarked&&dist(g.map.tiles[u.tile],g.map.tiles[v.tile],g.map)<=1&&(viewer===null||v.owner===viewer||g.players[viewer]?.visible.includes(v.tile)));return baseRange(g,u)+Math.max(heritageRangeBonus(g,u,viewer),spotter?1:0)+(groupFor(g,u,viewer)?FLEET_RULES.range:0);}
export function fleetReach(g,u,target,viewer=null){
 const origin=g.map.tiles[u.tile],distance=dist(origin,target,g.map),base=baseRange(g,u)+heritageRangeBonus(g,u,viewer);if(distance<=base)return true;
 const group=groupFor(g,u,viewer),range=base+(group?FLEET_RULES.range:0);
 if(distance<=range)return true;if(!group)return false;
 // Connected overlapping firing disks share their union, never chain through another group.
 const candidates=g.units.filter(v=>group.members.includes(v.id)),connected=new Set([u.id]);let changed=true;
 while(changed){changed=false;for(const v of candidates)if(!connected.has(v.id)&&candidates.some(w=>connected.has(w.id)&&dist(g.map.tiles[v.tile],g.map.tiles[w.tile],g.map)<=fleetRange(g,v,viewer)+fleetRange(g,w,viewer))){connected.add(v.id);changed=true;}}
 return candidates.some(v=>connected.has(v.id)&&dist(g.map.tiles[v.tile],target,g.map)<=fleetRange(g,v,viewer));
}
export function fleetStatus(g,u,viewer=null){const group=groupFor(g,u,viewer);return group?{carrier:group.carrier,members:group.members,strength:FLEET_RULES.strength,range:FLEET_RULES.range,radius:FLEET_RULES.radius}:null;}
export function validateDecks(g){
 for(const u of g.units)if(u.carrierId!==undefined&&(!Number.isInteger(u.carrierId)||UNITS[u.type]?.domain!=='air'||!carrierFor(g,u)))throw Error('Invalid aircraft carrier assignment.');
 for(const c of g.units.filter(u=>UNITS[u.type]?.airCapacity))if(deckAircraft(g,c).length>UNITS[c.type].airCapacity)throw Error('Aircraft carrier deck is over capacity.');
}
