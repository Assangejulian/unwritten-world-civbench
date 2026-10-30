export const VICTORY_NAMES={domination:'征服胜利',science:'科技胜利',culture:'文化胜利',religion:'宗教胜利',diplomacy:'外交胜利',score:'分数胜利'};
export const VICTORY_TYPES=Object.keys(VICTORY_NAMES);
export const DIPLOMATIC_TARGET=20;
export const DIPLOMATIC_WONDERS={mahabodhi_temple:2,potala_palace:1,statue_of_liberty:4};
export const DIPLOMATIC_RESEARCH={research:'futuretech',civic:'futurecivic'};
export function victoryOptions(value){
 const types=value===undefined?[...VICTORY_TYPES]:value;
 if(!Array.isArray(types)||!types.length||types.length>VICTORY_TYPES.length||new Set(types).size!==types.length||types.some(k=>!VICTORY_TYPES.includes(k)))throw Error('至少启用一种有效胜利条件。');
 return [...types];
}
export function victoryEnabled(g,type){return (g.settings.victories||VICTORY_TYPES).includes(type);}
export function initializeVictoryRules(g){
 const legacy=!g.victoryRules;
 if(legacy){
  const previous=g.settings.victories;
  if(previous?.length===5&&previous.every(k=>k!=='diplomacy'&&VICTORY_TYPES.includes(k)))g.settings.victories=[...previous,'diplomacy'];
  g.victoryRules={version:1,migratedAt:g.turn,awards:{}};
 }
 g.settings.victories=victoryOptions(g.settings.victories);g.settings.scoreRulesVersion=2;
 const s=g.victoryRules;
 if(s.version!==1||!Number.isInteger(s.migratedAt)||s.migratedAt<1||s.migratedAt>g.turn||!s.awards||typeof s.awards!=='object'||Array.isArray(s.awards)||Object.keys(s.awards).length>20000)throw Error('Invalid victory ledger.');
 for(const [key,a]of Object.entries(s.awards))if(key.length>100||!a||!g.players[a.player]||!Number.isInteger(a.delta)||Math.abs(a.delta)>100||!Number.isInteger(a.turn)||a.turn<1||a.turn>g.turn||typeof a.label!=='string'||a.label.length>120)throw Error('Invalid diplomatic victory award.');
 for(const p of g.players){if(p.diplomaticFavor===undefined)p.diplomaticFavor=0;if(p.diplomaticPoints===undefined)p.diplomaticPoints=0;if(!Number.isInteger(p.diplomaticPoints)||p.diplomaticPoints<0||p.diplomaticPoints>100000||!Number.isInteger(p.diplomaticFavor)||p.diplomaticFavor<0||p.diplomaticFavor>1e7)throw Error('Invalid diplomatic victory balance.');}
 if(legacy)settleDiplomaticMilestones(g);
}
export function settleDiplomaticMilestones(g){
  for(const [key,n]of Object.entries(DIPLOMATIC_WONDERS)){const w=g.wonders[key],city=w&&g.cities.find(c=>c.id===w.city),p=city&&g.players[city.owner];if(p)awardDiplomaticPoints(g,p,n,'wonder:'+key,'既有奇观积分');}
  for(const p of g.players)for(const [kind,key]of Object.entries(DIPLOMATIC_RESEARCH))if((kind==='research'?p.techs:p.civics).includes(key))awardDiplomaticPoints(g,p,1,kind+':'+p.id+':'+key,kind==='research'?'未来科技':'未来市政');
}
export function awardDiplomaticPoints(g,p,delta,source,label){
 const s=g.victoryRules;if(!s||!p||s.awards[source])return false;
 const actual=Math.max(0,p.diplomaticPoints+delta)-p.diplomaticPoints;p.diplomaticPoints+=actual;s.awards[source]={player:p.id,delta:actual,turn:g.turn,label};return true;
}
export function diplomaticProgress(g,p){return {points:p.diplomaticPoints||0,target:DIPLOMATIC_TARGET,enabled:victoryEnabled(g,'diplomacy')};}
export function diplomaticLedger(g,p){return Object.entries(g.victoryRules?.awards||{}).filter(([,a])=>a.player===p.id).map(([source,a])=>({source,...a})).sort((a,b)=>b.turn-a.turn||a.source.localeCompare(b.source));}
