// Temporary per-match context store. No model API and no production save.
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {COMPRESSION_TOKENS, estimateTokens, ModelContextStore, digestLine} from '../src/environment/model-context-store.mjs';
import {toolSucceeded} from '../environment/mcp/api-player.mjs';
import {ModelConversation, normalizeModelApi} from '../src/environment/model-api.mjs';
import * as E from '../src/engine.mjs';
import {cleanActions} from '../src/environment/projection.mjs';
import {field} from './imperial-fixture.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {assignController} from '../src/environment/controllers.mjs';

const dir = mkdtempSync(path.join(tmpdir(), 'hex-context-'));
const store = new ModelContextStore(path.join(dir, 'match.sqlite'));
const long = '先侦察河谷，再决定第二座城市。'.repeat(80);
store.appendEvent({seat: 0, turn: 1, type: 'reasoning', fidelity: 'provider_reasoning_content', text: long});
store.appendEvent({seat: 0, turn: 1, type: 'dialogue', fidelity: 'provider_text', text: '建城。'});
for (let index = 0; index < 6; index++) store.appendMessage({seat: 0, turn: 1, role: 'tool', kind: 'game_act', text: `action-${index}-` + 'x'.repeat(500), body: {index, detail: 'y'.repeat(2000)}});
assert.equal(store.compress(0), null);
assert.equal(COMPRESSION_TOKENS, 200_000);
assert.equal(estimateTokens('a'.repeat(400_000)) < COMPRESSION_TOKENS, true);
assert.equal(estimateTokens('a'.repeat(800_000)) >= COMPRESSION_TOKENS, true);
const packed = store.compress(0, {minTokens: 1, reserveTokens: 1200});
assert.ok(packed && packed.afterBytes < packed.beforeBytes);
const recalled = store.workingSet(0);
assert.match(recalled.summary, /"index":0/);
assert.equal(recalled.recent.length, 2);
const events = store.events(0, 0);
assert.equal(events[0].text, long);
assert.equal(events[0].fidelity, 'provider_reasoning_content');
assert.equal(events[1].text, '建城。');
const row = store.db.prepare('SELECT body FROM messages WHERE hot=0 LIMIT 1').get();
const full = JSON.parse(gunzipSync(row.body).toString('utf8'));
assert.equal(full.detail.length, 2000);

// Two compactions must carry the previous digest forward within the bounded budget.
for (let index = 6; index < 10; index++) store.appendMessage({seat:0, turn:2, role:'tool', kind:'game_act', text:'applied', body:{arguments:{action:{type:'produce',city:17,item:'settler'}},result:{status:index===9?'rejected':'applied',error:index===9?'Insufficient gold':null},padding:'z'.repeat(2000)}});
assert(store.compress(0,{minTokens:1,reserveTokens:600}));
const twice=store.workingSet(0);
assert.match(twice.summary,/"index":0/);
assert.match(twice.summary,/"city":17/);
assert.match(twice.recent.at(-1).text,/settler.*rejected.*Insufficient gold/);
store.appendMessage({seat:0,turn:2,role:'reasoning',kind:'provider_reasoning_content',text:'PRIVATE_FULL_REASONING'.repeat(200),body:'PRIVATE_FULL_REASONING'.repeat(200)});
assert(!JSON.stringify(store.workingSet(0)).includes('PRIVATE_FULL_REASONING'));
assert.equal(store.workingSet(1).summary,'');
assert.equal(store.workingSet(1).recent.length,0);
assert.match(digestLine('game_batch',{arguments:{commands:[{action:{type:'produce',city:4,item:'settler'}},{action:{type:'hold',unit:9}}]},result:{results:[{status:'rejected',error:'Blocked'}]}}),/settler.*rejected.*hold.*not_executed/);
assert(!toolSucceeded({isError:false,result:{status:'rejected',error:'Blocked'}}));
assert(!toolSucceeded({isError:false,result:{results:[{status:'applied'},{status:'rejected'}]}}));
assert(toolSucceeded({isError:false,result:{status:'applied',error:null}}));
assert(!toolSucceeded({isError:true}));

// A small model budget must trigger before the old global 200k threshold.
const config=normalizeModelApi({baseUrl:'http://localhost:12345/v1',model:'test',contextTokens:4096});
const conversation=new ModelConversation(config,[],'test',JSON.stringify({session:{seat:0},objective:'Found the river city'}));
for(let index=0;index<14;index++){
  const item={role:'assistant',content:'Plan '+index,tool_calls:[{id:'c'+index,type:'function',function:{name:'game_act',arguments:JSON.stringify({action:{type:'produce',city:17,item:'settler'}})}}]};
  conversation.messages.push(item);
  conversation.result({id:'c'+index},{result:{status:'applied',large:'y'.repeat(1800)}});
}
const beforeBytes=JSON.stringify(conversation.messages).length;
const compacted=conversation.compact();
assert(compacted);
assert(JSON.stringify(conversation.messages).length<beforeBytes/2);
assert.match(conversation.messages[0].content,/settler/);
assert.match(conversation.messages[0].content,/3072-token/);
const callIds=new Set();
for(const item of conversation.messages){for(const call of item.tool_calls||[])callIds.add(call.id);if(item.role==='tool')assert(callIds.has(item.tool_call_id));}
let payload;
await conversation.complete({fetcher:async(url,options)=>{payload=JSON.parse(options.body);return Response.json({choices:[{message:{role:'assistant',content:'Continue'}}]});}});
assert(!('max_tokens' in payload)&&!('max_completion_tokens' in payload));
const cached=new ModelConversation(config,[],'test','test');
const cachedResult=await cached.complete({fetcher:async()=>Response.json({choices:[{message:{role:'assistant',content:'Ready'}}],usage:{prompt_tokens:100,completion_tokens:5,prompt_cache_hit_tokens:72}})});
assert.equal(cachedResult.usage.cachedInput,72);
assert.equal(cachedResult.usage.uncachedInput,28);
assert.equal(cached.tokenBreakdown().total,cached.tokenBreakdown().fixedPrefix+cached.tokenBreakdown().opening+cached.tokenBreakdown().history);

const {g,p}=field(),city=g.cities.find(item=>item.owner===p.id);
city.population=4;
city.production={item:'monument',progress:1};
const queued=JSON.stringify(city.production),humanOptions=E.productionOptions(g,p,city);
assert(humanOptions.some(row=>row.item==='settler'));
const playerOptions=cleanActions(g,p).filter(action=>action.type==='produce'&&action.city===city.id);
for(const row of humanOptions)assert(playerOptions.some(action=>action.item===row.item&&action.tile===row.tile),'Every workshop production choice stays available during an active queue');
assert.equal(JSON.stringify(city.production),queued);
for(const player of g.players)assignController(player,player.id===p.id?'human':'inactive');
const runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
try{
  await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});
  const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'agent',displayName:'Receipt probe'},{record:false});
  const observed=await runtime.observe(token),before=runtime.gameplayHash();
  const rejection=await runtime.act(token,{request_id:'reject-production',observation_token:observed.observation_token,action:{type:'produce',city:city.id,item:'not-an-item'}});
  assert.equal(rejection.status,'rejected');
  assert.equal(runtime.gameplayHash(),before);
  assert(rejection.alternatives.length>0);
  assert(rejection.alternatives.every(option=>option.city===city.id));
  assert.equal(rejection.result.city.production.item,'monument');
  const applied=await runtime.act(token,{request_id:'change-production',observation_token:rejection.next_observation_token,action:{type:'produce',city:city.id,item:'settler'}});
  assert.equal(applied.status,'applied');
  assert.equal(applied.result.city.production.item,'settler');
  assert.equal(applied.result.balance.gold,runtime.game.players[0].gold);
}finally{runtime.dispose?.();}
console.log(JSON.stringify({beforeBytes,afterBytes:JSON.stringify(conversation.messages).length,estimatedPromptAfter:conversation.promptTokens,paidModel:false}));
store.close();
console.log('MODEL CONTEXT STORE CHECK PASSED');
