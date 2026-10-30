// AGES2 frontend integration check + screenshot harness — REAL backend catalogue (Codex C-20261018-AGES2-0003/0004), no fixture.
// Isolated: in-memory engine + mocked HTTP routes that call the real E.snapshot / E.applyAction (no game server, no save writes).
// Test setup only adjusts age score / tier / known techs and turn, then the REAL A.ageTurn creates pending choices; every submission
// is the browser's own ageBonus action, applied by the real engine, and verified on the authoritative game object.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const root=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.resolve(root,'output/playwright/ages2');fs.mkdirSync(OUT,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.jpg':'image/jpeg'};
const checks=[],errors=[],geo={};const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),A=await import(pathToFileURL(path.join(root,'src/ages.mjs'))),R=await import(pathToFileURL(path.join(root,'src/rules.mjs')));
 const {RealtimeSimulation}=await import(pathToFileURL(path.join(root,'src/realtime.mjs')));
 const V2=Object.keys(R.AGE_BONUSES).filter(k=>/^[ngd]2_/.test(k));assert.equal(V2.length,48,'48 real v2 cards');
 // optional read-only cross-check against Codex's frozen contract
 const CONTRACT=process.env.AGES2_CONTRACT||path.resolve(root,'../../backend-age-v2/AGE_CARD_CONTRACT.json');
 if(fs.existsSync(CONTRACT)){const c=JSON.parse(fs.readFileSync(CONTRACT,'utf8'));for(const [k,b] of Object.entries(c.bonuses))for(const f of ['name','summary','tier','theme','artKey','eraMin','eraMax'])assert.deepEqual(R.AGE_BONUSES[k]?.[f],b[f],`${k}.${f} matches contract`);checks.push('Real AGE_BONUSES match AGE_CARD_CONTRACT.json v2 for all 48 cards (name/summary/tier/theme/artKey/eraMin/eraMax).');}
 const browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
 const origin='http://ages2.local';
 async function pageFor(style,width=1440,height=900,dsf=1){
  const g=E.createGame({seed:'UI4-AGES2-REAL',players:4,size:'small',barbarians:false});
  for(const p of g.players){const u=g.units.find(u=>u.owner===p.id&&u.type==='settler');E.applyAction(g,p,{type:'found',unit:u.id});}
  g.players[0].manual=true;g.players[0].met=[1];
  const sim=new RealtimeSimulation(g),page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dsf}),requests=[];
  page.on('pageerror',e=>errors.push({style,width,stack:String(e.stack).slice(0,400)}));page.on('console',m=>{if(m.type()==='error')errors.push({style,width,text:m.text().slice(0,300)});});
  await page.addInitScript(s=>{localStorage.setItem('hex.uiStyle',s);localStorage.setItem('hex.audio.music','0');},style);
  await page.route(origin+'/**',async route=>{const url=new URL(route.request().url());
   if(!url.pathname.startsWith('/api/')){const n=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=['web','src'].map(d=>path.join(root,d,n)).find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    if(file)return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});return route.fulfill({status:404,body:''});}
   let result,status=200;try{
    if(url.pathname==='/api/state')result={game:E.snapshot(g,Number(url.searchParams.get('view')??-1),{manualOptionsOnly:true}),session:{...sim.state(),revision:1,busy:false}};
    else if(url.pathname==='/api/saves')result={entries:[],files:[]};else if(url.pathname==='/api/drivers')result={drivers:[]};else if(url.pathname==='/api/pause'){sim.pause();result={ok:true};}
    else if(url.pathname==='/api/action'){const body=route.request().postDataJSON();requests.push(body);try{E.applyAction(g,g.players[body.player],body.action);result={ok:true,immediate:true};}catch(e){status=400;result={error:e.message};}}
    else if(url.pathname==='/api/observation')result=E.observation(g,g.players[+(url.searchParams.get('player')||0)]);
    else throw Error('Unexpected isolated API: '+url.pathname);
   }catch(e){status=400;result={error:e.message};}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});});
  await page.goto(origin+'/');await page.waitForFunction(()=>window.__civ?.menuShown);
  await page.locator('#menu-continue').click();await page.waitForFunction(()=>!window.__civ.menuShown);await page.evaluate(()=>window.__civ.focusPlayer(0));
  if(style==='B')await page.waitForSelector('#b4-tracker');
  return {page,g,sim,requests};}
 const shot=async(page,name)=>{await wait(350);await page.screenshot({path:path.join(OUT,name+'.png')});};
 const techOfEra=e=>Object.keys(R.TECHS).find(k=>R.TECHS[k].era===e);
 // test setup → REAL ageTurn boundary creates the pending choice (tier from score, era locked from known techs)
 function forceAge(g,tier,era){const p=g.players[0],a=p.age;if(era>0&&!p.techs.includes(techOfEra(era)))p.techs.push(techOfEra(era));
  a.pending=null;g.turn=g.ages.startTurn+1;A.ageTurn(g,{event:E.event});a.pending=null;
  const th=A.ageThresholds(g.ages.index);a.tier=tier==='heroic'?'dark':'normal';a.score=tier==='dark'?0:tier==='normal'?th.dark+1:th.golden+1;
  g.turn=g.ages.startTurn+g.ages.length;A.ageTurn(g,{event:E.event});const pd=a.pending;
  assert(pd,'real pending created');assert.equal(pd.tier,tier);assert.equal(pd.era,Math.min(8,R.civilizationEra(p)));assert.deepEqual(pd.options,R.dedicationOptions(tier,pd.era));assert.equal(pd.count,tier==='heroic'?3:1);return pd;}
 const SC=[['normal',1],['golden',3],['dark',5],['heroic',7]];
 try{
  for(const [w,h] of [[1440,900],[1280,720],[390,844]]){
   const b=await pageFor('B',w,h);
   for(const [tier,era] of SC){if(w===390&&(tier==='normal'||tier==='dark'))continue;
    const pd=forceAge(b.g,tier,era);await b.page.evaluate(()=>window.__civ.refresh(true));await b.page.waitForFunction(()=>document.getElementById('b4-age')?.open&&document.querySelector('#b4-age.ag2'));
    const cards=b.page.locator('#b4-age [data-b4-bonus]');assert.equal(await cards.count(),4,'4 cards');
    const keys=await cards.evaluateAll(n=>n.map(x=>x.dataset.b4Bonus));assert.deepEqual(keys,pd.options,'cards = real pending.options, in order');
    if(tier==='heroic')assert(keys.every(k=>k.startsWith('g2_')),'heroic offers golden variants');
    const faces=await cards.evaluateAll(n=>n.map(x=>({sum:x.querySelector('.ag-sum').textContent,obj:x.querySelector('.ag-obj span')?.textContent||null,more:x.querySelector('.ag-more').textContent})));
    keys.forEach((k,i)=>{const bo=R.AGE_BONUSES[k];assert.equal(faces[i].sum,bo.summary,'summary from catalogue');assert.equal(faces[i].obj,bo.objective?bo.objective.label:null,'normal cards show objective.label');assert(faces[i].more.includes(bo.description),'detail = catalogue description');});
    assert.equal(await b.page.locator('[data-b4-ageconfirm]').isDisabled(),true);
    if(w===1440&&tier==='golden'){ // era lock: learning a later-era tech while the choice is open must not change era/options
     b.g.players[0].techs.push(techOfEra(5));await b.page.evaluate(()=>window.__civ.refresh(true));await wait(300);
     assert.equal(b.g.players[0].age.pending.era,3);assert.deepEqual(await cards.evaluateAll(n=>n.map(x=>x.dataset.b4Bonus)),pd.options);checks.push('Era lock: a later-era tech during an open golden choice keeps pending.era=3 and the same four cards.');}
    const need=pd.count;for(let i=0;i<need;i++)await cards.nth(i).click();
    if(need===1){await cards.nth(1).click();assert.equal(await b.page.locator('#b4-age [aria-pressed="true"]').count(),1,'single pick replaces');}
    assert.equal(await b.page.locator('[data-b4-ageconfirm]').isDisabled(),false);
    await cards.nth(need===1?2:3).hover();await wait(260);
    const vis=await b.page.evaluate(()=>{const c=document.querySelector('#b4-age [data-b4-bonus]:hover .ag-more');return c?+getComputedStyle(c).opacity:0;});assert(vis>0.9,'hover detail visible');
    const g2=await b.page.evaluate(()=>{const d=document.querySelector('#b4-age .b4-dlg').getBoundingClientRect();return {dlg:[d.left,d.right,d.top,d.bottom].map(v=>+v.toFixed(0)),overflowX:document.documentElement.scrollWidth>innerWidth,vw:innerWidth};});
    geo[`${tier}-${w}`]=g2;assert(g2.dlg[0]>=0&&g2.dlg[1]<=g2.vw,'dialog inside viewport');assert(!g2.overflowX);
    await shot(b.page,`ages2-B-${tier}-era${era}-${w}-hover`);
    if(w===390){await b.page.locator('#b4-age .b4-dlg').evaluate(e=>e.scrollTop=e.scrollHeight);await b.page.mouse.move(5,5);await shot(b.page,`ages2-B-${tier}-era${era}-390-bottom`);
     const lb=await b.page.locator('[data-b4-agelater]').boundingBox();assert(lb&&lb.x>=0&&lb.x+lb.width<=390,'later/close reachable at 390');}
    if(w===1440&&tier==='golden'){await b.page.mouse.move(2,2);await cards.nth(3).focus();await b.page.keyboard.press('Space');await wait(260);
     assert.equal(await cards.nth(3).getAttribute('aria-pressed'),'true');const fv=await b.page.evaluate(()=>{const c=document.activeElement?.querySelector?.('.ag-more');return c?+getComputedStyle(c).opacity:0;});assert(fv>0.9);
     await shot(b.page,'ages2-B-golden-era3-1440-keyboard-focus');checks.push('B keyboard: Space selects, focus is kept after re-render, focus shows the detail panel.');}
    const want=await b.page.locator('#b4-age [aria-pressed="true"]').evaluateAll(n=>n.map(x=>x.dataset.b4Bonus));
    await b.page.locator('[data-b4-ageconfirm]').click();await b.page.waitForFunction(()=>!document.getElementById('b4-age')?.open);await wait(300);
    const a=b.g.players[0].age;assert.equal(a.pending,null,'server pending cleared');assert.deepEqual(a.bonuses,want,'server bonuses = chosen keys');assert.equal(a.tier,tier);
    const last=b.requests.filter(r=>r.action?.type==='ageBonus').at(-1);assert.deepEqual(last.action.items,want);
    geo[`state-${tier}-${w}`]={bonuses:a.bonuses,effects:Object.keys(b.g.players[0].ageEffects||{})};
    checks.push(`B ${w}px ${tier} (era ${era}): real options ${want.join('+')} accepted by the engine; pending cleared, bonuses updated.`);
    if(w===1440&&tier==='normal'){ // real objective progress via the backend's own recorder, shown from own age.objective
     const goal=R.AGE_BONUSES[want[0]].objective,ev=Object.keys(goal.events)[0];A.ageRecord(b.g,b.g.players[0],[ev],'ui-check-1');
     const pts=b.g.players[0].age.objectiveProgress.points;assert(pts>0);await b.page.evaluate(()=>window.__civ.refresh(true));await b.page.waitForFunction(t=>document.querySelector('.b4-agobj')?.textContent.trim()===t,`${pts}/${goal.cap}`);
     const mr=await b.page.locator('#b4-agemeter').boundingBox();await b.page.screenshot({path:path.join(OUT,'ages2-B-objective-meter-1440.png'),clip:{x:Math.max(0,mr.x-260),y:0,width:760,height:Math.max(60,mr.y+mr.height+12)}});
     await b.page.locator('[data-b4-agehist]').first().click();await b.page.waitForSelector('#b4-age .ag-objpanel');
     assert.equal(await b.page.locator('#b4-age .ag-objpanel [role=progressbar]').getAttribute('aria-valuenow'),String(pts));
     const mt=await b.page.locator('#b4-age .b4-timeline li.cur ul li').first().textContent();assert(mt.includes('献礼目标达成')&&mt.includes(goal.label),'dedication moment shows Chinese label + authoritative text');geo.dedicationMoment=mt;
     await shot(b.page,'ages2-B-objective-chronicle-1440');await b.page.keyboard.press('Escape');await wait(200);
     checks.push(`B objective: real age.objective ${pts}/${goal.cap} («${goal.label}») in the age meter and chronicle; dedication moment rendered as «${mt.trim()}».`);}
   }
   if(w===1440){
    // legacy fallback: an old pending with legacy keys still renders and is accepted by the real engine
    const a=b.g.players[0].age;a.pending={tier:'golden',count:1,options:['g_inquiry','g_monument','g_pax','g_valor'],era:3,deadline:b.g.turn+3,index:b.g.ages.index+1};
    await b.page.evaluate(()=>window.__civ.refresh(true));await b.page.waitForFunction(()=>document.getElementById('b4-age')?.open);
    assert.equal(await b.page.locator('#b4-age [data-b4-bonus]').count(),4);await b.page.locator('#b4-age [data-b4-bonus]').first().hover();await shot(b.page,'ages2-B-legacy-fallback-1440');
    await b.page.locator('#b4-age [data-b4-bonus]').first().click();await b.page.locator('[data-b4-ageconfirm]').click();await wait(500);assert.equal(a.pending,null);assert.deepEqual(a.bonuses,['g_inquiry']);
    checks.push('Legacy fallback: an old g_* pending renders with fallback art/summary and the real ageBonus is accepted.');
    // era backgrounds in the tech tree
    for(const [tw,th] of [[1440,900],[1280,720]]){await b.page.setViewportSize({width:tw,height:th});await wait(250);
     await b.page.locator('[data-b4-codex="tech"]').first().click();await b.page.waitForSelector('.b5-node');
     for(const fr of [0,.36,.62,.8]){await b.page.evaluate(fr=>{const b=document.querySelector('#b4-codex .b4-cx-body');b.scrollLeft=(b.scrollWidth-b.clientWidth)*fr;},fr);await wait(500);
      const em=await b.page.evaluate(()=>[...document.querySelectorAll('.b5-emb-i')].map(s=>({e:s.dataset.e,o:+s.style.opacity})).filter(x=>x.o>0.05));assert(em.length>=1&&em.length<=2);const lab='era'+em.reduce((p,x)=>x.o>p.o?x:p).e;geo[`tree-${tw}-${lab}`]=em;await shot(b.page,`ages2-tree-${lab}-${tw}`);}
     await b.page.locator('[data-b4-close]').click();await wait(300);}
    checks.push('B tree: layered era reliefs crossfade by scroll; 1–2 visible at a time at 1440/1280.');}
   await b.page.close();b.sim.dispose();}
  // contact sheet of all 48 real variants + close-ups (production card markup via ages2CardSheet)
  {const b=await pageFor('B',1680,2160);const order=[...V2].sort((x,y)=>R.AGE_BONUSES[x].eraMin-R.AGE_BONUSES[y].eraMin||R.AGE_BONUSES[x].theme.localeCompare(R.AGE_BONUSES[y].theme)||'ngd'.indexOf(x[0])-'ngd'.indexOf(y[0]));
   const sheet=async keys=>b.page.evaluate(async keys=>{const m=await import('/ui-b/ui-b-v4.js'),d=document.getElementById('b4-age');d.className='ag2 t-golden sheet';
     d.innerHTML=`<div class="b4-dlg age ag2-dlg"><header class="ag-head"><span class="ag-title"><small>AGES2 CONTACT SHEET · REAL CATALOGUE (src/age-data.mjs)</small><h2>48 张献礼卡（16 主题 × 普通 / 黄金 / 黑暗）</h2></span></header><div class="b4-bonuses ag-cards">${m.ages2CardSheet(keys)}</div></div>`;if(!d.open)d.showModal();
     await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const cs=[...d.querySelectorAll('.ag-card')];return {n:cs.length,art:cs.filter(c=>c.querySelector('.ag-art svg g')).length,obj:cs.filter(c=>c.querySelector('.ag-obj')).length};},keys);
   const sh=await sheet(order);geo.sheet=sh;assert.equal(sh.n,48);assert.equal(sh.art,48);assert.equal(sh.obj,16);await b.page.mouse.move(1675,5);await shot(b.page,'ages2-contact-sheet-48');
   checks.push('Contact sheet: all 48 real variants render with their artKey vignette; the 16 normal variants show objective.label + cap pips.');
   await b.page.close();b.sim.dispose();
   const z=await pageFor('B',1440,900,3);await z.page.evaluate(async()=>{const m=await import('/ui-b/ui-b-v4.js'),d=document.getElementById('b4-age');d.className='ag2 t-golden sheet';d.innerHTML=`<div class="b4-dlg age ag2-dlg"><div class="b4-bonuses ag-cards">${m.ages2CardSheet(['g2_ocean_charter','g2_printing','g2_workshops','g2_gunfoundry','g2_scholastic','g2_caravan','g2_foundations','g2_strategic_networks'])}</div></div>`;if(!d.open)d.showModal();});
   await wait(400);for(const k of ['ocean_charter','printing','workshops','gunfoundry','scholastic','caravan'])await z.page.locator(`#b4-age [data-b4-bonus="g2_${k}"] .ag-art`).screenshot({path:path.join(OUT,`ages2-vignette-${k}-3x.png`)});
   checks.push('Vignette close-ups (3× DPR): ocean_charter, printing, workshops, gunfoundry, scholastic, caravan.');await z.page.close();z.sim.dispose();}
  // A side: same adapter, R2 entry, real heroic pick-3 and real normal objective label
  for(const [w,h] of [[1440,900],[1280,720]]){const a=await pageFor('A',w,h);const pd=forceAge(a.g,'heroic',4);await a.page.evaluate(()=>window.__civ.refresh(true));
   await a.page.waitForSelector('.topbar nav [data-age-entry]');await a.page.locator('[data-age-entry]').click();await a.page.waitForSelector('[data-age-pick]');
   assert.equal(await a.page.locator('[data-age-pick]').count(),4);for(const x of pd.options.slice(0,3))await a.page.locator(`[data-age-pick="${x}"]`).click();
   await a.page.locator(`[data-age-pick="${pd.options[0]}"]`).hover();await shot(a.page,`ages2-A-heroic-era4-${w}`);
   await a.page.locator('[data-age-submit]').click();await wait(500);assert.deepEqual(a.g.players[0].age.bonuses,pd.options.slice(0,3));assert.equal(a.g.players[0].age.pending,null);
   checks.push(`A ${w}px: real heroic pick-3 (${pd.options.slice(0,3).join('+')}) accepted by the engine.`);
   if(w===1440){await a.page.evaluate(()=>{const m=document.getElementById('modal');if(m?.open)m.close();});await wait(300);const pn=forceAge(a.g,'normal',5);await a.page.evaluate(()=>window.__civ.refresh(true));await a.page.waitForSelector('.topbar nav [data-age-entry]');await a.page.locator('[data-age-entry]').click();await a.page.waitForSelector('[data-age-pick]');
    const t=await a.page.locator(`[data-age-pick="${pn.options[0]}"] small`).textContent();assert(t.includes(R.AGE_BONUSES[pn.options[0]].objective.label));
    await a.page.locator(`[data-age-pick="${pn.options[1]}"]`).click();await shot(a.page,'ages2-A-normal-era5-1440');await a.page.locator('[data-age-submit]').click();await wait(500);assert.deepEqual(a.g.players[0].age.bonuses,[pn.options[1]]);
    checks.push('A 1440px: real normal pick-1 accepted; card text shows objective.label.');}
   await a.page.close();a.sim.dispose();}
 }finally{await browser.close();fs.writeFileSync(path.join(OUT,'ages2-ui-check.json'),JSON.stringify({checks,errors,geo},null,2));}
 console.log(JSON.stringify({checks,errors,geo},null,1));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
