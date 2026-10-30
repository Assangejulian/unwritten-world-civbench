import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as C from '../src/congress.mjs';
import * as V from '../src/victory-rules.mjs';
import * as H from '../src/heritage.mjs';
import * as CS from '../src/city-states.mjs';
import {scoreBreakdown,compareEmpireScore} from '../src/geopolitics.mjs';
import {ageTurn} from '../src/ages.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {field} from './imperial-fixture.mjs';
const out='output/victories-20261019';fs.mkdirSync(out,{recursive:true});const checks=[];
async function check(name,fn){try{await fn();checks.push(name);console.log('PASS '+name);}catch(e){fs.writeFileSync(out+'/engine-checks.json',JSON.stringify({passed:false,checks,failed:name,error:e.stack},null,2));throw e;}}
function world(){const f=field();for(const p of f.g.players){p.civics=['code'];p.techs=[];p.research=p.civic=null;p.diplomaticFavor=p.diplomaticPoints=0;}f.g.settings.victories=[...V.VICTORY_TYPES];return f;}
function session(f,{modern=false}={}){const {g,p}=f;if(modern)p.techs=['combustion'];g.turn=g.congress.nextTurn;C.congressTurn(g,E.event);assert(g.congress.current);return g.congress.current;}
function vote(f,p,topic,choice,extra=0,target){const c=f.g.congress.current;E.applyAction(f.g,p,{type:'voteCongress',congress:c.id,topic,choice,extra,...(target===undefined?{}:{target})});}
function close(f){f.g.turn=f.g.congress.current.closesTurn;C.congressTurn(f.g,E.event);}
await check('Six victory options are real, validated and preserve an explicit five-type subset',()=>{
 const g=E.createGame({players:2,size:'small',barbarians:false,victories:['science','score']});assert.deepEqual(g.settings.victories,['science','score']);assert.equal(E.serialize(E.restore(E.serialize(g))),E.serialize(g));assert.throws(()=>E.createGame({victories:[]}));assert.throws(()=>E.createGame({victories:['score','score']}));assert.throws(()=>E.createGame({victories:['unknown']}));
 const all=V.VICTORY_TYPES.filter(k=>k!=='diplomacy'),custom=E.createGame({players:2,size:'small',victories:all});assert.deepEqual(E.restore(E.serialize(custom)).settings.victories,all);
});
await check('The legacy disk autosave migrates in memory and the migration is byte-stable on its second restore',()=>{
 const text=fs.readFileSync('saves/autosave.json','utf8'),g=E.restore(text);assert(g.settings.victories.includes('diplomacy'));assert.equal(g.settings.scoreRulesVersion,2);assert.equal(g.victoryRules.version,1);const saved=E.serialize(g);assert.equal(E.serialize(E.restore(saved)),saved);assert.equal(fs.readFileSync('saves/autosave.json','utf8'),text);
});
await check('Malformed diplomatic balances and award records are rejected',()=>{
 for(const patch of [g=>g.players[0].diplomaticFavor=-1,g=>g.players[0].diplomaticFavor=1.2,g=>g.players[0].diplomaticPoints=NaN,g=>g.victoryRules.awards.bad={player:99,delta:2,turn:1,label:'bad'}]){const {g}=world();patch(g);assert.throws(()=>E.restore(E.serialize(g)));}
});
await check('Known old wonders and future research are backfilled once; capturing them never awards the same source twice',()=>{
 const {g,p,q,home}=world();delete g.victoryRules;p.techs=['futuretech'];p.civics=['futurecivic'];for(const key of Object.keys(V.DIPLOMATIC_WONDERS))g.wonders[key]={city:home.id,owner:p.id,tile:home.tile,birthGranted:true};V.initializeVictoryRules(g);assert.equal(p.diplomaticPoints,9);V.initializeVictoryRules(g);assert.equal(p.diplomaticPoints,9);home.owner=q.id;V.settleDiplomaticMilestones(g);assert.equal(q.diplomaticPoints,0);assert.equal(p.diplomaticPoints,9);
});
await check('Each actual wonder-completion hook grants its existing effects and its diplomatic reward only once',()=>{
 for(const [key,n]of Object.entries(V.DIPLOMATIC_WONDERS)){const {g,p,home}=world();g.wonders[key]={owner:p.id,city:home.id,tile:home.tile};H.heritageCompleted(g,p,home,key,{addUnit:E.addUnit,boost:()=>{},inspire:()=>{}});assert.equal(p.diplomaticPoints,n);H.heritageCompleted(g,p,home,key,{addUnit:E.addUnit,boost:()=>{},inspire:()=>{}});assert.equal(p.diplomaticPoints,n);}
});
await check('Real future research completion and future civic completion each grant one point without repeat farming',()=>{
 for(const [kind,key]of Object.entries(V.DIPLOMATIC_RESEARCH)){const {g,p}=world();p[kind]=key;p[kind==='research'?'researchProgress':'civicProgress'][key]=R.researchCost(g,key,kind==='civic')-0.1;E.finishTurn(g,{actions:false});assert((kind==='research'?p.techs:p.civics).includes(key));assert.equal(p.diplomaticPoints,1);E.finishTurn(g,{actions:false});assert.equal(p.diplomaticPoints,1);}
});
await check('Government, contested suzerainty, alliance levels and occupied capitals determine actual favor income',()=>{
 const {g,p,q,home,other,tile}=world();p.government='democracy';p.relations[q.id]={status:'alliance',allianceUntil:2000,alliancePoints:65};g.cityStates.states.push({id:1,name:'State',tile:tile(14,12).id,type:'science',hp:200,envoys:{0:3,1:2},met:[0,1],wars:[],capturedBy:null,levyUntil:0});CS.initializeCityStates(g);assert.deepEqual(C.diplomaticFavorIncome(g,p,CS.suzerain),{government:3,cityStates:1,alliances:3,occupation:0,total:7});g.cityStates.states[0].envoys[1]=3;assert.equal(C.diplomaticFavorIncome(g,p,CS.suzerain).cityStates,0);other.owner=p.id;assert.equal(C.diplomaticFavorIncome(g,p,CS.suzerain).occupation,-5);p.government='chiefdom';p.relations[q.id].allianceUntil=0;p.diplomaticFavor=2;C.settleDiplomaticFavor(g,CS.suzerain);assert.equal(p.diplomaticFavor,0);
});
await check('Favor settles once per completed economy round, never on an idle native observation',()=>{
 const {g,p}=world();p.government='republic';for(let i=0;i<3;i++)E.observation(g,p,{nativeRoutes:false});assert.equal(p.diplomaticFavor,0);E.finishTurn(g,{actions:false});assert.equal(p.diplomaticFavor,1);
});
await check('Modern leadership is an extra agenda and participation never establishes contact',()=>{
 const f=world();for(const p of f.g.players){p.met=[];p.contacts={};}let c=session(f);assert.equal(c.agenda.length,2);close(f);f.p.techs=['combustion'];f.g.turn=f.g.congress.nextTurn;C.congressTurn(f.g,E.event);c=f.g.congress.current;assert.equal(c.agenda.length,3);assert.equal(c.agenda[2].topic,'leadership');for(const p of f.g.players)assert.deepEqual(p.met,[]);C.validateCongress(f.g);
});
await check('Extra votes debit the triangular cost atomically and illegal/duplicate ballots cannot spend favor',()=>{
 const f=world(),{g,p}=f,c=session(f);p.diplomaticFavor=60;const topic=c.agenda[0].topic;vote(f,p,topic,'support',3);assert.equal(p.diplomaticFavor,0);assert.equal(c.agenda[0].ballots[p.id].cost,60);const saved=E.serialize(g);assert.throws(()=>vote(f,p,topic,'oppose'));assert.equal(E.serialize(g),saved);assert.throws(()=>vote(f,p,c.agenda[1].topic,'support',1));assert.equal(E.serialize(g),saved);assert.throws(()=>vote(f,p,c.agenda[1].topic,'abstain',1));assert.equal(E.serialize(g),saved);C.validateCongress(g);
});
await check('Ordinary weighted outcomes reward only matching voters and refund a losing option',()=>{
 const f=world(),{g,p,q,z}=f,c=session(f),topic=c.agenda[0].topic;p.diplomaticFavor=q.diplomaticFavor=100;vote(f,p,topic,'support',3);vote(f,q,topic,'oppose',1);vote(f,z,topic,'abstain');close(f);assert.equal(p.diplomaticPoints,1);assert.equal(q.diplomaticPoints,0);assert.equal(p.diplomaticFavor,40);assert.equal(q.diplomaticFavor,100);assert(g.congress.resolutions.some(r=>r.topic===topic));const n=p.diplomaticPoints;C.congressTurn(g,E.event);assert.equal(p.diplomaticPoints,n);
});
await check('Tied options and failed quorum create no diplomatic reward or hidden tie winner',()=>{
 const f=world(),{p,q}=f,c=session(f),topic=c.agenda[0].topic;vote(f,p,topic,'support');vote(f,q,topic,'oppose');close(f);assert.equal(p.diplomaticPoints+q.diplomaticPoints,0);assert.equal(f.g.congress.history[0].agenda[0].result.choice,null);
 const h=world(),d=session(h);vote(h,h.p,d.agenda[0].topic,'support');close(h);assert.equal(h.p.diplomaticPoints,0);assert.equal(h.g.congress.history[0].agenda[0].result.quorum,false);
});
await check('Leadership resolves outcome then target and rewards only the exact winning combination',()=>{
 const f=world(),{p,q,z}=f;session(f,{modern:true});vote(f,p,'leadership','gain',0,p.id);vote(f,q,'leadership','gain',0,q.id);vote(f,z,'leadership','gain',0,q.id);close(f);assert.equal(p.diplomaticPoints,0);assert.equal(q.diplomaticPoints,3);assert.equal(z.diplomaticPoints,1);assert.equal(f.g.congress.history[0].agenda[2].result.target,q.id);
});
await check('Losing leadership targets receive half their spent favor back and points never go negative',()=>{
 const f=world(),{p,q,z}=f;session(f,{modern:true});p.diplomaticFavor=q.diplomaticFavor=100;vote(f,p,'leadership','lose',1,p.id);vote(f,q,'leadership','lose',2,z.id);vote(f,z,'leadership','lose',0,z.id);close(f);assert.equal(p.diplomaticFavor,95);assert.equal(z.diplomaticPoints,1);assert.equal(q.diplomaticPoints,1);assert.equal(f.g.victoryRules.awards['congress:1:leadership:target'].delta,0);
});
await check('All agendas settle before the 20-point check; temporary 20 followed by deductions does not win',()=>{
 const f=world(),{g,p,q,z}=f,c=session(f,{modern:true});V.awardDiplomaticPoints(g,p,18,'test:seed','Test seed');for(const a of c.agenda)for(const nation of [p,q,z])vote(f,nation,a.topic,a.topic==='leadership'?'lose':'support',0,a.topic==='leadership'?p.id:undefined);g.turn=c.closesTurn-1;E.finishTurn(g,{actions:false});assert.equal(p.diplomaticPoints,19);assert.equal(g.winner,null);
});
await check('Reaching 20 settled points causes an actual diplomatic victory once',()=>{
 const f=world(),{g,p,q,z}=f,c=session(f);V.awardDiplomaticPoints(g,p,19,'test:seed','Test seed');for(const nation of [p,q,z])vote(f,nation,c.agenda[0].topic,'support');g.turn=c.closesTurn-1;E.finishTurn(g,{actions:false});assert.equal(g.winner?.type,'diplomacy');assert.equal(g.winner.player,p.id);const n=g.events.filter(e=>e.type==='victory').length;E.finishTurn(g);assert.equal(g.events.filter(e=>e.type==='victory').length,n);E.restore(E.serialize(g));
});
await check('Disabling diplomacy removes leadership agendas and suppresses a 20-point victory',()=>{
 const f=world(),{g,p}=f;g.settings.victories=['score'];V.awardDiplomaticPoints(g,p,20,'test:seed','Test seed');session(f,{modern:true});assert.equal(g.congress.current.agenda.length,2);E.finishTurn(g,{actions:false});assert.equal(g.winner,null);
});
await check('Pending paid ballots survive restore and the snapshot exposes only the viewer ballot and private favor',()=>{
 const f=world(),{g,p,q}=f,c=session(f,{modern:true});p.diplomaticFavor=q.diplomaticFavor=100;vote(f,p,c.agenda[0].topic,'support',2);vote(f,q,c.agenda[0].topic,'oppose',1);p.met=[];const restored=E.restore(E.serialize(g));assert.equal(restored.players[0].diplomaticFavor,70);const view=E.snapshot(restored,0);assert.deepEqual(Object.keys(view.congress.current.agenda[0].ballots),['0']);assert.equal(view.players[1].diplomaticFavor,undefined);assert.equal(view.players[1].victory,undefined);assert.equal(view.congress.current.standings[1],q.diplomaticPoints);assert.deepEqual(restored.players[0].met,[]);
});
await check('Legacy string ballots normalize safely without retroactive favor cost',()=>{
 const f=world(),c=session(f);c.agenda[0].ballots[0]='support';const g=E.restore(E.serialize(f.g));assert.deepEqual(g.congress.current.agenda[0].ballots[0],{choice:'support',extra:0,cost:0});
});
await check('AI recommendations concentrate on a public approaching leader and allocate a real shared favor budget',()=>{
 const f=world(),{g,p,q}=f;session(f,{modern:true});p.strategy='diplomacy';p.diplomaticFavor=100;V.awardDiplomaticPoints(g,q,18,'test:seed','Test seed');const actions=C.congressActions(g,p);assert(actions.reduce((n,a)=>n+a.hint.favorCost,0)<=100);const leader=actions.find(a=>a.topic==='leadership');assert.equal(leader.choice,'lose');assert.equal(leader.target,q.id);for(const a of actions)E.applyAction(g,p,a);assert(p.diplomaticFavor>=0);assert.equal(C.congressActions(g,p).length,0);
});
await check('Score is the sum of real GS-style construction/history parts and stockpiles do not inflate it',()=>{
 const {g,p,home,other}=world();home.population=4;home.buildings=['campus','library','granary'];home.districts=[{item:'campus',tile:home.tile+1}];p.techs=['pottery','writing'];p.civics=['code','state'];p.religion='sky';other.religion=0;g.heritage.recruited.hypatia={owner:0,turn:1,city:home.id};g.wonders.oracle={owner:1,city:home.id,tile:home.tile};p.age.score=7;p.age.history=[{score:5}];p.age.archivedScore=3;const x=scoreBreakdown(g,p);assert.equal(x.total,5+4+2+2+4+6+15+5+10+2+15);const before=E.score(g,p);p.gold=1e6;p.faith=1e6;p.tourism=1e6;assert.equal(E.score(g,p),before);assert.equal(x.parts.find(p=>p.key==='wonders').count,1);
});
await check('Archived era score remains in the total when the bounded age history drops its oldest entry',()=>{
 const {g,p}=world();g.turn=g.ages.startTurn+g.ages.length;p.age.history=Array.from({length:24},(_,index)=>({index,tier:'normal',score:2,moments:[]}));p.age.score=3;g.ages.lastEventId=g.eventId-1;const old=p.age.archivedScore||0;ageTurn(g,{event:E.event});assert.equal(p.age.archivedScore,old+2);assert.equal(p.age.history.length,24);assert.equal(scoreBreakdown(g,p).parts.find(s=>s.key==='era').score,old+48+p.age.history.at(-1).score);
});
await check('A real score tie uses civics before population and never automatically favors seat zero',()=>{
 const {g,p,q,home,other}=world();p.civics=[];q.civics=['code'];home.population=4;other.population=1;for(const player of g.players){player.age.score=0;player.age.history=[];}assert.equal(E.score(g,p),E.score(g,q));assert(compareEmpireScore(g,p,q)>0);
});
await check('The final configured round must finish before score victory, and eliminated nations are ineligible',()=>{
 const {g,p,q,home,other}=world();g.settings.victories=['score'];g.maxTurns=40;g.turn=39;q.alive=false;other.population=999;E.finishTurn(g,{actions:false});assert.equal(g.turn,40);assert.equal(g.winner,null);E.finishTurn(g,{actions:false});assert.equal(g.winner?.type,'score');assert.equal(g.winner.turn,40);assert.notEqual(g.winner.player,q.id);assert.equal(g.winner.score,E.score(g,g.players[g.winner.player]));
});
await check('Enabled active victory takes priority over end-of-round score; disabled science cannot end a score-only game',()=>{
 const a=world();a.g.turn=a.g.maxTurns;a.p.spaceStage=3;a.p.spaceLaunchDone=true;E.finishTurn(a.g,{actions:false});assert.equal(a.g.winner.type,'science');const b=world();b.p.spaceStage=3;b.p.spaceLaunchDone=true;b.g.settings.victories=['score'];E.finishTurn(b.g,{actions:false});assert.equal(b.g.winner,null);b.g.settings.victories=['science'];b.g.turn=b.g.maxTurns; b.p.spaceStage=0;E.finishTurn(b.g,{actions:false});assert.equal(b.g.winner,null);
});
await check('Sequential human turns cannot award score victory before every nation has acted in the final round',async()=>{
 const {g}=world();g.settings.playMode='turns';g.settings.victories=['score'];g.turn=g.maxTurns;const sim=new GameSimulation(g);try{await sim.endTurn(0,{force:true});assert.equal(g.winner,null);await sim.endTurn(1,{force:true});assert.equal(g.winner,null);await sim.endTurn(2,{force:true});assert.equal(g.winner.type,'score');assert.equal(g.winner.turn,g.maxTurns);}finally{sim.dispose();}
});
await check('New wonder descriptions and both research trees advertise their actual one-time diplomatic grants',()=>{
 for(const [key,n]of Object.entries(V.DIPLOMATIC_WONDERS)){const w=H.HERITAGE_WONDERS.find(w=>w.key===key);assert.equal(w.instantGrants.diplomaticPoints,n);assert(w.passiveEffects.description.includes('外交胜利积分'));}assert(R.RESEARCH_FEATURES['t:futuretech'].some(t=>t.includes('外交胜利积分')));assert(R.RESEARCH_FEATURES['c:futurecivic'].some(t=>t.includes('外交胜利积分')));
});
fs.writeFileSync(out+'/engine-checks.json',JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,groups:checks.length}));
