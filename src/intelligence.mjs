import {DIRECTIONS,canonicalTileKey,civilizationEra,cityWallTier,WALL_TIERS,cityWallCapacity} from './rules.mjs';

// Repair only contacts stamped at a legacy congress, without erasing actual exploration.
export function repairCongressContacts(g){
 if((g.settings.contactRulesVersion||0)>=2)return;
 const sessions=[g.congress?.current,...(g.congress?.history||[])].filter(Boolean),opened=new Set(sessions.map(c=>c.openedTurn));
 const evidence=(p,o)=>{const r=p.relations[o.id]||{};return Object.values(p.knownTiles||{}).some(t=>t.owner===o.id&&!t.intelligence)||Object.entries(p.cityAppearances||{}).some(([id])=>p.knownCities?.[id]?.owner===o.id)||g.events.some(e=>e.text?.includes('首次相遇')&&e.text.includes(p.name)&&e.text.includes(o.name))||r.status&&r.status!=='peace'||r.embassy||r.delegation||r.friendshipUntil>0||r.grievances>0||g.routes.some(route=>[route.from,route.to].every(id=>g.cities.some(c=>c.id===id&&[p.id,o.id].includes(c.owner)))&&g.cities.find(c=>c.id===route.from)?.owner!==g.cities.find(c=>c.id===route.to)?.owner);};
 const removals=new Map(g.players.map(p=>[p.id,new Set()]));
 for(const p of g.players)for(const id of p.met){const o=g.players[id];if(!o||!opened.has(p.contacts?.[id])||!opened.has(o.contacts?.[p.id])||evidence(p,o)||evidence(o,p))continue;removals.get(p.id).add(id);}
 for(const p of g.players){const removed=removals.get(p.id);p.met=p.met.filter(id=>!removed.has(id));for(const id of removed)delete p.contacts?.[id];const tiles=new Set();for(const [id,t]of Object.entries(p.knownTiles||{}))if(removed.has(t.owner)&&t.intelligence&&!p.visible.includes(+id)){tiles.add(+id);delete p.knownTiles[id];}for(const [id,c]of Object.entries(p.knownCities||{}))if(removed.has(c.owner)&&tiles.has(c.tile)&&!p.cityAppearances?.[id])delete p.knownCities[id];p.explored=p.explored.filter(id=>!tiles.has(id));}
 g.settings.contactRulesVersion=2;
}

export function rememberCityAppearance(g,p,c){
 p.cityAppearances??={};
 p.cityAppearances[c.id]={population:c.population,visualEra:civilizationEra(g.players[c.owner]),wallLevel:Math.max(0,WALL_TIERS.indexOf(cityWallTier(c))),wallIntegrity:cityWallCapacity(c)?Math.max(0,Math.min(1,c.walls/cityWallCapacity(c))):0,lastSeenTurn:g.turn};
}
export function validateCityAppearances(g){
 for(const p of g.players){const records=p.cityAppearances;if(records===undefined)continue;
  if(!records||Array.isArray(records)||typeof records!=='object'||Object.keys(records).length>320)throw Error('Invalid city appearance memory.');
  for(const [id,a]of Object.entries(records))if(!/^\d+$/.test(id)||!p.knownCities?.[id]||!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>!['population','visualEra','wallLevel','wallIntegrity','lastSeenTurn'].includes(k))||!Number.isInteger(a.population)||a.population<1||a.population>1000||!Number.isInteger(a.visualEra)||a.visualEra<0||a.visualEra>8||!Number.isInteger(a.wallLevel)||a.wallLevel<0||a.wallLevel>4||!Number.isFinite(a.wallIntegrity)||a.wallIntegrity<0||a.wallIntegrity>1||!Number.isInteger(a.lastSeenTurn)||a.lastSeenTurn<1||a.lastSeenTurn>g.turn)throw Error('Invalid remembered city appearance.');
 }
}

function rememberPublicTile(g,p,t){
  p.knownTiles??={};p.knownCities??={};
  // Diplomatic reports disclose static geography and city names, not troops,
  // private city defenses, build orders, facilities or resource discoveries.
  if(p.knownTiles[t.id]&&!p.knownTiles[t.id].intelligence)p.knownTiles[t.id]={...p.knownTiles[t.id],owner:t.owner,cityId:t.cityId};
  else p.knownTiles[t.id]={...t,resource:null,improvement:null,district:null,fort:null,fortRuin:null,camp:false,ruin:false,pillaged:false,intelligence:true};
  if(!p.explored.includes(t.id))p.explored.push(t.id);
  const c=g.cities.find(c=>c.tile===t.id);if(c)p.knownCities[c.id]={id:c.id,name:c.name,owner:c.owner,tile:c.tile,isCapital:!!c.isCapital};
}
export function diplomaticIntelligence(g){
  for(const p of g.players){
    if(!p.alive)continue;p.contacts??={};
    for(const id of p.met){const capital=g.cities.find(c=>c.id===g.players[id]?.capital);if(p.contacts[id]===undefined||capital&&!p.knownCities?.[capital.id]){p.contacts[id]??=g.turn;if(capital&&!p.knownTiles?.[capital.tile])rememberPublicTile(g,p,g.map.tiles[capital.tile]);if(capital){p.knownCities??={};p.knownCities[capital.id]={id:capital.id,name:capital.name,owner:capital.owner,tile:capital.tile,isCapital:true};}}}
    for(const id of p.met){const remembered=p.knownCities?.[g.players[id]?.capital];if(remembered)remembered.isCapital??=true;}
    if(g.turn%5!==0||p.frontierReportTurn===g.turn)continue;
    p.frontierReportTurn=g.turn;
    const visible=new Set(p.visible),front=new Set(),queue=[];
    for(const t of g.map.tiles)if(t.owner===p.id&&DIRECTIONS.some(([dq,dr])=>g.map.index[canonicalTileKey(t.q+dq,t.r+dr,g.map)]?.owner!==p.id)){queue.push({t,d:0});front.add(t.id);}
    for(let i=0;i<queue.length;i++){const {t,d}=queue[i];if(d>=3)continue;for(const [dq,dr]of DIRECTIONS){const next=g.map.index[canonicalTileKey(t.q+dq,t.r+dr,g.map)];if(!next||front.has(next.id))continue;front.add(next.id);queue.push({t:next,d:d+1});if(next.owner!==p.id&&p.met.includes(next.owner)&&!visible.has(next.id)&&g.turn-(p.contacts[next.owner]??g.turn)>=5)rememberPublicTile(g,p,next);}}
  }
}
