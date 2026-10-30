import {heritageEffects} from './heritage.mjs';
import {UNITS,TECHS,GOVERNMENTS,dist,isWater,productionCost,improvementFor,unitHasRanged} from './rules.mjs';
import {neighbors,tilesInRange} from './world.mjs';
import {activeGovernor} from './governors.mjs';
export const CITY_STATE_TYPES={science:{color:'#8db9db',name:'学术',yield:'science',district:'campus'},culture:{color:'#c5a0db',name:'文化',yield:'culture',district:'theater'},religion:{color:'#e1d8bc',name:'宗教',yield:'faith',district:'holy'},trade:{color:'#e1c268',name:'商业',yield:'gold',district:'commercial'},industry:{color:'#d6a16c',name:'工业',yield:'production',district:'industrial'},military:{color:'#d69391',name:'军事',yield:'production',district:'barracks'}};
const NAMES=['日内瓦','桑给巴尔','库马西','哈图沙','南马都尔','瓦莱塔','博洛尼亚','拉文塔','卡霍基亚','塔鲁加'];
const time=g=>g.realtime?.time??g.turn*20;
const int=(n,max=1e9)=>Number.isInteger(n)&&n>=0&&n<=max;
const military=p=>Object.values(p.relations).some(r=>r.status==='war');
export const cityStateOwner=id=>-id-1;
export const stateForOwner=(g,owner)=>owner<=-2?g.cityStates?.states.find(s=>cityStateOwner(s.id)===owner&&s.capturedBy===null):null;
export function ownersAtWar(g,a,b){
 if(a===b)return false;if(a===-1||b===-1)return true;
 const state=stateForOwner(g,a),other=stateForOwner(g,b);
 if(state)return b>=0&&state.wars.includes(b);
 if(other)return a>=0&&other.wars.includes(a);
 return g.players[a]?.relations[b]?.status==='war';
}
// City-states have no civic tree; their existing population progression is the gate.
export const cityStateBordersClosed=s=>s.population>=3;
function statePlayer(g,s){
 const leader=g.players.filter(p=>p.alive).sort((a,b)=>b.techs.length-a.techs.length||a.id-b.id)[0];
 return {id:cityStateOwner(s.id),alive:true,short:s.name,techs:leader?.techs||[],civics:[],policies:[],boosts:[],inspirations:[],relations:{},explored:s.territory,visible:g.map.tiles.filter(t=>dist(t,g.map.tiles[s.tile],g.map)<=4).map(t=>t.id),faith:0,gold:0,planRevision:0,doctrine:'balanced'};
}
export function initializeCityStates(g,{seed=false}={}){
 g.cityStates??={version:1,states:[],seeded:false};const state=g.cityStates;if(state.version!==1||!Array.isArray(state.states)||state.states.length>12||new Set(state.states.map(s=>s.id)).size!==state.states.length||state.states.some(s=>s.id===0)||typeof state.seeded!=='boolean')throw Error('Invalid city states.');
 for(const s of state.states)if(!int(s.id)||!g.map.tiles[s.tile]||!CITY_STATE_TYPES[s.type]||typeof s.name!=='string'||!Number.isFinite(s.hp)||s.hp<0||s.hp>200||!Array.isArray(s.met)||s.met.some(id=>!g.players[id])||!s.envoys||typeof s.envoys!=='object'||Object.entries(s.envoys).some(([id,n])=>!g.players[id]||!int(n,100))||!Array.isArray(s.wars)||s.wars.some(id=>!g.players[id])||s.capturedBy!==null&&!g.players[s.capturedBy])throw Error('Invalid city state.');
 for(const p of g.players){p.envoys??=0;p.influence??=0;if(!int(p.envoys,100)||!Number.isFinite(p.influence)||p.influence<0||p.influence>1000)throw Error('Invalid envoy reserve.');}
 if(seed&&!state.seeded){state.seeded=true;const excluded=new Set(g.players.flatMap(p=>p.explored)),count=Math.min(8,Math.max(2,Math.floor(g.map.tiles.length/800))),types=Object.keys(CITY_STATE_TYPES);for(let i=0;i<count;i++){const options=g.map.tiles.filter(t=>!isWater(t)&&t.terrain!=='mountain'&&t.owner===null&&!t.cityId&&!t.district&&!t.village&&!t.ruin&&!t.camp&&!t.resource&&!excluded.has(t.id)&&!g.units.some(u=>u.tile===t.id)&&g.cities.every(c=>dist(t,g.map.tiles[c.tile],g.map)>=5)&&g.map.starts.every(id=>dist(t,g.map.tiles[id],g.map)>=6)&&state.states.every(s=>dist(t,g.map.tiles[s.tile],g.map)>=6));if(!options.length)break;const tile=options[(i*7919+g.map.tiles.length)%options.length];const s={id:i+1,name:NAMES[i],tile:tile.id,type:types[i%types.length],hp:200,envoys:{},met:[],wars:[],capturedBy:null,levyUntil:0};state.states.push(s);tile.cityState=s.id;}}
 for(const st of state.states){
  if(st.territory===undefined){st.territory=tilesInRange(g.map,g.map.tiles[st.tile],1).filter(t=>t.owner===null&&!t.cityId&&!t.district&&!t.fort&&!t.camp&&!t.village&&(!t.cityState||t.cityState===st.id)).map(t=>t.id);if(!st.territory.includes(st.tile))st.territory.push(st.tile);st.population=1;st.culture=0;st.foundedTurn=g.turn;}
  if(!Array.isArray(st.territory)||st.territory.length>19||new Set(st.territory).size!==st.territory.length||st.territory.some(id=>!g.map.tiles[id]||dist(g.map.tiles[id],g.map.tiles[st.tile],g.map)>2)||!Number.isInteger(st.population)||st.population<1||st.population>6||!Number.isFinite(st.culture)||st.culture<0||st.razed!==undefined&&typeof st.razed!=='boolean'||st.foundedTurn!==undefined&&(!Number.isInteger(st.foundedTurn)||st.foundedTurn<1||st.foundedTurn>g.turn))throw Error('Invalid city-state territory.');
  if(st.production!==undefined&&st.production!==null&&(!['warrior','swordsman','musket','infantry','archer','crossbow','builder'].includes(st.production.item)||!Number.isFinite(st.production.progress)||st.production.progress<0||!Number.isFinite(st.production.cost)||st.production.cost<=0))throw Error('Invalid city-state production.');
 }
 for(const u of g.units)if(u.owner<=-2&&(!stateForOwner(g,u.owner)||u.cityState!==stateForOwner(g,u.owner).id||u.type==='settler'||UNITS[u.type]?.heritage))throw Error('Invalid city-state unit.');
 const owned=new Map(state.states.filter(st=>st.capturedBy===null).flatMap(st=>st.territory.map(id=>[id,st.id])));for(const t of g.map.tiles){const id=owned.get(t.id);if(id&&t.owner===null)t.cityStateTerritory=id;else delete t.cityStateTerritory;}
}
export function discoverCityStates(g,emit){if(g.cityStates?.states.some(s=>s.territory===undefined))initializeCityStates(g);const visible=new Map(g.players.map(p=>[p.id,new Set(p.visible)]));for(const st of g.cityStates?.states||[]){if(st.capturedBy!==null)continue;for(const p of g.players)if(p.alive&&!st.met.includes(p.id)&&st.territory.some(id=>visible.get(p.id).has(id))){if(!st.met.length)p.envoys=Math.min(100,p.envoys+1);st.met.push(p.id);emit(g,'diplomacy',p.short+' 发现城邦 '+st.name+'。',p.id,st.tile);}}}
export function suzerain(g,s){if(!s||s.capturedBy!==null)return null;const candidates=g.players.filter(p=>p.alive&&!s.wars.includes(p.id)).map(p=>({id:p.id,n:(s.envoys[p.id]||0)+((s.envoys[p.id]||0)>0&&activeGovernor(g,p,'gov_diplomat','b')?2:0)})).sort((a,b)=>b.n-a.n||a.id-b.id);return candidates[0]?.n>=3&&candidates[0].n>(candidates[1]?.n||0)?candidates[0].id:null;}
export function cityStateBonuses(g,c){const p=g.players[c.owner],flat={};for(const s of g.cityStates?.states||[]){if(s.capturedBy!==null||s.wars.includes(p.id))continue;const n=s.envoys[p.id]||0,t=CITY_STATE_TYPES[s.type],value=(c.id===p.capital&&n>=1?2:0)+(c.districts.some(d=>d.item===t.district)&&n>=3?2:0)+(c.districts.some(d=>d.item===t.district)&&n>=6?2:0)+(suzerain(g,s)===p.id&&c.id===p.capital?3:0);flat[t.yield]=(flat[t.yield]||0)+value;}return flat;}
export const levyCost=(g,p,s)=>Math.ceil((80+Math.max(0,...p.techs.map(k=>TECHS[k]?.era||0))*20)*(1-Math.max(activeGovernor(g,p,'gov_diplomat','b')?.3:0,Math.min(.75,heritageEffects(g,p).levyCostDiscount||0))));
export function cityStateActions(g,p){const actions=[];for(const s of g.cityStates?.states||[]){if(s.capturedBy!==null||!s.met.includes(p.id))continue;const war=s.wars.includes(p.id);if(!war&&p.envoys>0){const goal=p.strategy==='adaptive'?p.focus:p.strategy,match={science:'science',culture:'culture',faith:'religion',religion:'religion',commerce:'trade',gold:'trade',domination:'military'}[goal],n=s.envoys[p.id]||0,other=Math.max(0,...Object.entries(s.envoys).filter(([id])=>+id!==p.id).map(([,v])=>v));actions.push({type:'sendCityEnvoy',state:s.id,hint:{utility:30+(s.type===match?65:0)+(goal==='diplomacy'&&n<=other&&other+1-n<=2?80:0)+(n?20:0)+(other+1-n<=2&&n<=other?35:0)-(n>=Math.max(3,other+2)?35:0)}});}if(!war&&suzerain(g,s)===p.id&&(s.levyUntil||0)<=time(g)&&p.gold>=levyCost(g,p,s)&&g.units.some(u=>u.owner===cityStateOwner(s.id)&&u.hp>0&&!UNITS[u.type].civilian))actions.push({type:'levyCityState',state:s.id,hint:{utility:military(p)?90:-100,goldCost:levyCost(g,p,s)}});if(war&&p.visible.includes(s.tile))for(const u of g.units.filter(u=>u.owner===p.id&&u.hp>0&&!u.acted&&u.moves>0&&!UNITS[u.type]?.civilian&&dist(g.map.tiles[u.tile],g.map.tiles[s.tile],g.map)<=(unitHasRanged(p,u.type)?UNITS[u.type].range||2:1)))actions.push({type:'attackCityState',unit:u.id,state:s.id,hint:{utility:170}});actions.push({type:war?'peaceCityState':'warCityState',state:s.id,hint:{utility:-100}});}return actions;}
export function applyCityStateAction(g,p,a,ctx){if(!['sendCityEnvoy','levyCityState','peaceCityState','warCityState','attackCityState','liberateCityState'].includes(a.type))return false;const s=g.cityStates?.states.find(s=>s.id===a.state);if(!s||!s.met.includes(p.id))throw Error('尚未发现此城邦。');if(a.type==='liberateCityState'){if(s.razed||s.capturedBy!==p.id)throw Error('只能释放本国占据且未被摧毁的城邦。');ctx.liberate(s);s.capturedBy=null;s.hp=200;s.envoys[p.id]=Math.max(3,s.envoys[p.id]||0);s.wars=[];initializeCityStates(g);return true;}if(s.capturedBy!==null)throw Error('此城邦已被占领。');const war=s.wars.includes(p.id);
 if(a.type==='sendCityEnvoy'){if(war||p.envoys<1||(s.envoys[p.id]||0)>=100)throw Error('没有使节或处于战争。');p.envoys--;s.envoys[p.id]=(s.envoys[p.id]||0)+1;}
 if(a.type==='warCityState'){if(war||(s.truces?.[p.id]||0)>time(g))throw Error('已在交战或处于停战保护。');s.wars.push(p.id);s.envoys[p.id]=0;for(const u of g.units.filter(v=>v.owner===p.id&&v.levied?.state===s.id)){const partner=g.units.find(v=>v.id===u.linkedUnit&&v.linkedUnit===u.id);if(partner){delete partner.linkedUnit;delete partner.activity;}delete u.linkedUnit;delete u.activity;delete u.moveOrder;delete u.stance;delete u.mutiny;delete u.levied;const home=s.territory.map(id=>g.map.tiles[id]).find(t=>!isWater(t)&&t.terrain!=='mountain'&&(t.id===u.tile&&!g.units.some(v=>v!==u&&v.hp>0&&v.tile===t.id)||ctx.deploymentFree(g,t.id)));if(!home){g.units=g.units.filter(v=>v!==u);continue;}u.owner=cityStateOwner(s.id);u.cityState=s.id;u.tile=home.id;u.moves=0;u.acted=true;}for(const q of g.players)if(q.id!==p.id&&q.met.includes(p.id))q.relations[p.id].grievances=Math.min(200,q.relations[p.id].grievances+10);}
 if(a.type==='peaceCityState'){if(!war)throw Error('未与此城邦交战。');s.wars=s.wars.filter(id=>id!==p.id);s.truces??={};s.truces[p.id]=time(g)+400;}
 if(a.type==='levyCityState'){const cost=levyCost(g,p,s),army=g.units.filter(u=>u.owner===cityStateOwner(s.id)&&u.hp>0&&!UNITS[u.type].civilian);if(war||suzerain(g,s)!==p.id||(s.levyUntil||0)>time(g)||p.gold<cost||!army.length)throw Error('征用条件不满足，或城邦尚无可征用的部队。');p.gold-=cost;s.levyUntil=time(g)+600;for(const u of army){u.owner=p.id;u.levied={state:s.id,until:s.levyUntil};u.moves=0;u.acted=true;delete u.activity;}}
 if(a.type==='attackCityState'){const u=g.units.find(u=>u.id===a.unit&&u.owner===p.id),spec=UNITS[u?.type];if(!war||!u||spec.civilian||u.acted||u.moves<=0||u.activity||(u.attackUntil||0)>time(g)||!p.visible.includes(s.tile)||dist(g.map.tiles[u.tile],g.map.tiles[s.tile],g.map)>(unitHasRanged(p,u.type)?spec.range||2:1))throw Error('不能攻击此城邦。');const ranged=unitHasRanged(p,u.type),attack=ranged?spec.ranged:spec.strength,defense=28+Math.floor(g.turn/30),damage=ctx.damage(g,attack,defense);s.hp=Math.max(0,s.hp-damage);u.moves=0;u.acted=true;u.attackUntil=time(g)+5;u.cooldownUntil=u.attackUntil;if(!ranged)u.hp-=ctx.damage(g,defense,attack);if(s.hp===0&&!ranged&&u.hp>0){g.units=g.units.filter(v=>v.owner!==cityStateOwner(s.id));s.production=null;ctx.annex(s);s.capturedBy=p.id;if(ctx.deploymentFree(g,s.tile))u.tile=s.tile;delete g.map.tiles[s.tile].cityState;}}
 p.planRevision++;ctx.event(g,'diplomacy',`${p.short} ${a.type==='sendCityEnvoy'?'向城邦派遣使节':a.type==='levyCityState'?'征用了城邦守备军':a.type==='warCityState'?'对城邦宣战':a.type==='attackCityState'?'攻击城邦':'与城邦议和'}：${s.name}。`,p.id,s.tile);return true;
}
function stGrow(g,s){s.culture+=2+Math.min(3,Object.values(s.envoys).reduce((a,n)=>a+n,0)*.2);s.population=Math.min(6,1+Math.floor((g.turn-(s.foundedTurn||g.turn))/24));if(s.culture<18||s.territory.length>=19)return;const next=tilesInRange(g.map,g.map.tiles[s.tile],2).filter(t=>!s.territory.includes(t.id)&&t.owner===null&&!t.cityId&&!t.cityState&&!t.cityStateTerritory&&!t.district&&!t.fort&&!t.camp&&!t.village&&t.terrain!=='mountain').sort((a,b)=>a.id-b.id)[0];if(next){s.territory.push(next.id);next.cityStateTerritory=s.id;s.culture-=18;}}
function stateEconomy(g,s,ctx){
 if(!ctx.applyAction||!ctx.reachable)return;
 const owner=cityStateOwner(s.id),p=statePlayer(g,s),own=g.units.filter(u=>u.owner===owner&&u.hp>0),army=own.filter(u=>!UNITS[u.type].civilian),workers=own.filter(u=>u.type==='builder');
 const land=s.territory.map(id=>g.map.tiles[id]).filter(t=>t.owner===null&&t.id!==s.tile&&!isWater(t)&&t.terrain!=='mountain'&&!t.district&&!t.fort&&!t.camp&&!t.village);
 const sites=land.filter(t=>!t.improvement&&improvementFor(p,t));
 const hasDeposit=key=>land.some(t=>t.resource===key&&t.improvement),available=key=>!!UNITS[key]&&(!UNITS[key].tech||p.techs.includes(UNITS[key].tech));
 const melee=['infantry','musket','swordsman','warrior'].find(key=>available(key)&&(!UNITS[key].resource||hasDeposit(UNITS[key].resource)));
 const ranged=['crossbow','archer'].find(available);
 const desired=!army.length?melee:sites.length&&!workers.length?'builder':army.length<2?(ranged&&!army.some(u=>UNITS[u.type].ranged)?ranged:melee):null;
 if(!s.production&&desired)s.production={item:desired,progress:0,cost:productionCost(g,desired)};
 if(s.production){
  s.production.progress=Math.min(s.production.cost,s.production.progress+2+s.population+(land.filter(t=>t.improvement).length*.5));
  if(s.production.progress>=s.production.cost&&g.units.length<2000&&own.length<4){
   const spot=[g.map.tiles[s.tile],...land].find(t=>ctx.deploymentFree(g,t.id));
   if(spot){const u=ctx.addUnit(g,owner,s.production.item,spot.id);u.cityState=s.id;u.acted=true;u.moves=0;ctx.event(g,'production',s.name+' 完成了 '+UNITS[u.type].name+'。',owner,s.tile);s.production=null;}
  }
 }
 for(const u of own){
  u.moves=ctx.movementAllowance(g,u);u.acted=false;
  if(u.type==='builder'){
   if(g.units.some(v=>v.hp>0&&ownersAtWar(g,owner,v.owner)&&dist(g.map.tiles[v.tile],g.map.tiles[u.tile],g.map)<=2))continue;
   const here=g.map.tiles[u.tile],item=sites.includes(here)&&improvementFor(p,here);
   if(item){here.improvement=item;u.charges--;u.moves=0;u.acted=true;ctx.visual?.(g,'work',u,{action:'improve',retired:u.charges===0});ctx.event(g,'build',s.name+' 的建造者完成了地块改良。',owner,here.id);if(!u.charges)u.hp=0;continue;}
   const moves=ctx.reachable(g,p,u,true).filter(m=>s.territory.includes(m.tile)),target=sites.sort((a,b)=>dist(a,here,g.map)-dist(b,here,g.map)||a.id-b.id)[0];
   if(target&&moves.length){moves.sort((a,b)=>dist(g.map.tiles[a.tile],target,g.map)-dist(g.map.tiles[b.tile],target,g.map)||a.cost-b.cost||a.tile-b.tile);ctx.applyAction(g,p,{type:'move',unit:u.id,tile:moves[0].tile});}
  }else{
   const targets=ctx.attackTargets(g,p,u).filter(a=>a.targetUnit!==undefined&&!UNITS[g.units.find(v=>v.id===a.targetUnit)?.type]?.civilian).sort((a,b)=>a.health-b.health);
   if(targets.length){ctx.applyAction(g,p,{type:'attack',unit:u.id,targetUnit:targets[0].targetUnit});continue;}
   const threat=g.units.filter(v=>v.hp>0&&!UNITS[v.type].civilian&&ownersAtWar(g,owner,v.owner)&&p.visible.includes(v.tile)&&dist(g.map.tiles[v.tile],g.map.tiles[s.tile],g.map)<=3).sort((a,b)=>dist(g.map.tiles[a.tile],g.map.tiles[s.tile],g.map)-dist(g.map.tiles[b.tile],g.map)||a.id-b.id)[0];
   const moves=ctx.reachable(g,p,u,true).filter(m=>s.territory.includes(m.tile));
   if(threat&&moves.length){moves.sort((a,b)=>dist(g.map.tiles[a.tile],g.map.tiles[threat.tile],g.map)-dist(g.map.tiles[b.tile],g.map.tiles[threat.tile],g.map)||a.cost-b.cost);ctx.applyAction(g,p,{type:'move',unit:u.id,tile:moves[0].tile});}
   else if(u.tile===s.tile&&moves.length){const m=moves.sort((a,b)=>a.cost-b.cost||a.tile-b.tile)[0];ctx.applyAction(g,p,{type:'move',unit:u.id,tile:m.tile});}
  }
 }
}
export function cityStatesTurn(g,ctx){
 initializeCityStates(g);
 for(const s of g.cityStates.states){
  if(s.capturedBy!==null)continue;stGrow(g,s);stateEconomy(g,s,ctx);
  for(const p of g.players)if(p.alive&&p.visible.includes(s.tile)&&!s.met.includes(p.id)){if(s.met.length===0)p.envoys=Math.min(100,p.envoys+1);s.met.push(p.id);ctx.event(g,'diplomacy',`${p.short} 发现城邦 ${s.name}。`,p.id,s.tile);}
  s.hp=Math.min(200,s.hp+5);
  for(const id of s.wars){const p=g.players[id],target=g.units.find(u=>u.owner===id&&u.hp>0&&p?.visible.includes(s.tile)&&!UNITS[u.type]?.civilian&&dist(g.map.tiles[u.tile],g.map.tiles[s.tile],g.map)<=2&&!g.cities.some(c=>c.owner===u.owner&&c.tile===u.tile));if(target){const before={...target};target.hp=Math.max(0,target.hp-ctx.damage(g,30+Math.floor(g.turn/30),UNITS[target.type].strength));ctx.visual?.(g,'attack',{id:cityStateOwner(s.id),owner:cityStateOwner(s.id),tile:s.tile,type:'city'},{target:before});ctx.visual?.(g,'hurt',target,{damage:before.hp-target.hp});if(!target.hp)ctx.visual?.(g,'death',before);ctx.event(g,'battle',s.name+' 的城防攻击了 '+UNITS[target.type].name+'。',target.owner,target.tile);}}
 }
 for(const p of g.players)if(p.alive){const gain=2+(GOVERNMENTS[p.government]?.slots?.diplomatic||0);p.influence=Math.min(1000,p.influence+gain);while(p.influence>=30&&p.envoys<100){p.influence-=30;p.envoys++;}if(!p.manual){const a=cityStateActions(g,p).filter(a=>a.hint.utility>0).sort((a,b)=>b.hint.utility-a.hint.utility)[0];if(a)try{applyCityStateAction(g,p,a,ctx);}catch{}}}
 for(const u of g.units)if(u.levied&&((u.levied.until||0)<=time(g)||suzerain(g,g.cityStates.states.find(s=>s.id===u.levied.state))!==u.owner)){
  const s=g.cityStates.states.find(s=>s.id===u.levied.state);ctx.event(g,'diplomacy','征用期满或宗主地位变化，城邦部队返乡。',u.owner,u.tile);
  const spot=s?.capturedBy===null?s.territory.map(id=>g.map.tiles[id]).find(t=>!isWater(t)&&t.terrain!=='mountain'&&(t.id===u.tile&&!g.units.some(v=>v!==u&&v.hp>0&&v.tile===t.id)||ctx.deploymentFree(g,t.id))):null;
  if(spot){const partner=g.units.find(v=>v.id===u.linkedUnit&&v.linkedUnit===u.id);if(partner){delete partner.linkedUnit;delete partner.activity;}delete u.linkedUnit;delete u.stance;delete u.mutiny;u.owner=cityStateOwner(s.id);u.cityState=s.id;u.tile=spot.id;u.acted=true;u.moves=0;delete u.activity;delete u.moveOrder;delete u.levied;}else u.hp=0;
 }
}

export function cityStatesView(g,view){return {types:CITY_STATE_TYPES,states:(g.cityStates?.states||[]).filter(s=>view<0||s.met.includes(view)).map(s=>({...s,bordersClosed:cityStateBordersClosed(s),met:undefined,production:view<0||g.players[view]?.visible.includes(s.tile)?s.production:undefined,suzerain:suzerain(g,s)})),reserves:g.players.filter(p=>view<0||p.id===view).map(p=>({player:p.id,envoys:p.envoys,influence:p.influence}))};}
