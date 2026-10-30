import {readFile,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {UNITS,WONDERS,PRODUCTION} from '../src/rules.mjs';
const label=process.argv[2]||'validated';if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid audit label');
const dir=new URL('../output/full-game-'+label+'/',import.meta.url),read=name=>readFile(new URL(name,dir),'utf8');
let source;try{source=await read('final.json');}catch(error){if(error.code!=='ENOENT')throw error;source=await read('checkpoint.json');}
const g=E.restore(source),issues=(await read('issues.jsonl')).split('\n').filter(Boolean).map(JSON.parse),review=[];
let checkpoint;try{checkpoint=E.restore(await read('checkpoint.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
for(const issue of issues){let resolution,evidence;
 if(issue.kind==='idle-civilian'){const u=g.units.find(u=>u.id===issue.entity);if(!u)resolution='原单位已离场；路由修正另有实际施工复现';else if(u.tile!==issue.tile||u.charges<issue.charges)resolution='已恢复移动或施工；原地停滞已结束';else {const p=g.players[u.owner],actions=E.observation(g,p).legalActions.filter(a=>a.unit===u.id);if(!actions.some(a=>['improve','repair','chop'].includes(a.type)||a.type==='move'&&a.hint?.improvable))resolution='需核查远程任务是否仍可达';}}
 if(['blocked-completed-production','stalled-production'].includes(issue.kind)){const c=g.cities.find(c=>c.id===issue.entity),work=c?.production;if(!c||c.owner!==issue.owner)resolution='所有权已变化，原队列已结束';else if(!work||work.item!==issue.item||work.progress<(work.cost??E.orderCost(g,c)))resolution='已更换或完成原阻塞项目，生产已恢复';else if(E.productionOptions(g,g.players[c.owner],c).some(op=>op.item===work.item))resolution='前提已恢复；需结合出口占用判断部署等待';}
 if(issue.kind==='idle-city'){const c=g.cities.find(c=>c.id===issue.entity);if(!c||c.owner!==issue.owner)resolution='所有权已变化，原空闲观察已结束';else if(c.production)resolution='后续已恢复正常生产；短暂空闲已结束';else {const later=checkpoint?.turn>issue.turn&&checkpoint.cities.find(c=>c.id===issue.entity&&c.owner===issue.owner&&c.production);if(later){resolution='后续检查点已恢复生产；原空闲观察已结束';evidence={file:'checkpoint.json',turn:checkpoint.turn,item:later.production.item};}}}
 review.push({turn:issue.turn,kind:issue.kind,entity:issue.entity,status:resolution&&!resolution.startsWith('需')&&!resolution.includes('需结合')?'resolved':'review',resolution:resolution||'仍需核查',...(evidence?{evidence}:{})});
}
const blocked=[],phantomWars=[],duplicateWonders=[];
for(const c of g.cities){const work=c.production;if(work&&UNITS[work.item]&&work.progress>=E.orderCost(g,c)&&!E.productionOptions(g,g.players[c.owner],c).some(op=>op.item===work.item))blocked.push({city:c.id,owner:c.owner,item:work.item});}
for(const p of g.players){for(const [id,r]of Object.entries(p.relations))if(r.status==='war'&&(!p.alive||!g.players[id]?.alive))phantomWars.push({from:p.id,to:+id});const pending=new Map();for(const c of g.cities.filter(c=>c.owner===p.id&&WONDERS[c.production?.item])){const item=c.production.item;pending.set(item,[...(pending.get(item)||[]),c.id]);}for(const [item,cities]of pending)if(cities.length>1)duplicateWonders.push({owner:p.id,item,cities});}
const summary={turn:g.turn,winner:g.winner,issueCount:issues.length,resolved:review.filter(r=>r.status==='resolved').length,needsReview:review.filter(r=>r.status==='review'),unavailableCompletedRecruitment:blocked,phantomWars,duplicateWonders};
await writeFile(new URL('review.json',dir),JSON.stringify(review,null,2)+'\n');await writeFile(new URL('review-summary.json',dir),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
