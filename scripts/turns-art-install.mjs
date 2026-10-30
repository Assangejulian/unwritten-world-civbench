import fs from 'node:fs';
const replace=(s,a,b)=>{if(!s.includes(a))throw Error(a.slice(0,70));return s.replace(a,b);};
const edit=(f,fn)=>fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));
edit('web/unit-etchings.js',s=>s.replace("UNIT_ETCHINGS.drone=['drone','消耗式攻击',UNIT_ETCHINGS.observationdrone[2]];\n",''));
edit('web/map.js',s=>replace(s,'export const unitGlyph=type=>{',"export const unitGlyph=type=>{if(type==='drone')return etchingSvg('observationdrone','unit-art');"));
edit('web/map3d.js',s=>{
 s=replace(s,'setSimulationState(session){this.simulationClock=',"setSimulationState(session){this.turnPresentation=session.mode==='turns';this.simulationClock=");
 s=replace(s,'get actionTime(){if(!this.game?.realtime)',"get actionTime(){if(this.turnPresentation)return performance.now()/1000;if(!this.game?.realtime)");
 s=replace(s,'if(game.realtime||reset||returned.has(u.id)',"if(game.realtime&&game.settings?.playMode!=='turns'||reset||returned.has(u.id)");
 s=replace(s,'const starts=game.realtime?',"const starts=game.realtime&&game.settings?.playMode!=='turns'?");
 s=replace(s,"delay=game.realtime?0:","delay=game.realtime&&game.settings?.playMode!=='turns'?0:");
 s=replace(s,"(!game.realtime&&hit&&", "((!game.realtime||game.settings?.playMode==='turns')&&hit&&");
 s=replace(s,'if(!journey)continue;this.unitTurns.delete(u.id);',"if(!journey)continue;journey.jump=events.some(e=>e.jump);this.unitTurns.delete(u.id);");
 s=replace(s,'if(work&&!hasPainted){',"const jump=this.unitJourneys.get(u.id);if(jump?.jump&&!this.reduced)dy-=Math.sin(Math.max(0,Math.min(1,(this.actionTime-jump.started)/jump.duration))*Math.PI)*48*scale;\n      if(work&&!hasPainted){");
 s=s.replace("profile=UNIT_MOTIONS[u.type],color=", "profile=u.type==='giantdeathrobot'&&!u.ranged?UNIT_MOTIONS.warrior:UNIT_MOTIONS[u.type],color=");
 s=s.replace("profile=UNIT_MOTIONS[e.actor.type]||{family:'shell'}", "profile=e.actor.type==='giantdeathrobot'&&e.actor.ranged===false?UNIT_MOTIONS.warrior:UNIT_MOTIONS[e.actor.type]||{family:'shell'}");
 return s;
});
edit('src/engine.mjs',s=>replace(s,'kind,actor:safeActor,turn:g.turn',"kind,actor:{...safeActor,...(UNITS[actor.type]?.rangedTech?{ranged:unitHasRanged(g.players[actor.owner],actor.type)}:{})},turn:g.turn"));
edit('src/realtime.mjs',s=>{
 s="import {unitHasRanged} from './rules.mjs';\n"+s;
 s=replace(s,"  start(p,a){\n", "  start(p,a){\n    if(a.type==='jump'){applyAction(this.game,p,a);const u=this.game.units.find(u=>u.id===a.unit);if(u){u.moveUntil=this.game.realtime.time+unitCooldown(u.type,'move');u.cooldownUntil=this.game.realtime.time+.4;}return true;}\n");
 s=replace(s,"impactDuration(a,u?.type||'city'))", "impactDuration(a,u?.type==='giantdeathrobot'&&!unitHasRanged(p,u.type)?'warrior':u?.type||'city'))");return s;
});
