// Independent checks for submitted P1 boundary behavior; no live server or save is touched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.P1_CANDIDATE||path.resolve(import.meta.dirname,'..');
const {ForcePanel}=await import(pathToFileURL(path.join(root,'web/force-panel.js')));
const E=await import(pathToFileURL(path.join(root,'src/engine.mjs')));
const R=await import(pathToFileURL(path.join(root,'src/realtime.mjs')));
const {executeBatch}=await import(pathToFileURL(path.join(root,'src/batch-intent.mjs')));
const {UNITS}=await import(pathToFileURL(path.join(root,'src/rules.mjs')));
const checks=[];
async function check(name,fn){try{await fn();checks.push({name,passed:true});console.log('PASS',name);}catch(error){checks.push({name,passed:false,error:error.message});console.log('FAIL',name,error.message);}}
function panel({controlled=true,api}={}){
 const ctx={game:{id:'same',players:[{id:0,manual:controlled}],units:[{id:7,owner:0,tile:1}]},session:{world:1},selectedPlayer:0,view:0,selection:{tile:2},canControl:()=>controlled};
 const el={hidden:true,innerHTML:'',addEventListener(){}};
 const p=new ForcePanel(el,{context:()=>ctx,api:api||(async()=>({world:ctx.session.world,units:[],rejections:[]})),toast(){},refresh:async()=>{}});
 return {p,ctx,el};
}
await check('AI-controlled own units can be inspected without taking control',async()=>{
 const {p}=panel({controlled:false});assert.equal(p.toggleAt({id:1},{id:7,owner:0,tile:1}),true);
 assert.equal(p.ids.size,1);p.sync();assert.equal(p.ids.size,1);
});
await check('Player perspective cannot inspect private execution status of a selected foreign country',async()=>{
 const {p,ctx}=panel();ctx.selectedPlayer=1;ctx.view=0;ctx.game.units=[{id:8,owner:1,tile:3}];
 assert.equal(p.toggleAt({id:3},{id:8,owner:1,tile:3}),false);assert.equal(p.ids.size,0);
});
await check('Delayed batch responses cannot resurrect results after same-ID world replacement',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r);
 const {p,ctx}=panel({api:async route=>route==='batch'?pending:{world:ctx.session.world,units:[],rejections:[]}});
 p.bound=p.keyOf();p.ids.add(7);const submitting=p.submit('fortify');
 ctx.session.world=2;p.sync();assert.equal(p.ids.size,0);
 resolve({summary:{submitted:1,queued:1},results:[{unit:7,status:'queued'}]});await submitting;
 assert.equal(p.last,null);assert.equal(p.results,null);
});
await check('Clearing selection invalidates in-flight batch results',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r);
 const {p}=panel({api:async route=>route==='batch'?pending:{world:1,units:[],rejections:[]}});
 p.bound=p.keyOf();p.ids.add(7);const submitting=p.submit('fortify');p.reset();
 resolve({summary:{submitted:1,queued:1},results:[{unit:7,status:'queued'}]});await submitting;
 assert.equal(p.last,null);assert.equal(p.results,null);
});
await check('Changing selected units during submission cannot leave batch controls permanently pending',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r);
 const {p}=panel({api:async route=>route==='batch'?pending:{world:1,units:[],rejections:[]}});
 p.bound=p.keyOf();p.ids.add(7);const submitting=p.submit('fortify');
 p.toggleAt({id:1},{id:7,owner:0,tile:1});
 resolve({summary:{submitted:1,queued:1},results:[{unit:7,status:'queued'}]});await submitting;
 assert.equal(p.pending,null);
});
await check('Returning control to AI resets selection and invalidates pending manual results',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r);
 const {p,ctx}=panel({api:async route=>route==='batch'?pending:{world:1,units:[],rejections:[]}});
 p.bound=p.keyOf();p.ids.add(7);const submitting=p.submit('fortify');
 ctx.game.players[0].manual=false;ctx.canControl=()=>false;p.sync();
 assert.equal(p.ids.size,0);
 resolve({summary:{submitted:1,queued:1},results:[{unit:7,status:'queued'}]});await submitting;
 assert.equal(p.last,null);assert.equal(p.results,null);
});
function linkedFixture(){
 const text=fs.readFileSync(path.join(root,'output/p1-fixtures/heavy-turn306.json'),'utf8');
 const g=R.migrateRealtime(E.restore(text)),p=g.players[5];p.manual=true;g.realtime.queues[p.id]=[];
 const own=g.units.filter(u=>u.owner===p.id&&u.hp>0&&!u.activity&&!['sea','air'].includes(UNITS[u.type].domain)&&u.type!=='envoy');
 const m=own.find(u=>!UNITS[u.type].civilian&&E.reachable(g,p,u).length),c=own.find(u=>UNITS[u.type].civilian);assert(m&&c);
 c.tile=m.tile;m.linkedUnit=c.id;c.linkedUnit=m.id;
 for(const u of [m,c]){u.cooldownUntil=0;u.moveUntil=0;u.acted=false;u.moves=UNITS[u.type].moves;}
 const lead=m.id<c.id?m:c,other=lead===m?c:m;
 const target=E.reachable(g,p,lead).find(t=>p.visible.includes(t.tile));assert(target);
 return {g,p,lead,other,target:target.tile};
}
await check('A rejected operative move cannot report its linked member as successfully merged',async()=>{
 const {g,p,lead,other,target}=linkedFixture(),sim=new R.RealtimeSimulation(g);
 g.realtime.queues[p.id]=Array.from({length:128},(_,i)=>({id:900000+i,action:{type:'fortify',unit:800000+i},manual:true,priority:0,queuedAt:g.realtime.time}));
 const out=executeBatch(sim,g,p,{kind:'move',units:[other.id,lead.id],tile:target});sim.dispose();
 assert.equal(out.results.find(r=>r.unit===lead.id).status,'rejected');
 assert.equal(out.results.find(r=>r.unit===other.id).status,'rejected');
 assert.equal(out.summary.merged||0,0);assert.equal(out.summary.rejected,2);
});
await check('Recent own-unit admission/impact rejections are visible in the force panel',async()=>{
 const {p,el}=panel();p.bound=p.keyOf();p.ids.add(7);
 p.status={units:[{id:7,name:'Tank',state:'idle',cooldowns:[]}],rejections:[{unit:7,type:'move',stage:'admission',reason:'Destination unavailable',time:10}]};
 p.render();assert.match(el.innerHTML,/Destination unavailable|目的地|最近拒绝/);
});
const output=process.env.P1_BOUNDARY_OUT||path.join(root,'output/p1-boundary-checks.json');
fs.writeFileSync(output,JSON.stringify({passed:checks.every(c=>c.passed),checks,liveSaveTouched:false},null,2));
process.exitCode=checks.every(c=>c.passed)?0:1;
