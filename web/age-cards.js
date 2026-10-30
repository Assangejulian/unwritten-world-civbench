// AGES2 frontend adapter (shared by style A and style B). Display-only: it never synthesizes effects or choices.
// Contract (backend-authoritative, AGE_CARD_CONTRACT.json v2 / C-20261018-AGES2-0002/0003, see HANDOFF "AGES2 frontend"):
//   AGE_BONUSES[key] = {name, summary, description, icon, artKey, tags, eraMin, eraMax, tier, theme, generation, effects, cities?, units?, objective?:{label,cap,events}}
//   player.age.pending = {tier, count (1|3), options: [<=4 keys], era, deadline, index};  own player.age.objective = {points,cap,label}|null
// Only real catalogue keys are rendered; there is no fixture/mock lookup in this module.
// Missing new fields fall back to the legacy shape (name/description/tier/icon) without failing.
export const MAX_CARDS=4;
// display names follow AGE_CARD_CONTRACT.json v2 themes (C-20261018-AGES2-0002); a card's own name always wins
export const THEMES={foundations:'百城奠基',scholastic:'学苑争鸣',caravan:'驿路通商',pilgrimage:'圣途寻光',ocean_charter:'远洋特许',printing:'印刷之光',workshops:'工坊联盟',gunfoundry:'火器革新',
  research_network:'科研共同体',civic_mobilization:'全民营造',world_exchange:'万国博览',arsenal_reform:'军制重整',orbital_systems:'星海协作',digital_museums:'记忆互联',planetary_infrastructure:'宜居星球',strategic_networks:'联合作战网'};
// contract tags are already display strings (Chinese); legacy/English tokens are mapped, anything else is shown raw
export const TAGS={science:'科技',culture:'文化',gold:'金币',production:'生产',food:'食物',faith:'信仰',military:'军事',naval:'航海',trade:'贸易',growth:'民生',diplomacy:'外交',tourism:'旅游',space:'太空'};
// legacy (pre-AGES2) keys → closest art theme, used only when the backend sends no artKey/theme
const LEGACY_ART={g_inquiry:'scholastic',g_monument:'foundations',g_pax:'pilgrimage',g_valor:'arsenal_reform',g_caravan:'caravan',g_abundance:'world_exchange',
  n_steady:'workshops',n_scholar:'scholastic',n_patron:'printing',n_treasury:'world_exchange',n_garrison:'gunfoundry',
  d_isolation:'foundations',d_warlords:'arsenal_reform',d_monastic:'pilgrimage',d_hoard:'caravan',d_resolve:'strategic_networks'};
export const SEMANTIC={normal:'target',golden:'condition',heroic:'condition',dark:'cost'};
export const SEMANTIC_LABEL={target:'达成得时代分',condition:'满足条件生效',cost:'附带代价'};

export function ageCard(key,catalog){const b=catalog?.[key];if(!b)return null;
  const theme=b.theme||null,artKey=b.artKey||theme||LEGACY_ART[key]||null,tier=b.tier||null;
  const cond=[...(Array.isArray(b.cities)?b.cities:[]),...(Array.isArray(b.units)?b.units:[])].length>0;
  const obj=b.objective&&typeof b.objective==='object'?{label:String(b.objective.label||''),cap:Number.isFinite(+b.objective.cap)?+b.objective.cap:null}:null;
  const sem=tier==='dark'?'cost':tier==='normal'?'target':'condition';
  return {key,name:b.name||key,summary:b.summary||b.description||'',description:b.description||b.summary||'',icon:b.icon||null,artKey,tags:Array.isArray(b.tags)?b.tags.slice(0,3):[],
    eraMin:b.eraMin??null,eraMax:b.eraMax??null,tier,theme,themeLabel:theme?THEMES[theme]||theme:null,generation:b.generation??1,objective:obj,conditional:cond,
    semantic:sem,mark:sem==='target'?'时代分':sem==='cost'?'代价':cond?'条件':'加成',legacy:!b.summary&&!b.artKey&&!b.theme};}
// own-view objective progress (player.age.objective = {points,cap,label} | null); returns null when absent or malformed
export function ageObjective(player){const o=player?.age?.objective;if(!o||typeof o!=='object')return null;const cap=+o.cap,pts=+o.points;if(!Number.isFinite(cap)||cap<=0||!Number.isFinite(pts))return null;
  return {points:Math.max(0,Math.min(pts,cap)),cap,label:String(o.label||''),pct:Math.max(0,Math.min(1,pts/cap)),done:pts>=cap};}
export function tagLabel(t){return TAGS[t]||String(t);}
// Builds the view model for the current pending choice. Never adds options; trims to MAX_CARDS defensively and flags it.
export function ageChoiceModel(player,catalog,tiers={}){const pd=player?.age?.pending;if(!pd)return null;
  const keys=Array.isArray(pd.options)?pd.options:[],cards=keys.slice(0,MAX_CARDS).map(k=>ageCard(k,catalog)).filter(Boolean);
  const count=pd.count===3?3:1,tier=pd.tier,sem=SEMANTIC[tier]||'target';
  return {tier,tierName:tiers[tier]?.name||tier,count,era:Number.isInteger(pd.era)?pd.era:(Number.isInteger(player.era)?player.era:null),eraFromBackend:Number.isInteger(pd.era),
    deadline:pd.deadline,index:pd.index,cards,semantic:sem,semanticLabel:SEMANTIC_LABEL[sem],overflow:keys.length>MAX_CARDS,missing:keys.length-cards.length>0&&keys.length<=MAX_CARDS,
    countMismatch:count>cards.length};}
export function selectionError(model,items){if(!model)return '没有待选择的时代加成。';if(!Array.isArray(items)||items.length!==model.count)return `请选择 ${model.count} 项。`;
  if(new Set(items).size!==items.length)return '不能重复选择。';if(items.some(k=>!model.cards.some(c=>c.key===k)))return '只能从提供的选项中选择。';return null;}
