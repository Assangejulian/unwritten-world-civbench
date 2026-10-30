import {unitDetected} from './movement-rules.mjs';
import * as E from './engine.mjs';
import {UNITS,dist,isWater,unitTransport,veteranChoices,improvementFor,canChop} from './rules.mjs';
import {religionActions} from './religion.mjs';
import {fieldActions} from './warfare.mjs';
import {civilianMissionActions} from './civilian-missions.mjs';

// Owner-scoped, derived UI work. There is no saved task queue and no foreign army scan.
export function playerTasks(g,view){
 const p=g.players[view],time=g.realtime?.time??g.turn*20;
 const active=!!p?.manual&&p.alive&&(!g.turnOrder||g.turnOrder.order[g.turnOrder.index]===view);
 const result={player:view,active,tasks:[],unitActions:{}};if(!active||g.winner)return result;
 const own=g.cities.filter(c=>c.owner===view),visible=new Set(p.visible);
 for(const c of E.cityDispositionOptions(g,p))result.tasks.push({id:'capture:'+c.city,kind:'capture',city:c.city,tile:c.tile,title:'城市占领处置',subtitle:c.name,choices:[{label:'占领城市',action:{type:'keepCity',city:c.city}},{label:'摧毁城市',disabled:!c.canRaze,reason:c.reason||'摧毁城市及其中的建筑、巨作，原有领土恢复无主。',action:{type:'razeCity',city:c.city}}]});
 if(religionActions(g,p).some(a=>a.type==='pantheon'))result.tasks.push({id:'pantheon',kind:'pantheon',title:'选择万神殿',subtitle:'信仰已足够',modal:'religion'});
 for(const c of own){
  const nearby=g.units.filter(u=>u.owner!==view&&!UNITS[u.type].civilian&&E.atWar(g,view,u.owner)&&visible.has(u.tile)&&u.hp>0&&dist(g.map.tiles[c.tile],g.map.tiles[u.tile],g.map)<=2&&unitDetected(g,u,view));const targets=nearby.filter(u=>E.canCityAttackUnit(g,p,c,u));
  if(nearby.length)result.tasks.push({id:'defense:'+c.id,kind:'defense',city:c.id,tile:c.tile,title:targets.length?'城市可攻击':'敌军逼近',subtitle:c.name,command:'cityAttack',targets:targets.map(u=>u.id)});
  if(!c.capturePending&&!c.production&&E.productionOptions(g,p,c).length)result.tasks.push({id:'production:'+c.id,kind:'production',city:c.id,tile:c.tile,title:'选择城市生产',subtitle:c.name});
 }
 for(const u of g.units.filter(u=>u.owner===view&&u.hp>0)){
  const s=UNITS[u.type],t=g.map.tiles[u.tile],ready=!u.activity&&!u.acted&&u.moves>0&&(u.cooldownUntil||0)<=time,actions=[];
  if(ready&&!u.moveOrder){
   if(!s.civilian)actions.push({label:'警戒待命',icon:'alert',action:{type:'alert',unit:u.id}});
   if(u.type==='settler'&&!unitTransport(u,t)&&E.canSettle(g,p,t))actions.push({label:'建造城市',icon:'capture',action:{type:'found',unit:u.id}});
   for(const op of E.unitUpgradeOptions(g,p,u).filter(o=>o.available))actions.push({label:'升级为'+UNITS[op.item].name,icon:'upgrade',action:{type:'upgrade',unit:u.id,item:op.item,expectedCost:op.goldCost}});
   for(const key of veteranChoices(u))if(E.canTrainVeteran(g,p,u,key))actions.push({label:'专长晋升',icon:'promotion',command:'trainVeteran',item:key});
   if(u.type==='builder'&&!unitTransport(u,t)&&t.owner===view){const item=improvementFor(p,t);if(item)actions.push({label:'修建改良',icon:'production',action:{type:'improve',unit:u.id,item}});if(canChop(p,t)&&own.some(c=>dist(t,g.map.tiles[c.tile],g.map)<=3))actions.push({label:'清理地貌',icon:'work',command:'chop'});}
   for(const a of fieldActions(g,p,u))actions.push({label:{buildFort:'建造堡垒',buildRoad:'铺设道路',repair:'修复设施',pillage:'掠夺',destroyRoad:'拆除道路',destroyFort:'拆除堡垒'}[a.type]||a.type,icon:'work',action:{type:a.type,unit:u.id}});
   for(const a of civilianMissionActions(g,p,u,{buildable:E.buildable}))actions.push({label:{excavate:'发掘文物',establishPark:'建立国家公园',concert:'举办巡演',religiousHeal:'治疗宗教单位'}[a.type],icon:'work',action:a});
   if(s.religious&&!s.religiousHealer&&E.religionTargets(g,p,u).length)actions.push({label:'传播信仰',icon:'pantheon',command:'spread'});
   if(s.medical&&E.healingTargets(g,p,u).length)actions.push({label:'治疗伤员',icon:'work',command:'heal'});
   if(s.jumpTech&&p.techs.includes(s.jumpTech)&&E.jumpTargets(g,p,u).length)actions.push({label:'动力跳跃',icon:'jump',command:'jump'});
   result.tasks.push({id:'unit:'+u.id,kind:'unit',unit:u.id,tile:u.tile,title:'单位需要命令',subtitle:s.name,moves:u.moves,actions});
  }
  if(u.moveOrder)actions.push({label:'取消行军',icon:'unit',action:{type:'cancelRoute',unit:u.id}});if(u.stance==='alert')actions.push({label:'解除警戒',icon:'unit',action:{type:'wake',unit:u.id}});result.unitActions[u.id]=actions;
 }
 if(!p.research)result.tasks.push({id:'research',kind:'research',title:'选择科技',modal:'tech'});
 if(!p.civic)result.tasks.push({id:'civic',kind:'civic',title:'选择市政',modal:'civic'});
 const congress=g.congress?.current;if(congress?.participants.includes(view)&&congress.agenda.some(a=>a.ballots[view]===undefined))result.tasks.push({id:'congress:'+congress.id,kind:'congress',title:'大会等待投票',subtitle:'第 '+congress.closesTurn+' 回合截止',modal:'congress'});
 return result;
}
