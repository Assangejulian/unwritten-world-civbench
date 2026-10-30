import {WALL_TIERS,BUILDINGS,ERAS} from '/rules.mjs';

// These are rendering records only. Never admit them as live selectable cities.
export function rememberedCityModels(game){
 return (game.rememberedCities||[]).filter(c=>c.appearance&&!game.cities.some(live=>live.id===c.id)).map(c=>{
  const a=c.appearance,tier=WALL_TIERS[a.wallLevel],max=WALL_TIERS.slice(1,a.wallLevel+1).reduce((n,t)=>n+(BUILDINGS[t.building]?.defense||0),0);
  return {...c,population:a.population,visualEra:a.visualEra,wallLevel:a.wallLevel,walls:max*a.wallIntegrity,wallMax:max,buildings:tier?[tier.building]:[],districts:[],hp:0,loyalty:100};
 });
}

// P2: remembered-city intelligence age. Reads only the viewer's own snapshot record (rememberedCities[].appearance);
// never live/authoritative data. An invalid record suppresses both the appearance facts and the age.
export function validAppearance(game,a){return !!a&&typeof a==='object'&&Number.isInteger(game?.turn)&&Number.isInteger(a.lastSeenTurn)&&a.lastSeenTurn>=1&&a.lastSeenTurn<=game.turn&&Number.isInteger(a.population)&&a.population>=1&&a.population<=1000&&Number.isInteger(a.visualEra)&&a.visualEra>=0&&a.visualEra<=8&&Number.isInteger(a.wallLevel)&&a.wallLevel>=0&&a.wallLevel<=4&&Number.isFinite(a.wallIntegrity)&&a.wallIntegrity>=0&&a.wallIntegrity<=1;}
// Age is the current economic period minus the last direct sighting period (not wall-clock time).
export function memoryFreshness(game,record){const a=record?.appearance;if(!validAppearance(game,a))return {kind:'report'};return {kind:'appearance',lastSeenTurn:a.lastSeenTurn,age:game.turn-a.lastSeenTurn,population:a.population,visualEra:a.visualEra,wallLevel:a.wallLevel};}
// Shared hover/inspector lines (HTML-escaped by the caller-supplied esc). Owner is a separate, untimed record.
export function rememberedCityLines(game,record,esc){
 const f=memoryFreshness(game,record),owner='所属记录：'+esc(game.players?.[record?.owner]?.name||'未知');
 if(f.kind==='report')return {kind:f.kind,title:'地图/外交记录',lines:['无直接目视外观记录。',owner,'当前不在视野内。']};
 return {kind:f.kind,title:'记忆中的城市',lines:[`最后目视：第 ${f.lastSeenTurn} 周期（${f.age} 周期前）`,`当时外观：人口 ${f.population} · ${esc(ERAS[f.visualEra]||'')} · 城墙 ${f.wallLevel} 级`,owner,f.age===0?'本周期内曾目视，但当前不在视野内。重新侦察可更新。':'当前不在视野内。重新侦察可更新。']};
}
