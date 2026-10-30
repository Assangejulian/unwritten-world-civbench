import {isWater} from '/rules.mjs';
import {facilityFrame,facilityPlacement,FACILITY_FRAMES,MODERNIZATION_FRAMES} from './facility-art.js';
import {resourceSceneryVisible} from './resource-art.js';

// Clearance only affects scenery. Tile features, yields and movement remain untouched.
export function sceneryClearance(renderer){
  const buckets=new Map(),entries=[],cell=100;
  for(const tile of renderer.game.map.tiles){
    if(tile.hidden)continue;
    const frame=facilityFrame(tile,renderer.game.cities.find(c=>c.id===tile.district?.city));
    if(!frame&&!tile.cityId&&!tile.fort&&tile.district?.item!=='barracks'&&!resourceSceneryVisible(tile)||isWater(tile))continue;
    const p=renderer.position(tile),placement=frame?facilityPlacement(frame):{width:tile.cityId?55:tile.fort||tile.district?.item==='barracks'?48:30,anchorY:.82};
    const bounds=MODERNIZATION_FRAMES.includes(frame)?renderer.modernizationBounds?.[MODERNIZATION_FRAMES.indexOf(frame)]:renderer.facilityBounds?.[FACILITY_FRAMES.indexOf(frame)],height=bounds?placement.width*(bounds.bottom-bounds.top)/(bounds.right-bounds.left):30;
    const y=renderer.heightAt(tile),bottom=p.y*.6-y*.8+height*(1-placement.anchorY);
    const e={x:p.x,z:p.y,y,width:placement.width,top:bottom-height,bottom,roadRadius:tile.cityId?0:placement.width*.43+2};entries.push(e);
    const k=Math.floor(p.x/cell)+':'+Math.floor(p.y/cell);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(e);
  }
  const near=(x,z)=>{const out=[],cx=Math.floor(x/cell),cz=Math.floor(z/cell);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)out.push(...(buckets.get((cx+dx)+':'+(cz+dz))||[]));return out;};
  return {entries,treeAllowed(x,z,y,height){
    const bottom=z*.6-y*.8,top=bottom-height*.8,canopy=height*.40;
    return !near(x,z).some(e=>Math.hypot(x-e.x,z-e.z)<e.width*.42+canopy*.5||
      (z*.8+y*.6>e.z*.8+e.y*.6+3&&Math.abs(x-e.x)<e.width*.44+canopy&&top<e.bottom+2&&bottom>e.top+3));
  },roadAllowed(x,z){return !near(x,z).some(e=>e.roadRadius&&Math.hypot(x-e.x,(z-e.z)*1.3)<e.roadRadius);}};
}
