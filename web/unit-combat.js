import {UNIT_ANIMATION_HINTS} from './unit-etchings.js';
const TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
const point=(a,b,f,arc)=>({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f-Math.sin(f*Math.PI)*arc});
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function meleeApproach(f){return f<.38?smooth(f/.38):f<.64?1:1-smooth((f-.64)/.36);}
export function attackTiming(type,family){const release=['tank','battleship'].includes(type)?.125:.375,flight=family==='bullet'?.18:family==='arrow'?.27:family==='siege'?.40:.32;return {release,flight,impact:['melee','cavalry','naval'].includes(family)?.50:release+flight};}
const projectileModel=type=>UNIT_ANIMATION_HINTS[type]?.projectileModel||({qin_crossbow:'crossbow',sea_dog:'frigate',warakaq:'slinger'}[type]||type);
export function projectileKind(type,family){type=projectileModel(type);return family==='torpedo'?'torpedo':family==='bomb'?'bomb':family==='missile'?'missile':['cannon','bombard','frigate'].includes(type)?'cannonball':type==='catapult'||type==='slinger'||family==='siege'?'stone':type==='crossbow'?'bolt':family==='arrow'?'arrow':family==='bullet'?'bullet':family==='shell'?'shell':null;}
function muzzle(c,p,angle,age,scale,vfx){
  if(age<0||age>.18)return;
  if(vfx?.draw(c,'muzzle',p,38*scale,age/.18,angle,[.2,.55]))return;
  c.save();c.translate(p.x,p.y);c.rotate(angle);c.globalAlpha*=1-age/.18;
  c.fillStyle='#ffca74';c.beginPath();c.moveTo(-2,-3*scale);c.lineTo(17*scale,0);c.lineTo(-2,3*scale);c.closePath();c.fill();
  c.fillStyle='#fff3c5';c.beginPath();c.ellipse(2*scale,0,4*scale,3*scale,0,0,TAU);c.fill();c.restore();
}
function impact(c,p,age,scale,water,heavy,vfx,solid=false){
  if(age<0||age>.35)return;
  const f=age/.35;c.save();c.globalAlpha*=1-f*.55;
  if(vfx?.draw(c,water?'splash':solid?'dust':heavy?'explosion':'sparks',p,(heavy?58:solid?32:24)*scale,f,0,[.5,.88])){c.restore();return;}
  c.strokeStyle=water?'#def4ed':'#f4bb72';c.lineWidth=2*scale;c.beginPath();c.ellipse(p.x,p.y,(3+f*19)*scale,(2+f*7)*scale,0,0,TAU);c.stroke();
  for(let i=0;i<(heavy?10:5);i++){const a=i*2.4,x=p.x+Math.cos(a)*f*21*scale,y=p.y+Math.sin(a)*f*8*scale-Math.sin(f*Math.PI)*(9+i%3*5)*scale;c.fillStyle=water?'#d3e9e7':i%2?'#6c6960':'#edc37f';c.beginPath();c.arc(x,y,(heavy?3:1.3)*(1-f)*scale,0,TAU);c.fill();}
  if(heavy&&!water){c.globalAlpha*=.4;c.fillStyle='#555b56';c.beginPath();c.ellipse(p.x-4*f*scale,p.y-13*f*scale,7*f*scale,11*f*scale,0,0,TAU);c.fill();}c.restore();
}
export function drawAttack(c,{a,b,f,family,type,scale=1,water=false,vfx=null,painted=false}){
  type=projectileModel(type);
  if(family==='torpedo'){
    const {release,flight}=attackTiming(type,family),age=f-release,angle=Math.atan2(b.y-a.y,b.x-a.x);
    if(age>=0&&age<flight)vfx?.draw(c,'torpedo',point(a,b,age/flight,0),36*scale,age/flight,angle,[.7,.5]);
    impact(c,b,age-flight,scale,true,true,vfx);return;
  }
  if(family==='bomb'){const age=f-.375,flight=.32;if(age>=0&&age<flight){const drop=age/flight,p=type==='drone'?point(a,b,drop,12*scale):{x:b.x,y:b.y-(1-drop)*55*scale},angle=type==='drone'?Math.atan2(b.y-a.y,b.x-a.x):Math.PI/2;vfx?.draw(c,'bomb',p,17*scale,drop,angle);}impact(c,b,age-flight,scale,water,true,vfx);return;}
  const direction=Math.atan2(b.y-a.y,b.x-a.x),arrow=family==='arrow',bullet=family==='bullet',shell=family==='shell'||family==='missile',siege=family==='siege';
  if(!arrow&&!bullet&&!shell&&!siege){
    // The weapon stays on its sprite; a short painted edge follows the contact swing.
    const p=point(a,b,.78,0);
    if(family!=='naval'&&f>=.43&&f<=.60){c.save();c.globalAlpha*=Math.sin((f-.43)/.17*Math.PI);vfx?.draw(c,'slash',p,22*scale,0,direction);c.restore();}
    impact(c,p,f-.50,scale,water,false,vfx);return;
  }
  const naval=['frigate','destroyer','battleship'].includes(type),count=naval||type==='hwacha'?3:UNIT_ANIMATION_HINTS[type]?.burst||1;
  const projectile=projectileKind(type,family),solid=['cannonball','stone'].includes(projectile);
  for(let i=0;i<count;i++){
    const timing=attackTiming(type,family),release=timing.release+i*.07,flight=timing.flight,age=f-release,shot=clamp(age/flight),arc=siege?45*scale:arrow?18*scale:shell?25*scale:0;
    const origin={x:a.x+Math.cos(direction)*(painted?0:8)*scale,y:a.y+i*3*scale};
    if((shell||bullet)&&!painted)muzzle(c,origin,direction,age,scale,vfx);
    if(age>=0&&age<flight){
      const p=point(origin,b,shot,arc),previous=point(origin,b,Math.max(0,shot-.035),arc),angle=Math.atan2(p.y-previous.y,p.x-previous.x);
      if((shell||type==='hwacha')&&age<.14){c.save();c.globalAlpha*=.28*(1-age/.14);vfx?.draw(c,'smoke',origin,15*scale,age/.14,0,[.5,.85]);c.restore();}
      if(family==='missile'){c.save();c.globalAlpha*=.65;vfx?.draw(c,'smoke',{x:p.x-Math.cos(angle)*8*scale,y:p.y-Math.sin(angle)*8*scale},18*scale,shot,angle,[.9,.5]);c.restore();}
      const name=projectile==='shell'?(naval?'navalShell':'tankShell'):projectile,width=({cannonball:8,bullet:9,missile:22,bolt:18,arrow:22,stone:9,shell:16})[projectile]||16;
      // Projectile bodies always use authored pixels; primitives are reserved
      // for light/impact fallbacks while the existing effect sheet loads.
      vfx?.draw(c,name,p,width*scale,0,angle);
    }
    impact(c,b,age-flight,scale,water,shell||siege,vfx,solid);
  }
}
