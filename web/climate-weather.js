// The renderer only receives fog-projected footprints. Never look up private weather.
const images = new Map();
const COLORS = {flood:'#367f9c', drought:'#ac793d', blizzard:'#d9e9ee', duststorm:'#ba8a50', hurricane:'#738d9e', eruption:'#b8653d'};
const R = 35, SY = .6;
function imageFor(renderer, key) {
  if (!images.has(key)) {
    const image = new Image(); image.decoding = 'async';
    image.onload = () => {renderer.dirty = true;};
    image.onerror = () => {images.set(key, null);};
    image.src = '/assets/climate/' + key + '.webp'; images.set(key, image);
  }
  const image = images.get(key);
  return image?.complete && image.naturalWidth ? image : null;
}
function hex(ctx, p, radius) {
  for (let i=0;i<6;i++) {
    const angle=(i*60-30)*Math.PI/180, x=p.x+Math.cos(angle)*radius, y=p.y+Math.sin(angle)*radius*SY;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
}
function drawable(renderer,id,copy=0) {
  const tile=renderer.game.map.tiles[id];
  if(!tile||tile.hidden||tile.visible===false)return null;
  const p=renderer.screen(tile),radius=R*renderer.zoom;
  if(renderer.game.map.wrapX){const period=R*Math.sqrt(3)*renderer.game.map.width*renderer.zoom;p.x+=(Math.round((renderer.width/2-p.x)/period)+copy)*period;}
  if(p.x+radius<0||p.x-radius>renderer.width||p.y+radius<0||p.y-radius>renderer.height)return null;
  return {tile,p,radius};
}
const drawables=(renderer,id)=>(renderer.game.map.wrapX?[-1,0,1]:[0]).map(copy=>drawable(renderer,id,copy)).filter(Boolean);
export function drawClimateWeather(renderer,ctx) {
  const climate=renderer.game?.climate;
  if(!climate?.enabled)return;
  const time=renderer.reduced?0:renderer.time||0;
  ctx.save();
  for(const id of climate.inundated||[]) {
    for(const entry of drawables(renderer,id)){ctx.beginPath();hex(ctx,entry.p,entry.radius*.94);ctx.fillStyle='#4a91a040';ctx.fill();}
  }
  for(const disaster of climate.disasters||[]) {
    const entries=disaster.tiles.flatMap(id=>drawables(renderer,id));
    if(!entries.length)continue;
    const image=imageFor(renderer,disaster.type),color=COLORS[disaster.type]||'#8e8572';
    ctx.save();ctx.beginPath();for(const entry of entries)hex(ctx,entry.p,entry.radius*.99);ctx.clip();
    for(const {tile,p,radius}of entries) {
      ctx.beginPath();hex(ctx,p,radius);ctx.globalAlpha=disaster.type==='drought'?.13:.17;ctx.fillStyle=color;ctx.fill();
      if(image){
        const drift=Math.sin(time*.45+tile.id)*radius*.07;
        ctx.globalAlpha=disaster.type==='blizzard'?.65:.43;
        ctx.drawImage(image,p.x-radius*1.55+drift,p.y-radius*1.05,radius*3.1,radius*2.1);
      }
      if(['blizzard','duststorm','hurricane'].includes(disaster.type)) {
        ctx.globalAlpha=.65;ctx.strokeStyle=disaster.type==='duststorm'?'#ead1a0':'#edf4f4';ctx.lineWidth=Math.max(.6,renderer.zoom*.65);
        for(let i=0;i<4;i++) {
          const offset=((time*.09+i*.263+tile.id*.173)%1),x=p.x+(offset-.5)*radius*1.8,y=p.y+Math.sin(i*5+tile.id)*radius*.3;
          ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+radius*.16,y+radius*.025);ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha=.88;
  for(const city of renderer.game.cities||[]) {
    if(!(city.buildings||[]).includes('dam'))continue;
    const entries=drawables(renderer,city.tile);if(!entries.length)continue;
    const image=imageFor(renderer,'dam');if(!image)continue;
    for(const entry of entries){const size=45*renderer.zoom;ctx.drawImage(image,entry.p.x+9*renderer.zoom,entry.p.y-size*.25,size,size*.72);}
  }
  ctx.restore();
}
