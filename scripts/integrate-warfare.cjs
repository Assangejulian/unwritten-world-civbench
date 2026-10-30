const fs=require('node:fs');
function edit(file,fn){let text=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');function replace(from,to){if(!text.includes(from))throw new Error('Missing integration anchor in '+file+': '+from.slice(0,70));text=text.replace(from,to);}fn(replace);fs.writeFileSync(file,text);}
edit('src/rules.mjs',r=>{
 r("export const UNITS = {","export const UNITS = {\n  envoy:{name:'来使',cost:0,moves:3,strength:0,civilian:true,vision:2,icon:'☀'},");
 r("export const BUILDINGS = {","export const BUILDINGS = {\n  barracks:district('军营',65,{production:2},{tech:'bronze'},'军事训练区域；此城新训练陆军获得 +3 战斗力。可被掠夺并修复。'),");
 r("const resource=RESOURCES[tile.resource],imp=IMPROVEMENTS[tile.improvement];","const resource=tile.pillaged?null:RESOURCES[tile.resource],imp=tile.pillaged?null:IMPROVEMENTS[tile.improvement];");
 r("if(tile.improvement==='farm'){","if(!tile.pillaged&&tile.improvement==='farm'){");r("if(tile.improvement==='mine'){","if(!tile.pillaged&&tile.improvement==='mine'){");
});
edit('src/engine.mjs',r=>{
 r("import {historicalIdentity,historicalNation} from './nations.mjs';","import {historicalIdentity,historicalNation} from './nations.mjs';\nimport {initializeWarfare,canEnterTerritory,protectedEnvoy,peaceRemaining,diplomaticSummary,publicDiplomacy,beginWar,propose,answerProposal,sendEnvoy,envoyArrival,envoyKilled,capitalAgenda,diplomacyTurn,fortressStatus,fieldActions,applyFieldAction,roadMultiplier,timeOf,aidAssessment,voteAid} from './warfare.mjs';");
 r("recordHistory(g);return g;","initializeWarfare(g);recordHistory(g);return g;");
 r("t.improvement===r.improvement&&","!t.pillaged&&t.improvement===r.improvement&&");
 r("const b=BUILDINGS[item]||WONDERS[item];if(b)","const b=BUILDINGS[item]||WONDERS[item];if(c.districts.some(d=>d.item===item&&g.map.tiles[d.tile].pillaged))continue;if(b)");
 r("for(const d of c.districts){const bonus=","for(const d of c.districts){if(g.map.tiles[d.tile].pillaged)continue;const bonus=");
 r("const spec=PRODUCTION[item];if(!spec||!eligible(p,spec))return false;","const spec=PRODUCTION[item];if(item==='envoy'||!spec||!eligible(p,spec))return false;");
 r("t.cityId!==null||t.district||t.terrain==='mountain'","t.cityId!==null||t.district||t.fort||t.terrain==='mountain'");
 r("const spec=UNITS[u.type];if(to.terrain==='mountain')return Infinity;","const spec=UNITS[u.type];if(to.terrain==='mountain'||!canEnterTerritory(g,u,to))return Infinity;");
 r("if(to.cityId!==null&&to.owner!==u.owner)return Infinity;","if(to.cityId!==null&&to.owner!==u.owner&&!(u.type==='envoy'&&u.envoy?.capital===to.cityId))return Infinity;");
 r("if(g.units.some(x=>x.owner!==u.owner&&x.tile===to.id&&x.hp>0))return Infinity;","if(!protectedEnvoy(u)&&g.units.some(x=>x.owner!==u.owner&&x.tile===to.id&&x.hp>0&&!(x.type==='envoy'&&x.envoy?.state==='arrived')))return Infinity;");
 r("return isWater(to)?1:1+(to.hill||to.feature?1:0)+(to.river&&!from.river&&p&&!has(p,'engineering')?1:0);","return isWater(to)?1:(1+(to.hill||to.feature?1:0)+(to.river&&!from.river&&p&&!has(p,'engineering')?1:0))*roadMultiplier(g,p,u,from,to);");
 r("export function reachable(g,p,u,includePaths=false){","export function reachable(g,p,u,includePaths=false){\n  if(g.realtime&&(u.moveUntil||0)>g.realtime.time)return [];\n  if(u.type==='envoy'&&u.envoy?.state!=='travelling')return [];");
 r("let value=s.strength+(u.level||0)*3", "let value=s.strength+(u.training||0)+(u.level||0)*3");
 r("if(t.hill)value+=3;", "if(t.fort?.owner===u.owner&&t.fort.hp>0)value+=6;if(t.hill)value+=3;");
 r("g.units.filter(t=>t.owner!==p.id&&atWar", "g.units.filter(t=>!protectedEnvoy(t)&&t.owner!==p.id&&atWar");
 r("if(c.walls>0&&!c.attacked)for(const u of g.units.filter(u=>u.owner!==p.id", "if(c.walls>0&&!c.attacked)for(const u of g.units.filter(u=>!protectedEnvoy(u)&&u.owner!==p.id");
 r("const spec=UNITS[u.type],t=tileOf(g,u);if(u.acted||u.moves<=0)continue;", "const spec=UNITS[u.type],t=tileOf(g,u);if(u.acted||u.moves<=0)continue;\n    actions.push(...fieldActions(g,p,u));");
 r("hint:{cost:move.cost,...preview,exploration,", "hint:{cost:move.cost,...preview,envoyDistance:u.type==='envoy'?distance(g,dest,g.map.tiles[g.cities.find(c=>c.id===u.envoy.capital)?.tile??u.tile]):50,exploration,");
 const start="    if(relation.status==='peace'&&g.turn-relation.since>10)";const end="    if(relation.status==='peace'&&has(p,'civilservice')&&has(other,'civilservice'))actions.push({type:'alliance',player:id});";
 const source=fs.readFileSync('src/engine.mjs','utf8').replaceAll('\r\n','\n');const old=source.slice(source.indexOf(start),source.indexOf(end)+end.length);
 r(old,`    const diplomacy=diplomaticSummary(g,p,other),hint={...assessment,...diplomacy,duration:g.turn-relation.since,turn:g.turn};
    if(relation.status==='peace'&&gameTime(g)>=(relation.truceUntil||0)&&g.turn-relation.since>=4)actions.push({type:'war',player:id,hint});
    if(relation.status==='war'){
      if(peaceRemaining(g,p.id,id)===0)actions.push({type:'peace',player:id,hint});
      if(p.gold>=10&&gameTime(g)>=(p.envoyReadyAt||0)&&!g.units.some(u=>u.owner===p.id&&u.type==='envoy'&&u.envoy.target===id)&&g.cities.some(c=>c.id===other.capital&&c.owner===id&&p.knownCities?.[c.id]))actions.push({type:'sendEnvoy',player:id,hint});
    }
    if(relation.status==='peace'&&!g.diplomacy?.proposals.some(o=>o.from===p.id&&o.to===id&&o.status==='pending')){
      if(!relation.openBorders)actions.push({type:'openBorders',player:id,hint});
      if(has(p,'civilservice')&&has(other,'civilservice'))actions.push({type:'alliance',player:id,hint});
    }
    if(relation.openBorders&&relation.status==='peace')actions.push({type:'closeBorders',player:id,hint});`);
 r("  return actions;\n}\n\nexport function applyAction",`  for(const offer of g.diplomacy?.proposals||[])if(offer.to===p.id&&offer.status==='pending'&&offer.expiresAt>=gameTime(g)){actions.push({type:'rejectDiplomacy',proposal:offer.id});if(offer.kind!=='peace'||peaceRemaining(g,p.id,offer.from)===0)actions.push({type:'acceptDiplomacy',proposal:offer.id});}
  for(const agenda of g.diplomacy?.agendas||[])if(agenda.status==='voting'&&gameTime(g)<agenda.endsAt&&p.id!==agenda.attacker&&p.id!==agenda.defender&&!agenda.votes[p.id]&&p.met.includes(agenda.attacker)&&p.met.includes(agenda.defender))for(const choice of ['observe',...(p.gold>=30?['aid']:[]),...(p.relations[agenda.attacker]?.status==='peace'&&gameTime(g)>=(p.relations[agenda.attacker].truceUntil||0)?['join']:[])])actions.push({type:'voteAid',agenda:agenda.id,choice,hint:aidAssessment(g,p,agenda)});
  return actions;
}

export function applyAction`);
 r("const checkUnit=()=>{if(!u||u.hp<=0||u.acted||u.moves<=0)", "const checkUnit=()=>{if(!u||u.hp<=0||u.acted||u.moves<=0||g.realtime&&(u.cooldownUntil||0)>gameTime(g))");
 r("  if(type==='leaderAbility'){",`  if(['buildFort','buildRoad','repair','pillage','destroyRoad','destroyFort'].includes(type)){checkUnit();applyFieldAction(g,p,u,type,event);refreshVisibility(g);return;}
  if(type==='sendEnvoy'){sendEnvoy(g,p,action.player,addUnit,event);refreshVisibility(g);return;}
  if(type==='acceptDiplomacy'||type==='rejectDiplomacy'){answerProposal(g,p,action.proposal,type==='acceptDiplomacy',event);return;}
  if(type==='voteAid'){voteAid(g,p,action.agenda,action.choice,event);return;}
  if(type==='closeBorders'){const r=p.relations[action.player];if(!r||r.status!=='peace'||!r.openBorders)throw new Error('没有可撤销的开放边界协议。');r.openBorders=false;g.players[action.player].relations[p.id].openBorders=false;p.planRevision++;g.players[action.player].planRevision++;return;}
  if(type==='leaderAbility'){`);
 r("const tile=tileOf(g,u);if(tile.ruin)", "const tile=tileOf(g,u);envoyArrival(g,u,event);if(tile.ruin)");
 r("if(enemy.hp<=0){if(!UNITS[enemy.type].civilian)", "if(enemy.hp<=0){envoyKilled(g,enemy,p.id,event);if(!UNITS[enemy.type].civilian)");
 r("const old=enemy.owner;enemy.owner=p.id;", "const old=enemy.owner;capitalAgenda(g,p.id,old,enemy,event);enemy.owner=p.id;");
 r("!enemy||!atWar(g,p.id,enemy.owner)", "!enemy||protectedEnvoy(enemy)||!atWar(g,p.id,enemy.owner)");
 r("c.attacked=true;cleanUnits(g);return;", "c.attacked=true;if(enemy.hp<=0)envoyKilled(g,enemy,p.id,event);cleanUnits(g);return;");
 const dipStart="  if(['war','peace','alliance'].includes(type)){",dipEnd="  if(type==='religion'){";const oldDip=source.slice(source.indexOf(dipStart),source.indexOf(dipEnd));
 r(oldDip,`  if(['war','peace','alliance','openBorders'].includes(type)){
    const other=g.players[action.player];if(!other||!legalActions(g,p).some(a=>a.type===type&&a.player===other.id))throw new Error('此外交行动当前不可用。');
    if(type==='war')beginWar(g,p,other,event);else propose(g,p,other.id,type,event);return;
  }
`);
 r("const u=addUnit(g,p.id,item,spawn.id);u.moves=0;", "const u=addUnit(g,p.id,item,spawn.id);if(!spec.civilian&&spec.domain!=='sea'&&c.buildings.includes('barracks')&&!c.districts.some(d=>d.item==='barracks'&&g.map.tiles[d.tile].pillaged))u.training=3;u.moves=0;");
 r("g.units.filter(t=>t.owner>=0&&distance(g,here,tileOf(g,t))<=1)","g.units.filter(t=>!protectedEnvoy(t)&&t.owner>=0&&distance(g,here,tileOf(g,t))<=1)");
 r("  refreshVisibility(g);checkVictory(g);recordHistory(g);", "  diplomacyTurn(g,event);refreshVisibility(g);checkVictory(g);recordHistory(g);");
 r("return {realtime:g.realtime?", "return {diplomacy:publicDiplomacy(g,p.id),fortresses:fortressStatus(g,p),realtime:g.realtime?");
 r("return {realtime:g.realtime?", "return {diplomacy:publicDiplomacy(g,view),realtime:g.realtime?");
 r("leaderAbility:o.leaderAbility,doctrineReadyAt", "fortresses:fortressStatus(g,o),warWeariness:o.warWeariness||0,envoyReadyAt:o.envoyReadyAt||0,leaderAbility:o.leaderAbility,doctrineReadyAt");
 r("indexMap(g.map);refreshVisibility(g);return g;", "indexMap(g.map);initializeWarfare(g);refreshVisibility(g);return g;");
});
edit('src/realtime.mjs',r=>{
 r("import {UNIT_MOTIONS} from '../web/visuals.js';", "import {UNIT_MOTIONS} from '../web/visuals.js';\nimport {unitCooldown,ACTION_LIMITS,fortressStatus,maintainFortresses,protectedEnvoy} from './warfare.mjs';");
 r("'upgrade','spread']);", "'upgrade','spread','buildFort','buildRoad','repair','pillage','destroyRoad','destroyFort']);");
 r("const cooldown=a=>['move','attack','cityAttack','fortify'].includes(a.type)?.15:2;", "const cooldown=a=>['move','attack','cityAttack','fortify'].includes(a.type)?.4:2;");
 r("['cooldownUntil','attackUntil','healUntil']", "['cooldownUntil','moveUntil','attackUntil','healUntil']");
 r("a.ends>r.time+30", "a.ends>r.time+180");
 r("u.cooldownUntil=this.game.realtime.time+.15", "u.cooldownUntil=this.game.realtime.time+unitCooldown(u.type,'move');u.moveUntil=u.cooldownUntil");
 r("a.owner=u.owner;a.from", "a.owner=u.owner;a.from");
 r("    if(!timed.has(a.type)){applyAction(g,p,a);return true;}",`    if(!timed.has(a.type)){applyAction(g,p,a);return true;}
    if(entity){const active=g.units.filter(x=>x.activity);if(active.length>=ACTION_LIMITS.active||active.filter(x=>x.owner===p.id).length>=ACTION_LIMITS.perNation||a.type==='move'&&active.filter(x=>x.activity.action.type==='move').length>=ACTION_LIMITS.moving)return false;}`);
 r("if(a.type==='move'){\n      const move", "if(a.type==='move'){\n      if((u.moveUntil||0)>r.time)return false;\n      const move");
 r("ends:r.time+impactDuration(a,u?.type||'city')", "ends:r.time+(a.type==='buildFort'?fortressStatus(g,p).seconds:a.type==='destroyFort'?6:impactDuration(a,u?.type||'city'))");
 r("if(a.action.type==='attack'||a.action.type==='cityAttack')entity.attackUntil=r.time+3;", "if(a.action.type==='move')entity.moveUntil=r.time+unitCooldown(entity.type,'move');if(a.action.type==='attack'||a.action.type==='cityAttack')entity.attackUntil=r.time+unitCooldown(entity.type||'city','attack');");
 r("      if(this.ready())changed=true;", "      if(this.ready())changed=true;\n      if(Math.round(r.time/STEP)%20===0&&maintainFortresses(g))changed=true;");
});
