// Deterministic village rewards and slow, guarded barbarian encampments.
import {TECHS,CIVICS,UNITS,RESOURCES,dist,isWater,gamePace,civilizationEra} from './rules.mjs';
import {neighbors,tilesInRange,random,gameRandom,seedNumber} from './world.mjs';
import {baseItem} from './unique-content.mjs';

export const ENCOUNTER_RULES={version:1,barbarianCap:24,campCap:10,newCampMin:18,newCampMax:30,reinforceMin:8,reinforceMax:14};
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const integer=(n,lo=0,hi=1e9)=>Number.isSafeInteger(n)&&n>=lo&&n<=hi;
const land=t=>!isWater(t)&&!['mountain','snow'].includes(t.terrain);
const pace=g=>Math.max(.25,gamePace(g).factor);
const roll=(g,min,max)=>Math.max(1,Math.round((min+Math.floor(gameRandom(g.encounters)*(max-min+1)))*pace(g)));
const campDelay=g=>roll(g,ENCOUNTER_RULES.newCampMin,ENCOUNTER_RULES.newCampMax);
const reinforceDelay=g=>roll(g,ENCOUNTER_RULES.reinforceMin,ENCOUNTER_RULES.reinforceMax);
const vacant=(g,t)=>land(t)&&!t.naturalWonder&&t.owner==null&&t.cityId==null&&!t.district&&!t.construction&&!t.fort&&!t.improvement&&!t.resource&&!t.village&&!t.ruin&&!g.units.some(u=>u.hp>0&&(u.tile===t.id||u.activity?.to===t.id));

export function publicEncounterTile(tile){const {campNextTurn,...record}=tile;return record;}
export function validateEncounters(g){
 if(g.encounters!==undefined&&(!object(g.encounters)||g.encounters.version!==1||!integer(g.encounters.rngState,0,0xffffffff)||!integer(g.encounters.nextCampTurn)))throw Error('Invalid world encounter schedule.');
 for(const t of g.map.tiles){if(t.village!==undefined&&typeof t.village!=='boolean'||t.campNextTurn!==undefined&&!integer(t.campNextTurn))throw Error('Invalid village or camp schedule.');}
 for(const p of g.players)if(p.villageResources!==undefined&&(!object(p.villageResources)||Object.entries(p.villageResources).some(([k,n])=>RESOURCES[k]?.category!=='strategic'||!integer(n,0,1000))))throw Error('Invalid village strategic reserves.');
}
export function initializeEncounters(g,{populate=false}={}){
 if(g.encounters)return;
 g.encounters={version:1,rngState:seedNumber(g.seed+':encounters'),nextCampTurn:0};
 g.encounters.nextCampTurn=g.turn+campDelay(g);
 if(populate){
  const rng=random(g.seed+':villages'),seen=new Set(g.players.flatMap(p=>p.explored||[])),villages=g.map.tiles.filter(t=>t.village);
  for(const t of g.map.tiles){
   if(seen.has(t.id)||!vacant(g,t)||t.camp||g.units.some(u=>dist(t,g.map.tiles[u.tile],g.map)<3)||g.cities.some(c=>dist(t,g.map.tiles[c.tile],g.map)<4)||villages.some(v=>dist(t,v,g.map)<3)||rng()>.018)continue;
   t.village=true;villages.push(t);
  }
 }
 for(const t of g.map.tiles)if(t.camp)t.campNextTurn=g.turn+reinforceDelay(g);
 clearEmptyCamps(g);
}
export function isCampGuard(g,u){return u.owner===-1&&!u.mutiny&&!!g.map.tiles[u.tile]?.camp;}
export function clearEmptyCamps(g,{event,credit}={}){
 const guarded=new Set(g.units.filter(u=>u.owner===-1&&!u.mutiny&&u.hp>0).map(u=>u.tile));
 for(const t of g.map.tiles)if(t.camp&&!guarded.has(t.id)){
  t.camp=false;delete t.campNextTurn;
  if(credit?.tiles?.has(t.id)&&g.players[credit.owner]){g.players[credit.owner].gold+=35;event?.(g,'military',`${g.players[credit.owner].short} 清除了蛮族营寨，获得 35 金币。`,credit.owner,t.id);}
 }
}
// Compare actual researched knowledge, not turn number or the nominal era label.
const technologyCache=new WeakMap();
export function barbarianTechnology(g){
 const signature=g.players.map(p=>p.id+':'+p.alive+':'+(p.techs||[]).join(',')).join('|'),cached=technologyCache.get(g);if(cached?.signature===signature)return cached.value;
 const weight=p=>(p.techs||[]).reduce((n,k)=>n+(TECHS[k]?.cost||0),0);
 const leader=g.players.filter(p=>p.alive).sort((a,b)=>weight(b)-weight(a)||a.id-b.id)[0];
 const budget=Math.floor(weight(leader||{techs:[]})*.75),techs=[];let spent=0;
 const remaining=new Set(leader?.techs||[]);let changed=true;
 while(changed){changed=false;for(const key of [...remaining].sort((a,b)=>(TECHS[a]?.era||0)-(TECHS[b]?.era||0)||(TECHS[a]?.cost||0)-(TECHS[b]?.cost||0)||a.localeCompare(b))){
  const spec=TECHS[key];if(!spec){remaining.delete(key);continue;}
  if(spec.requires.every(k=>techs.includes(k))&&spent+spec.cost<=budget){techs.push(key);spent+=spec.cost;remaining.delete(key);changed=true;}
 }}
 const value={techs,budget,spent,leader:leader?.id??null};technologyCache.set(g,{signature,value});return value;
}
export function barbarianPlayer(g,unit={}){return {id:-1,alive:true,short:unit.mutiny?'叛军':'蛮族',techs:barbarianTechnology(g).techs,civics:[],policies:[],boosts:[],inspirations:[],visible:g.map.tiles.map(t=>t.id),relations:{}};}
function barbarianModel(g,{guard=false}={}){
 const techs=new Set(barbarianTechnology(g).techs);
 const models=Object.entries(UNITS).filter(([key,s])=>!s.civilian&&!s.heritage&&baseItem(key)===key&&(s.domain||'land')==='land'&&!s.siege&&!s.airOnly&&!s.building&&!s.civic&&(!s.tech||techs.has(s.tech))&&(!guard||!s.ranged));
 models.sort((a,b)=>Math.max(b[1].strength||0,b[1].ranged||0)-Math.max(a[1].strength||0,a[1].ranged||0));
 return models[0]?.[0]||'warrior';
}
export function encountersTurn(g,ctx){
 initializeEncounters(g);clearEmptyCamps(g,{event:ctx.event});
 if(!g.settings.barbarians)return;
 let count=g.units.filter(u=>u.hp>0&&u.owner===-1&&!u.mutiny).length;
 const camps=g.map.tiles.filter(t=>t.camp);
 for(const t of camps){
  t.campNextTurn??=g.turn+reinforceDelay(g);
  if(g.turn<t.campNextTurn)continue;
  t.campNextTurn=g.turn+reinforceDelay(g);
  if(g.units.length>=2000||count>=ENCOUNTER_RULES.barbarianCap||g.units.filter(u=>u.owner===-1&&!u.mutiny&&u.hp>0&&dist(t,g.map.tiles[u.tile],g.map)<=3).length>=4)continue;
  const sites=neighbors(g.map,t).filter(n=>vacant(g,n)&&!n.camp&&ctx.deploymentFree(g,n.id));
  if(sites.length){const spawn=sites[Math.floor(gameRandom(g.encounters)*sites.length)];ctx.addUnit(g,-1,barbarianModel(g),spawn.id);count++;}
 }
 if(g.turn<g.encounters.nextCampTurn)return;
 g.encounters.nextCampTurn=g.turn+campDelay(g);
 if(g.units.length>=2000||camps.length>=ENCOUNTER_RULES.campCap||count>=ENCOUNTER_RULES.barbarianCap)return;
 const visible=new Set(g.players.filter(p=>p.alive).flatMap(p=>p.visible||[]));
 const sites=g.map.tiles.filter(t=>!visible.has(t.id)&&!t.camp&&vacant(g,t)&&ctx.deploymentFree(g,t.id)&&g.cities.every(c=>dist(t,g.map.tiles[c.tile],g.map)>=5)&&camps.every(c=>dist(t,c,g.map)>=5));
 if(sites.length){const t=sites[Math.floor(gameRandom(g.encounters)*sites.length)];t.camp=true;t.campNextTurn=g.turn+reinforceDelay(g);ctx.addUnit(g,-1,barbarianModel(g,{guard:true}),t.id);}
}

function rewardContext(g,p,u,ctx){
 const t=g.map.tiles[u.tile],cities=g.cities.filter(c=>c.owner===p.id).sort((a,b)=>dist(t,g.map.tiles[a.tile],g.map)-dist(t,g.map.tiles[b.tile],g.map)||a.id-b.id),city=cities[0];
 const known=k=>p.techs.includes(k)||p.civics.includes(k);
 const technologies=Object.keys(TECHS).filter(k=>!p.techs.includes(k)&&!p.boosts.includes(k)&&TECHS[k].requires.every(known));
 const civics=Object.keys(CIVICS).filter(k=>!p.civics.includes(k)&&!p.inspirations.includes(k)&&CIVICS[k].requires.every(known));
 const strategic=Object.keys(RESOURCES).filter(k=>RESOURCES[k].category==='strategic'&&(!RESOURCES[k].tech||known(RESOURCES[k].tech))&&(p.villageResources?.[k]||0)<=980);
 const spawn=city&&tilesInRange(g.map,g.map.tiles[city.tile],2).find(n=>n.owner===p.id&&!isWater(n)&&n.terrain!=='mountain'&&ctx.deploymentFree(g,n.id));
 const military=!UNITS[u.type].civilian&&!u.greatPerson,upgrades=military?ctx.freeUpgrades?.(g,p,u)||[]:[];
 const rewards=[{key:'gold',weight:20},{key:'faith',weight:16}];
 if(technologies.length)rewards.push({key:'eureka',weight:16});
 if(civics.length)rewards.push({key:'inspiration',weight:12});
 if(military)rewards.push({key:'experience',weight:10});
 if(military&&u.hp<ctx.maxUnitHp(u.type))rewards.push({key:'healing',weight:8});
 if(upgrades.length)rewards.push({key:'upgrade',weight:6});
 if(city&&city.population<100)rewards.push({key:'population',weight:10});
 if(spawn&&g.units.length<2000)rewards.push({key:'builder',weight:10},{key:'scout',weight:5});
 if(strategic.length)rewards.push({key:'resources',weight:10});
 return {rewards,city,spawn,technologies,civics,strategic,upgrades};
}
export const villageRewardOptions=(g,p,u,ctx)=>rewardContext(g,p,u,ctx).rewards;
export function visitVillage(g,p,u,ctx){
 const t=g.map.tiles[u.tile];if(!t.village||!g.players[p?.id]||u.owner!==p.id)return null;
 const c=rewardContext(g,p,u,ctx),total=c.rewards.reduce((n,r)=>n+r.weight,0);let pick=gameRandom(g)*total,reward=c.rewards.at(-1);
 for(const r of c.rewards){pick-=r.weight;if(pick<0){reward=r;break;}}
 const choose=a=>a[Math.floor(gameRandom(g)*a.length)],era=civilizationEra(p);let detail='';
 switch(reward.key){
  case 'gold':{const n=Math.round((40+era*15)*pace(g));p.gold+=n;detail=`获得 ${n} 金币`;break;}
  case 'faith':{const n=Math.round((25+era*10)*pace(g));p.faith+=n;detail=`获得 ${n} 信仰`;break;}
  case 'eureka':{const key=choose(c.technologies);ctx.boost(g,p,key);detail=`触发「${TECHS[key].name}」尤里卡`;break;}
  case 'inspiration':{const key=choose(c.civics);ctx.inspire(g,p,key);detail=`获得「${CIVICS[key].name}」市政灵感`;break;}
  case 'experience':ctx.gainExperience(g,u,25-(u.xp||0)%25);detail='探索单位获得经验并晋升一级';break;
  case 'healing':u.hp=ctx.maxUnitHp(u.type);detail='探索单位恢复全部生命';break;
  case 'upgrade':{const item=choose(c.upgrades);u.type=item;u.hp=Math.min(u.hp,ctx.maxUnitHp(item));ctx.ageRecord?.(g,p,['upgrade'],`upgrade:${u.id}:${item}`);detail=`探索单位免费升级为${UNITS[item].name}`;break;}
  case 'population':c.city.population++;ctx.updateFollowers(g,c.city);detail=`${c.city.name} 增加 1 人口`;break;
  case 'builder':case 'scout':ctx.addUnit(g,p.id,reward.key,c.spawn.id);detail=`${c.city.name} 获得 1 名${UNITS[reward.key].name}`;break;
  case 'resources':{const key=choose(c.strategic);p.villageResources??={};p.villageResources[key]=(p.villageResources[key]||0)+20;detail=`获得 20 单位${RESOURCES[key].name}储备，每周期提供 1 份供应`;break;}
 }
 t.village=false;
 if(baseItem(u.type)==='scout'&&reward.key!=='experience')ctx.gainExperience(g,u,5);
 ctx.event(g,'explore',`${p.short} 访问部落村庄：${detail}。`,p.id,t.id);
 return {kind:reward.key,detail};
}
export function villageSupplies(p){return Object.fromEntries(Object.entries(p.villageResources||{}).filter(([,n])=>n>0).map(([k])=>[k,1]));}
export function spendVillageReserves(g){for(const p of g.players)for(const [key,n]of Object.entries(p.villageResources||{})){if(n<=1)delete p.villageResources[key];else p.villageResources[key]=n-1;}}
