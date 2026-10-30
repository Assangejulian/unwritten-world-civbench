import {unitDetected} from './movement-rules.mjs';
import {UNITS,dist} from './rules.mjs';
import {protectedEnvoy} from './warfare.mjs';
import {fleetRange,fleetStrength,fleetReach,carrierFor} from './carrier-groups.mjs';
const atWar=(g,a,b)=>a===-1||b===-1||a!==b&&g.players[a]?.relations[b]?.status==='war';

export const maxUnitHp = type => UNITS[type]?.maxHp || 100;
export const attackRange = (g,u) => fleetRange(g,u);
export const canAttackUnit = (type,targetType) => UNITS[targetType]?.submarine ? !!UNITS[type]?.submarine || !!UNITS[type]?.antiSubmarine || UNITS[type]?.domain==='air'&&!UNITS[type]?.airOnly : UNITS[targetType]?.domain==='air' ? !!UNITS[type]?.antiAir : !UNITS[type]?.airOnly;
export const nuclearStock = p => p.nuclearStockpile || 0;
export const nuclearRange = type => ({bomber:8,stealthbomber:16,battleship:18,missilecruiser:24,nuclearsubmarine:24,missilesilo:24})[type] || 0;
export function nuclearFootprint(g,tile){
  const center=g.map.tiles[tile];if(!center)return [];
  // A literal five by five array of map cells, not a hex-radius disk.
  const ids=new Set();
  for(let dr=-2;dr<=2;dr++)for(let dq=-2;dq<=2;dq++){
    let q=center.col+dq;const r=center.row+dr;
    if(g.map.wrapX)q=(q%g.map.width+g.map.width)%g.map.width;
    if(q>=0&&q<g.map.width&&r>=0&&r<g.map.height)ids.add(r*g.map.width+q);
  }
  return [...ids];
}
export function airDefenders(g,owner,target,{visibleOnly=false,ballistic=false}={}){
  const time=g.realtime?.time??g.turn*20,p=g.players[owner];
  return g.units.filter(u=>{
    const spec=UNITS[u.type];if(u.hp<=0||!spec?.antiAir||!atWar(g,owner,u.owner)||u.activity||(u.attackUntil||0)>time||visibleOnly&&!p.visible.includes(u.tile))return false;
    if(ballistic)return spec.missileDefense&&dist(g.map.tiles[u.tile],target,g.map)<=spec.range;
    if(spec.domain!=='air')return dist(g.map.tiles[u.tile],target,g.map)<=spec.range;
    const base=g.map.tiles[u.tile],carrier=carrierFor(g,u),range=attackRange(g,u);if(visibleOnly)return (carrier||base.owner===u.owner&&base.district?.item==='airport'&&!base.pillaged)&&fleetReach(g,u,target,owner);
    if(carrier)return !carrier.activity&&fleetReach(g,u,target);
    const city=g.cities.find(c=>c.id===u.airPatrolCity&&c.owner===u.owner);
    return city&&base.owner===u.owner&&base.district?.item==='airport'&&!base.pillaged&&dist(base,g.map.tiles[city.tile],g.map)<=spec.range&&dist(g.map.tiles[city.tile],target,g.map)<=3&&dist(base,target,g.map)<=spec.range;
  }).sort((a,b)=>(UNITS[b.type].ranged||0)+fleetStrength(g,b,visibleOnly?owner:null)-(UNITS[a.type].ranged||0)-fleetStrength(g,a,visibleOnly?owner:null)||a.id-b.id).slice(0,3);
}
export function nuclearPreview(g,p,tile){
  const footprint=nuclearFootprint(g,tile),visible=new Set(p.visible),own=u=>u.owner===p.id,seen=u=>own(u)||(visible.has(u.tile)&&unitDetected(g,u,p.id));
  const units=g.units.filter(u=>footprint.includes(u.tile)&&u.hp>0&&UNITS[u.type].domain!=='air'&&!u.greatPerson&&!protectedEnvoy(u)&&seen(u));
  const cities=g.cities.filter(c=>footprint.includes(c.tile)&&seen(c));
  const facilities=footprint.map(id=>g.map.tiles[id]).filter(t=>(t.owner===p.id||visible.has(t.id))&&(t.improvement||t.district||t.fort)&&!t.pillaged);
  return {enemyCityValue:cities.filter(c=>!own(c)&&atWar(g,p.id,c.owner)).reduce((n,c)=>n+c.walls+c.hp*.5,0),friendlyFacilities:facilities.filter(t=>t.owner===p.id).length,footprint,friendlyUnits:units.filter(own).length,friendlyCities:cities.filter(own).length,
    neutral:facilities.some(t=>t.owner>=0&&t.owner!==p.id&&!atWar(g,p.id,t.owner))||units.some(u=>u.owner>=0&&!own(u)&&!atWar(g,p.id,u.owner))||cities.some(c=>!own(c)&&!atWar(g,p.id,c.owner)),
    enemyUnits:units.filter(u=>!own(u)&&atWar(g,p.id,u.owner)).length,enemyCities:cities.filter(c=>!own(c)&&atWar(g,p.id,c.owner)).length};
}
