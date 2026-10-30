import {UNITS,dist} from './rules.mjs';
import {workSlots} from './heritage.mjs';
const time=g=>g.realtime?.time??g.turn*20;
const room=(g,p)=>g.cities.filter(c=>c.owner===p.id&&c.buildings.includes('museum')).flatMap(c=>workSlots(g,c)).find(s=>s.active&&s.type==='art'&&!g.heritage.works.some(w=>w.slot===s.id||w.transfer?.slot===s.id));
export function siegeSupport(g,u,viewer=null){
 const s=UNITS[u.type];if(!s||s.civilian||s.ranged||s.class==='cavalry'||s.domain==='sea'||s.domain==='air'||['tank','modernarmor'].includes(u.type))return {};
 const near=g.units.filter(v=>v.owner===u.owner&&v.hp>0&&UNITS[v.type]?.support&&!v.embarked&&dist(g.map.tiles[v.tile],g.map.tiles[u.tile],g.map)<=1&&(viewer===null||v.owner===viewer||g.players[viewer]?.visible.includes(v.tile)));
 return {ram:near.some(v=>UNITS[v.type].support==='ram'),tower:near.some(v=>UNITS[v.type].support==='tower')};
}
export function civilianMissionActions(g,p,u,{buildable}={}){
 if(!u||u.owner!==p.id||u.hp<=0||u.charges<=0||u.acted||u.moves<=0||u.activity||u.embarked||(u.supportUntil||0)>time(g))return [];
 const t=g.map.tiles[u.tile],actions=[];
 if(u.type==='archaeologist'&&t.ruin&&(t.owner===null||t.owner===p.id)&&room(g,p))actions.push({type:'excavate',unit:u.id,hint:{utility:180}});
 if(u.type==='naturalist'){const c=g.cities.find(c=>c.id===t.territoryCity&&c.owner===p.id);if(c&&buildable?.(g,p,c,'nationalpark',t.id))actions.push({type:'establishPark',unit:u.id,city:c.id,hint:{utility:160}});}
 if(u.type==='rockband'){const c=g.cities.find(c=>c.id===(t.cityId??t.district?.city));if(c&&c.owner!==p.id&&p.knownCities?.[c.id]&&p.visible.includes(t.id)&&p.relations[c.owner]?.status!=='war'&&(t.cityId!==null||['theater','entertainment'].includes(t.district?.item)||t.district?.kind==='wonder'))actions.push({type:'concert',unit:u.id,hint:{utility:180,targetPlayer:c.owner,tourism:400}});}
 if(u.type==='guru')for(const v of g.units)if(v.owner===p.id&&v.id!==u.id&&UNITS[v.type]?.religious&&v.religionOwner===u.religionOwner&&v.hp>0&&v.hp<100&&!v.activity&&!v.embarked&&(v.medicalUntil||0)<=time(g)&&dist(g.map.tiles[v.tile],t,g.map)<=1)actions.push({type:'religiousHeal',unit:u.id,targetUnit:v.id,hint:{utility:160,healing:Math.min(40,100-v.hp)}});
 return actions;
}
export function civilianMissionGoals(g,p,u,{buildable}={}){
 const s=UNITS[u.type];if(s?.support)return g.units.filter(v=>v.owner===p.id&&v.id!==u.id&&v.hp>0&&(s.support==='spotter'?UNITS[v.type]?.siege:!UNITS[v.type]?.civilian&&!UNITS[v.type]?.ranged&&!['sea','air'].includes(UNITS[v.type]?.domain))).map(v=>({tile:v.tile,range:1}));
 if(u.type==='guru')return g.units.filter(v=>v.owner===p.id&&v.hp<100&&UNITS[v.type]?.religious&&v.religionOwner===u.religionOwner).map(v=>({tile:v.tile,range:1}));
 if(u.type==='archaeologist'&&room(g,p))return Object.values(p.knownTiles||{}).filter(t=>t.ruin&&(t.owner===null||t.owner===p.id)).map(t=>({tile:t.id}));
 if(u.type==='naturalist')return g.map.tiles.filter(t=>t.owner===p.id&&p.explored.includes(t.id)).filter(t=>{const c=g.cities.find(c=>c.id===t.territoryCity&&c.owner===p.id);return c&&buildable?.(g,p,c,'nationalpark',t.id);}).map(t=>({tile:t.id}));
 if(u.type==='rockband')return Object.values(p.knownCities||{}).filter(c=>c.owner!==p.id&&p.relations[c.owner]?.status!=='war'&&(p.relations[c.owner]?.openBorders||p.relations[c.owner]?.status==='alliance')).map(c=>({tile:c.tile}));
 return [];
}
export function applyCivilianMission(g,p,a,{buildable,completeProduction,event}){
 if(!['excavate','establishPark','concert','religiousHeal'].includes(a.type))return false;
 const u=g.units.find(v=>v.id===a.unit&&v.owner===p.id),valid=civilianMissionActions(g,p,u,{buildable}).find(v=>v.type===a.type&&(v.targetUnit===undefined||v.targetUnit===a.targetUnit)&&(v.city===undefined||v.city===a.city));
 if(!valid)throw Error('当前地点、次数、目标或设施不满足任务条件。');
 const t=g.map.tiles[u.tile];let message;
 if(a.type==='excavate'){const slot=room(g,p);g.heritage.works.push({id:g.heritage.nextWork++,title:'出土文物 · '+t.col+','+t.row,type:'art',origin:'archaeology',city:slot.city,slot:slot.id,culture:3,tourism:4});t.ruin=false;message='出土文物已送入艺术馆，持续产生文化与旅游。';}
 if(a.type==='establishPark'){const c=g.cities.find(c=>c.id===a.city);if(!completeProduction(g,p,c,{item:'nationalpark',tile:t.id}))throw Error('公园地块已不可用。');message='国家公园已建立。';}
 if(a.type==='concert'){p.tourism+=400;p.tourists.lastTourism+=400;const id=valid.hint.targetPlayer;p.tourists.visiting[id]=(p.tourists.visiting[id]||0)+400/(200*Math.max(1,g.players.length-1));message='巡演成功：向举办国提供 400 定向旅游影响。';}
 if(a.type==='religiousHeal'){const v=g.units.find(v=>v.id===a.targetUnit);v.hp=Math.min(100,v.hp+40);v.medicalUntil=time(g)+12;message='同信仰宗教单位恢复生命。';}
 u.charges--;u.moves=0;u.acted=true;u.supportUntil=time(g)+12;if(!u.charges)u.hp=0;
 event(g,'culture',message,p.id,u.tile);return true;
}
