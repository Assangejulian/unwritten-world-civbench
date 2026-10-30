import fs from 'node:fs';
function edit(file,fn){const s=fs.readFileSync(file,'utf8');fs.writeFileSync(file,fn(s));}
const replace=(s,a,b)=>{if(!s.includes(a))throw Error('Missing: '+a.slice(0,90));return s.replace(a,b);};
edit('server.mjs',s=>{
 s=replace(s,"import {RealtimeSimulation,migrateRealtime} from './src/realtime.mjs';","import {migrateRealtime} from './src/realtime.mjs';\nimport {GameSimulation} from './src/turns.mjs';");
 s=replace(s,'return new RealtimeSimulation(world,','return new GameSimulation(world,');
 s=replace(s,'nextTurnAt:null,phase:null,lastRound:','nextTurnAt:null,lastRound:');
 const marker="      if(route==='/api/play')";
 s=replace(s,marker,"      if(route==='/api/end-turn'){if(!simulation.turnBased)throw Error('当前为实时观战。');if(data.view!==data.player||!Number.isInteger(data.view)||data.view<0)throw Error('观察者不能结束回合。');busy=true;changed();try{await simulation.endTurn(data.player);}finally{busy=false;changed();}json(res,200,{ok:true,turn:game.turn});return;}\n"+marker);
 s=replace(s,"        pause();busy=true;const seconds=","        if(simulation.turnBased)throw Error('回合制对局请结束回合。');pause();busy=true;const seconds=");
 s=replace(s,"if(['acceptCourt','rejectCourt'","if(simulation.turnBased){simulation.command(p,data.action);changed();json(res,200,{ok:true,queued:0,immediate:true});return;}if(['acceptCourt','rejectCourt'");
 s=replace(s,"p.manual=Boolean(data.manual);game.realtime.queues[p.id]=[];changed();","simulation.setControl(p,Boolean(data.manual));changed();");
 return s;
});
edit('src/turns.mjs',s=>replace(s,"    this.pause();player.manual=manual;","    if(manual&&this.turnBased&&this.activePlayer!==player.id)throw Error('请在该文明的回合接管。');\n    this.pause();player.manual=manual;"));
edit('src/rules.mjs',s=>{
 s=replace(s," 't:mining':"," 't:futuretech':['巨型战斗机甲解锁远程火炮：射程 3 格。','巨型战斗机甲解锁动力跳跃：跨越两格内障碍，消耗 2 移动力。'],\n 't:mining':");
 s=replace(s,"giantdeathrobot:{name:'巨型战斗机甲',cost:650,moves:4,strength:135,ranged:135,range:3,tech:'fusion',resource:'uranium',icon:'▰',description:'未来时代重型武器，消耗铀供应与高额军费；远程火力，不能以远程攻击占城。'},","giantdeathrobot:{name:'巨型战斗机甲',cost:650,moves:4,strength:135,ranged:135,range:3,rangedTech:'futuretech',jumpTech:'futuretech',canCapture:true,tech:'fusion',resource:'uranium',icon:'▰',description:'核聚变解锁重型近战机甲；未来科技解锁三格远程火炮与动力跳跃。跳跃消耗 2 移动力，可跨越山水但只能落在合法陆地；远程攻击不能占城。'},");
 s=replace(s,"export function occupationUnit(type)","export function unitHasRanged(player,type){const s=UNITS[type];return !!s?.ranged&&(!s.rangedTech||!!player?.techs?.includes(s.rangedTech));}\nexport function occupationUnit(type)");return s;
});
edit('src/carrier-groups.mjs',s=>replace(s,"export function baseRange(g,u){return ","export function baseRange(g,u){if(UNITS[u.type]?.rangedTech&&!g.players[u.owner]?.techs.includes(UNITS[u.type].rangedTech))return 1;return "));
edit('src/engine.mjs',s=>{
 s="import {unitHasRanged} from './rules.mjs';\n"+s;
 s=replace(s,"ranged=(!!UNITS[u.type].ranged||distance", "ranged=(unitHasRanged(g.players[u.owner],u.type)||distance");
 s=replace(s,"(!!UNITS[u.type].ranged||!!groupFor(g,u,p.id))","(unitHasRanged(p,u.type)||!!groupFor(g,u,p.id))");
 s=replace(s,"ranged:!!UNITS[u.type].ranged&&!unitTransport", "ranged:unitHasRanged(p,u.type)&&!unitTransport");
 s=replace(s,"...projectUnit(g,u,view),...transportStatus", "...projectUnit(g,u,view),ranged:unitHasRanged(g.players[u.owner],u.type),...transportStatus");
 s=replace(s,"    for(const target of attackTargets(g,p,u))", "    for(const tile of jumpTargets(g,p,u))actions.push({type:'jump',unit:u.id,tile:tile.tile,hint:{cost:2}});\n    for(const target of attackTargets(g,p,u))");
 s=replace(s,"  if(type==='rebase'){checkUnit();", "  if(type==='jump'){checkUnit();const target=jumpTargets(g,p,u).find(t=>t.tile===action.tile);if(!target)throw Error('动力跳跃未解锁、移动力不足或落点不合法。');const from=u.tile;u.tile=target.tile;u.moves-=2;u.acted=u.moves<=0;u.fortified=false;stopInZoc(g,u);visitVillage(g,p,u,encounterContext);refreshVisibility(g);if(!unitTransport(u,tileOf(g,u)))delete u.borderExitOwner;visual(g,'move',u,{from,path:[from,u.tile],jump:true,duration:1.1});return;}\n  if(type==='rebase'){checkUnit();");
 const before='export function movementCost(g,p,u,from,to){';
 s=replace(s,before,"export function jumpTargets(g,p,u){\n  if(!UNITS[u.type]?.jumpTech||!has(p,UNITS[u.type].jumpTech)||u.hp<=0||u.acted||u.moves<2||u.activity||linkedPartner(g,u)||movementBlocked(g,u)||(u.moveUntil||0)>gameTime(g)||(u.cooldownUntil||0)>gameTime(g))return [];\n  const from=tileOf(g,u),visible=new Set(p.visible);return g.map.tiles.filter(t=>visible.has(t.id)&&distance(g,from,t)===2&&!isWater(t)&&t.terrain!=='mountain'&&t.cityId===null&&Number.isFinite(movementCost(g,p,u,from,t))).map(t=>({tile:t.id}));\n}\n"+before);
 return s;
});
edit('web/painted-actions.js',s=>replace(s,"// The selected archer releases", "// Both drone roles use the approved new airframe; the attack role retains its real bomb projectile.\nPAINTED_UNITS.drone={...PAINTED_UNITS.observationdrone,muzzle:[.5,.75],workFrames:[0,1,2,3,2,1,0,1]};\n// The selected archer releases"));
edit('web/unit-etchings.js',s=>replace(s,'export const UNIT_ANIMATION_HINTS={',"UNIT_ETCHINGS.drone=['drone','消耗式攻击',UNIT_ETCHINGS.observationdrone[2]];\nexport const UNIT_ANIMATION_HINTS={"));
// The shared glyph now covers the old attack drone without a second raster icon.
edit('web/map3d.js',s=>{
 s=replace(s,'setSimulationState(session){this.simulationClock=',"setSimulationState(session){this.turnPresentation=session.mode==='turns';this.simulationClock=");
 s=replace(s,'get actionTime(){if(!this.game?.realtime)',"get actionTime(){if(this.turnPresentation)return performance.now()/1000;if(!this.game?.realtime)");
 s=replace(s,'if(game.realtime||reset||returned.has(u.id)',"if(game.realtime&&game.settings?.playMode!=='turns'||reset||returned.has(u.id)");
 s=replace(s,'this.effects.push({...e,started:game.realtime?e.time:now+delay,duration});',"this.effects.push({...e,started:game.realtime&&game.settings?.playMode!=='turns'?e.time:now+delay,duration});");
 return s;
});
