let rocket,loaded=false;
// Map-local painted vehicle; admit the asset only for a visible launch.
export function drawSpaceLaunch(renderer,context,event,f){
  const tile=renderer.game.map.tiles[event.actor.tile];if(!tile||tile.hidden||tile.visible===false&&renderer.game.visuals?.view>=0)return;
  const p=renderer.screen(tile),scale=Math.max(.45,renderer.zoom),rise=renderer.reduced?45:Math.max(0,(f-.16)/.84)**1.65*560*scale;
  if(!rocket){rocket=new Image();rocket.onload=()=>{loaded=true;renderer.dirty=true;};rocket.src='/assets/world-systems/rocket.webp';}
  if(p.x<-100||p.x>renderer.width+100||p.y-rise>renderer.height+120||p.y<-600)return;
  context.save();context.globalAlpha=Math.min(1,(1-f)*5);
  const clouds=renderer.reduced?4:18;
  for(let i=0;i<clouds;i++){const age=(f+i/clouds)%1,spread=(10+f*45)*scale;context.fillStyle=`rgba(210,204,179,${(1-age)*.30})`;context.beginPath();context.ellipse(p.x+Math.sin(i*2.4)*spread,p.y-4*scale-age*16*scale,(5+age*20)*scale,(3+age*8)*scale,0,0,Math.PI*2);context.fill();}
  if(loaded){const height=118*scale,width=height*rocket.width/rocket.height;context.drawImage(rocket,p.x-width*.5,p.y-rise-height+12*scale,width,height);}
  context.restore();
}
