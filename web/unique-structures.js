// Draw authored intact / battle / ruin states using projected state only.
// Images load on visible demand; decoded memory is bounded to the catalogue.
import {BUILDINGS} from '/rules.mjs';
export const UNIQUE_STRUCTURE_ART={"great_wall_bastion":"leader-rework/great_wall_bastion.png","salt_iron_office":"leader-rework/salt_iron_office.png","honglu_pavilion":"leader-rework/honglu_pavilion.png","mingtang_hall":"leader-rework/mingtang_hall.png","jiphyeonjeon":"leader-rework/jiphyeonjeon.png","tenshu_keep":"leader-rework/tenshu_keep.png","basilikoi_paides":"leader-rework/basilikoi_paides.png","triumphal_forum":"leader-rework/triumphal_forum.png","roman_bath":"leader-rework/roman_bath.png","acropolis_odeon":"leader-rework/acropolis_odeon-3.png","pairidaeza_garden":"leader-rework/pairidaeza_garden-3.png","satraps_court":"leader-rework/satraps_court.png","ptolemaic_mouseion":"leader-rework/ptolemaic_mouseion.png","mortuary_temple":"leader-rework/mortuary_temple.png","obelisk":"leader-rework/obelisk.png","edict_pillar":"leader-rework/edict_pillar.png","maurya_stepwell":"leader-rework/maurya_stepwell.png","ayyubid_madrasa":"leader-rework/ayyubid_madrasa.png","grand_bazaar":"leader-rework/grand_bazaar.png","mongol_ordu":"leader-rework/mongol_ordu.png","suguba_market":"leader-rework/suguba_market.png","ikanda":"leader-rework/ikanda.png","royal_dockyard":"leader-rework/royal_dockyard.png","peter_arsenal":"leader-rework/peter_arsenal.png","inca_tambo":"leader-rework/inca_tambo.png"};
export const WONDER_STRUCTURE_ART={"stonehenge":"wonders/stonehenge.png","hanging_gardens":"wonders/hanging_gardens.png","pyramids":"wonders/pyramids.png","halicarnassus":"wonders/halicarnassus.png","great_ziggurat":"wonders/great_ziggurat.png","temple_of_artemis":"wonders/temple_of_artemis.png","knossos_palace":"wonders/knossos_palace.png","karnak":"wonders/karnak.png","oracle":"wonders/oracle.png","great_lighthouse":"wonders/great_lighthouse.png","colossus":"wonders/colossus.png","greatlibrary":"wonders/greatlibrary.png","colosseum":"wonders/colosseum.png","parthenon":"wonders/parthenon.png","petra":"wonders/petra.png","terracotta_army":"wonders/terracotta_army.png","mahabodhi_temple":"wonders/mahabodhi_temple.png","teotihuacan_sun_pyramid":"wonders/teotihuacan_sun_pyramid.png","nalanda":"wonders/nalanda.png","pantheon_rome":"wonders/pantheon_rome.png","weiyang_palace":"wonders/weiyang_palace.png","hagia_sophia":"wonders/hagia_sophia.png","mont_saint_michel":"wonders/mont_saint_michel.png","dayan_pagoda":"wonders/dayan_pagoda.png","chichen_itza":"wonders/chichen_itza.png","borobudur":"wonders/borobudur.png","great_zimbabwe":"wonders/great_zimbabwe.png","notre_dame":"wonders/notre_dame.png","angkor_wat":"wonders/angkor_wat.png","himeji_castle":"wonders/himeji_castle.png","alhambra":"wonders/alhambra.png","oxford":"wonders/oxford.png","torre_de_belem":"wonders/torre_de_belem.png","observatory":"wonders/observatory.png","taj_mahal":"wonders/taj_mahal.png","potala_palace":"wonders/potala_palace.png","venetian_arsenal":"wonders/venetian_arsenal.png","forbidden":"wonders/forbidden.png","st_peters":"wonders/st_peters.png","temple_of_heaven":"wonders/temple_of_heaven.png","sankore_madrasa":"wonders/sankore_madrasa.png","saint_basil":"wonders/saint_basil.png","machu_picchu":"wonders/machu_picchu.png","topkapi_palace":"wonders/topkapi_palace.png","hermitage":"wonders/hermitage.png","big_ben":"wonders/big_ben.png","ruhr_valley":"wonders/ruhr_valley.png","statue_of_liberty":"wonders/statue_of_liberty.png","eiffel":"wonders/eiffel.png","cristo_redentor":"wonders/cristo_redentor.png","brandenburg_gate":"wonders/brandenburg_gate.png","louvre":"wonders/louvre.png","summer_palace":"wonders/summer_palace.png","brooklyn_bridge":"wonders/brooklyn_bridge.png","mount_rushmore":"wonders/mount_rushmore.png","broadway":"wonders/broadway.png","panama_canal":"wonders/panama_canal.png","golden_gate":"wonders/golden_gate.png","empire_state":"wonders/empire_state.png","sagrada_familia":"wonders/sagrada_familia.png","hoover_dam":"wonders/hoover_dam.png","sydney_opera":"wonders/sydney_opera.png","cern_lhc":"wonders/cern_lhc.png","burj_khalifa":"wonders/burj_khalifa.png"};
const images=new Map();
// Fit visible artwork rather than transparent atlas padding; share one frame
// across all three states so damage and ruins never change scale or anchoring.
export const STRUCTURE_SIZE={width:56,height:48,groundOffset:6};
function structureFrame(image){
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,frameWidth=canvas.width/3;
 let left=frameWidth,top=canvas.height,right=0,bottom=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>=32){const local=x-Math.min(2,Math.floor(x/frameWidth))*frameWidth;left=Math.min(left,local);right=Math.max(right,local+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
 if(right<=left||bottom<=top)return {x:0,y:0,width:frameWidth,height:canvas.height};
 left=Math.max(0,Math.floor(left));right=Math.min(frameWidth,Math.ceil(right));
 return {x:left,y:top,width:right-left,height:bottom-top};
}
export function drawUniqueStructure(renderer,ctx,key,tile,state=0){return drawStructureSprite(renderer,ctx,key,UNIQUE_STRUCTURE_ART[key],tile,state);}
export function drawWorldWonder(renderer,ctx,tile){
 const site=tile?.district?.kind==='wonder'?tile.district:tile?.construction;
 if(site?.kind!=='wonder')return false;
 return drawStructureSprite(renderer,ctx,site.item,WONDER_STRUCTURE_ART[site.item],tile,0,tile.district?.kind==='wonder'?null:site.stage);
}
function drawStructureSprite(renderer,ctx,key,file,tile,state=0,construction=null){
 if(!file||!tile||tile.hidden||tile.visible===false)return false;
 let image=images.get(key);if(!image){image=new Image();image.onload=()=>{image.structureFrame=structureFrame(image);renderer.dirty=true;};image.onerror=()=>{image.failed=true;};image.src='/assets/'+file;images.set(key,image);}
 if(!image.complete||!image.naturalWidth||image.failed)return false;
 const frame=image.structureFrame||(image.structureFrame=structureFrame(image)),p=renderer.screen(tile),zoom=Math.max(.001,renderer.zoom??1),scale=Math.min(STRUCTURE_SIZE.width/frame.width,STRUCTURE_SIZE.height/frame.height)*zoom,width=frame.width*scale,height=frame.height*scale;
 const left=p.x-width*.5,ground=p.y+STRUCTURE_SIZE.groundOffset*zoom,top=ground-height;
 if(construction){
  ctx.save();ctx.beginPath();ctx.rect(left-zoom,ground-height*(construction==='started'?.18:.65),width+2*zoom,height);ctx.clip();
  ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,left,top,width,height);ctx.restore();
  // Earthworks, timber uprights and cross-braces use the completed silhouette.
  // No damaged or ruined atlas frame participates in a wonder lifecycle.
  ctx.save();ctx.strokeStyle='#876947';ctx.fillStyle='#bca277';ctx.lineWidth=Math.max(.65,zoom);
  ctx.beginPath();ctx.ellipse(p.x,ground-2*zoom,width*.52,6*zoom,0,0,Math.PI*2);ctx.stroke();
  const scaffoldHeight=construction==='started'?height*.23:height*.87;
  for(let i=0;i<4;i++){const x=left+width*i/3;ctx.fillRect(x,ground-scaffoldHeight,zoom,scaffoldHeight);if(i<3){ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x+width/3,ground-scaffoldHeight);ctx.stroke();}}
  for(let i=1;i<=2;i++){ctx.beginPath();ctx.moveTo(left,ground-scaffoldHeight*i/3);ctx.lineTo(left+width,ground-scaffoldHeight*i/3);ctx.stroke();}ctx.restore();
 }else ctx.drawImage(image,Math.max(0,Math.min(2,state))*image.naturalWidth/3+frame.x,frame.y,frame.width,frame.height,left,top,width,height);
 return true;
}
export function drawUniqueCityStructures(renderer,ctx,city){
 const tile=renderer.game.map.tiles[city.tile];if(!tile||tile.hidden||city.remembered)return false;
 let drawn=false;for(const key of city.buildings||[]){const attachment=structureDistrict(key);if(!UNIQUE_STRUCTURE_ART[key]||attachment&&city.districts?.some(d=>structureDistrict(d.item)===attachment))continue;const walls=!!BUILDINGS[key]?.wallLevel,state=city.hp<=0||walls&&city.walls<=0?2:city.hp<160||walls&&city.walls<(city.wallMax||100)*.7?1:0;drawn=drawUniqueStructure(renderer,ctx,key,tile,state)||drawn;}return drawn;
}
function structureDistrict(key){
 const seen=new Set();while(BUILDINGS[key]&&!seen.has(key)){seen.add(key);const spec=BUILDINGS[key];if(spec.replaces){key=spec.replaces;continue;}if(spec.kind==='district')return key;key=spec.building;}return null;
}
// Resolve the dedicated skin independently of image readiness or atlas stages.
export function uniqueDistrictKey(tile,city){
 if(!tile?.district||tile.hidden||tile.district.kind==='wonder')return null;
 const item=tile.district.item;if(UNIQUE_STRUCTURE_ART[item])return item;
 const attachment=structureDistrict(item);if(!attachment)return null;
 return (city?.buildings||[]).find(key=>UNIQUE_STRUCTURE_ART[key]&&structureDistrict(key)===attachment)||null;
}
export function drawUniqueDistrictStructure(renderer,ctx,tile){
 if(!tile?.district||tile.hidden||tile.visible===false)return false;
 const city=renderer.game.cities.find(c=>c.id===tile.district.city),key=uniqueDistrictKey(tile,city);
 return drawUniqueStructure(renderer,ctx,key,tile,tile.pillaged?2:city?.hp<160?1:0);
}
