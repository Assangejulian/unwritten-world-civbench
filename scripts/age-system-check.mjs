// Focused checks for the age system review fixes (Codex C-20261018-UI4-0002 R1/R3). Pure engine, no server.
import assert from 'node:assert/strict';
import * as E from '../src/engine.mjs';
import * as A from '../src/ages.mjs';
import * as R from '../src/rules.mjs';
const out=[];const check=(name,fn)=>{try{out.push({name,ok:true,data:fn()});}catch(e){out.push({name,ok:false,error:String(e.stack||e).slice(0,600)});}};
const fresh=()=>E.createGame({seed:'AGE-FIX-CHECK',players:4,size:'small',barbarians:false});
const rt=g=>E.restore(E.serialize(g));
check('R1-age-state-initialized-at-creation',()=>{const g=fresh();assert(g.ages&&g.players.every(p=>p.age));return {index:g.ages.index,start:g.ages.startTurn};});
check('R1-first-city-before-first-settlement',()=>{const g=fresh(),p=g.players[0],u=g.units.find(u=>u.owner===0&&u.type==='settler');E.applyAction(g,p,{type:'found',unit:u.id});E.finishTurn(g);
  const m=p.age.moments.filter(m=>m.key==='city');assert.equal(m.length,1);assert.equal(p.age.score>=1,true);return {score:p.age.score,city:m.length};});
check('R1-first-period-tech-and-greatperson',()=>{const g=fresh(),p=g.players[0];p.techs.push('pottery');E.event(g,'greatperson','Check Person 加入了 Check Nation。',0,0);g.turn=2;A.ageTurn(g,{event:E.event});
  assert.equal(p.age.score,3);return {score:p.age.score};});
check('R1-legacy-save-migrated-on-restore',()=>{const g=fresh();const raw=JSON.parse(E.serialize(g));delete raw.ages;for(const p of raw.players){delete p.age;delete p.ageEffects;}
  const text=JSON.stringify(raw),r=E.restore(text);assert.equal(r.ages,undefined,'restore stays byte-minimal for legacy saves');assert.equal(E.serialize(E.restore(E.serialize(r))),E.serialize(r));const p=r.players[0],u=r.units.find(u=>u.owner===0&&u.type==='settler');E.applyAction(r,p,{type:'found',unit:u.id});E.finishTurn(r);
  assert.equal(p.age.moments.filter(m=>m.key==='city').length,1);return {score:p.age.score};});
check('R1-legacy-migrated-before-event-path',()=>{const g=fresh();const raw=JSON.parse(E.serialize(g));delete raw.ages;for(const p of raw.players){delete p.age;delete p.ageEffects;}
  const r=E.restore(JSON.stringify(raw));E.event(r,'greatperson','Legacy Person 加入了 Legacy Nation。',0,0);assert(r.ages);r.turn=2;A.ageTurn(r,{event:E.event});assert.equal(r.players[0].age.score,2);return r.players[0].age.score;});
check('R3-legacy-stray-age-fields-stripped',()=>{const g=fresh();const raw=JSON.parse(E.serialize(g));delete raw.ages;raw.players[0].ageEffects={combat:999};const r=E.restore(JSON.stringify(raw));assert.equal(r.players[0].ageEffects,undefined);assert.notEqual(R.nationalEffects(r.players[0]).combat,999);return true;});
check('R3-null-moments-defaulted-snapshot-ok',()=>{const g=fresh();g.players[0].age.moments=null;const r=rt(g);assert.deepEqual(r.players[0].age.moments,[]);E.snapshot(r,0);return true;});
check('R3-partial-fields-defaulted',()=>{const g=fresh();const a=g.players[1].age;delete a.counts;delete a.history;delete a.bonuses;delete a.pending;const r=rt(g);const b=r.players[1].age;assert.deepEqual([b.counts,b.history,b.bonuses,b.pending],[{},[],[],null]);return true;});
check('R3-forged-effects-recomputed',()=>{const g=fresh();g.players[0].ageEffects={combat:999,science:999};const r=rt(g);assert.deepEqual(r.players[0].ageEffects,{});assert.notEqual(R.nationalEffects(r.players[0]).combat,999);return R.nationalEffects(r.players[0]).combat??0;});
check('R3-valid-selection-effects-rederived',()=>{const g=fresh(),p=g.players[0];p.manual=true;p.age.score=30;g.turn=61;A.ageTurn(g,{event:E.event});E.applyAction(g,p,{type:'ageBonus',items:[p.age.pending.options[0]]});
  const want=JSON.stringify(p.ageEffects);g.players[0].ageEffects={science:5};const r=rt(g);assert.equal(JSON.stringify(r.players[0].ageEffects),want);return want;});
check('R3-restore-idempotent',()=>{const g=fresh(),p=g.players[0];p.age.score=30;g.turn=61;A.ageTurn(g,{event:E.event});const s1=E.serialize(rt(g)),s2=E.serialize(E.restore(s1));assert.equal(s1,s2);return true;});
const rejects={tier:a=>{a.tier='mythic';},score:a=>{a.score=-5;},moments:a=>{a.moments='x';},momentPoints:a=>{a.moments=[{turn:1,key:'city',points:99,text:'x'}];},bonusesForeign:a=>{a.bonuses=['d_hoard'];},
  bonusesDup:a=>{a.tier='heroic';a.bonuses=['g_valor','g_valor'];},pendingCount:a=>{a.tier='golden';a.pending={tier:'golden',count:3,options:['g_valor','g_inquiry','g_pax'],deadline:5,index:1};},
  pendingOptions:a=>{a.tier='golden';a.pending={tier:'golden',count:1,options:['g_valor','g_valor'],deadline:5,index:1};},pendingWithBonus:a=>{a.tier='golden';a.bonuses=['g_valor'];a.pending={tier:'golden',count:1,options:['g_valor','g_inquiry'],deadline:5,index:1};},
  counts:a=>{a.counts={tech:-1};},history:a=>{a.history=Array.from({length:25},()=>({index:0,tier:'normal',score:0,moments:[]}));},allies:a=>{a.allies=[0];}};
for(const [k,f] of Object.entries(rejects))check('R3-reject-'+k,()=>{const g=fresh();f(g.players[0].age);assert.throws(()=>rt(g),/Invalid age state/);return true;});
check('R3-reject-world-timing',()=>{const g=fresh();g.ages.startTurn=g.turn+50;assert.throws(()=>rt(g),/Invalid age state/);g.ages.startTurn=1;g.ages.length=1;assert.throws(()=>rt(g),/Invalid age state/);g.ages.length=60;g.ages.version=7;assert.throws(()=>rt(g),/Invalid age state/);return true;});
check('lifecycle-unchanged',()=>{const g=fresh(),p=g.players[0];p.manual=true;p.age.score=0;g.turn=61;A.ageTurn(g);assert.equal(p.age.tier,'dark');g.turn=64;A.ageTurn(g);assert.equal(p.age.bonuses.length,1);
  p.age.score=50;g.turn=121;A.ageTurn(g);assert.equal(p.age.tier,'heroic');const choices=p.age.pending.options.slice(0,3);A.chooseAgeBonus(g,p,choices);assert.deepEqual(p.ageEffects,A.computeEffects('heroic',choices));const r=rt(g);assert.deepEqual(r.players[0].ageEffects,p.ageEffects);return p.age.bonuses;});
check('R3-late-turn-jump-accepted',()=>{const g=fresh();g.turn=400;const r=rt(g);A.ageTurn(r);return r.ages.index;});
console.log(JSON.stringify(out,null,1));const fail=out.filter(r=>!r.ok);console.log(`age-system-check: ${out.length-fail.length}/${out.length} pass`);if(fail.length)process.exitCode=1;
