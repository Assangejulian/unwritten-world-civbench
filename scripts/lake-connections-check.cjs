// Real renderer checks on an owned static server; never run the game API or write saves.
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),output=path.join(root,'output/playwright'),before=fs.readFileSync(path.join(root,'saves/autosave.json'));
const baseline=process.argv.includes('--baseline'),checks=[],metrics={},errors=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const server=http.createServer((req,res)=>{
  const route=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const shared=['/rules.mjs','/river-network.mjs','/nations.mjs'];
  const file=route==='/'?path.join(output,'lake-connections-preview.html'):shared.includes(route)?path.join(root,'src',route.slice(1)):path.resolve(root,'web','.'+route);
  if(route!=='/'&&!shared.includes(route)&&!file.startsWith(path.join(root,'web')+path.sep)){res.writeHead(404).end();return;}
  fs.readFile(file,(error,data)=>{if(error){errors.push('Missing '+route);res.writeHead(404).end();return;}res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'}[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  let browser;await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
    const page=await browser.newPage({viewport:{width:1100,height:760}});page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.waitForFunction(()=>window.lakePreview?.renderer.waterReady&&window.lakePreview.renderer.biomeReady&&window.lakePreview.renderer.modelsReady);
    metrics.adjacency=[];
    for(const [kind,direction]of [...Array.from({length:6},(_,i)=>['pair',i]),['wrap',0],['fog',0]]){
      const result=await page.evaluate(({kind,direction})=>{
        const {renderer:r,fixture}=window.lakePreview,{pair,edge}=fixture(kind,direction),samples=[];
        const period=r.game.map.width*Math.sqrt(3)*35;
        for(const m of r.terrainGroup.children){const g=m.geometry,ids=g?.getAttribute('tileId');if(!ids)continue;const p=g.getAttribute('position'),s=g.getAttribute('shoreDistance'),w=g.getAttribute('waterData');
          for(let i=0;i<ids.count;i++)if(pair.includes(ids.getX(i))){const dx=p.getX(i)-edge.x,canonical=kind==='wrap'?dx-Math.round(dx/period)*period:dx;
            if(Math.hypot(canonical,p.getZ(i)-edge.y)<.001)samples.push({tile:ids.getX(i),height:p.getY(i),shore:s.getX(i),water:w.getX(i)});
          }
        }
        const pixel=r.projectGround(edge.x,edge.y),gl=r.gpu.getContext(),ratio=r.gpu.getPixelRatio(),data=new Uint8Array(4);
        r.dirty=true;r.render();gl.readPixels(Math.round(pixel.x*ratio),Math.round(gl.drawingBufferHeight-pixel.y*ratio),1,1,gl.RGBA,gl.UNSIGNED_BYTE,data);
        return {kind,direction,pair,samples,pixel:[...data],shoreEdges:r.shoreStats.edges};
      },{kind,direction});
      metrics.adjacency.push(result);
      if(!baseline){
        if(kind!=='fog'){
        assert(new Set(result.samples.map(s=>s.tile)).size===2,`${kind}/${direction}: both water tiles must sample the shared edge midpoint`);
        assert(result.samples.every(s=>s.height===0&&s.water===1&&s.shore>14),`${kind}/${direction}: water bridge must remain above the sand blend`);
        }else assert.equal(result.shoreEdges,0,'Unknown shores must not increase water detail or reveal beaches');
        const [red,green,blue]=result.pixel;assert(green>red*1.2&&blue>red*1.05,`${kind}/${direction}: actual shared-edge pixel is sandy ${result.pixel}`);
      }
      if(kind==='pair'&&direction===0)await page.screenshot({path:path.join(output,baseline?'lake-connection-before.png':'lake-connection-after.png')});
    }
    if(!baseline)pass('All six adjacent directions, horizontal wrap and unknown surrounding shores have continuous water pixels');
    metrics.rebuild=await page.evaluate(()=>{
      const {renderer:r,fixture}=window.lakePreview;fixture('large');
      const digest=()=>JSON.stringify(r.terrainGroup.children.filter(m=>m.name==='terrain-ground').map(m=>{
        const hashes={};for(const [name,a]of Object.entries(m.geometry.attributes)){let hash=2166136261;const values=name==='color'?Array.from(a.array,v=>Math.round(v*100000)):new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);for(const v of values)hash=Math.imul(hash^v,16777619);hashes[name]=hash>>>0;}return [m.userData.spatialChunk,hashes];
      }).sort((a,b)=>a[0].localeCompare(b[0])));
      const center=r.game.map.tiles.find(t=>t.row===10&&t.col===14),old=r.game;
      const next={...old,map:{...old.map,tiles:old.map.tiles.slice()}};next.map.tiles[center.id]={...center,terrain:'grass'};r.setState(next);
      const partial=r.terrainBuildStats.partial,local=digest();r.buildTerrain();const equivalent=local===digest();
      const allVertices=r.terrainGroup.children.reduce((n,m)=>n+(m.name==='terrain-ground'?m.geometry.attributes.position.count:0),0);
      const islandHasShore=r.shoreStats.edges>0;
      fixture('fog');const noFogShores=r.shoreStats.edges===0;
      fixture('separated');const landPreserved=r.game.map.tiles[10*r.game.map.width+15].terrain==='grass';
      fixture('ocean');const oceanVertices=r.terrainGroup.children.reduce((n,m)=>n+(m.name==='terrain-ground'?m.geometry.attributes.position.count:0),0),oceanTiles=r.game.map.tiles.length;
      fixture('large');r.dirty=true;r.render();
      return {partial,equivalent,allVertices,islandHasShore,noFogShores,landPreserved,oceanVertices,oceanTiles};
    });
    if(!baseline){assert(metrics.rebuild.partial&&metrics.rebuild.equivalent);assert(metrics.rebuild.islandHasShore&&metrics.rebuild.noFogShores&&metrics.rebuild.landPreserved);pass('Local lake changes equal a full rebuild; islands, separated land and fog remain intact');}
    if(!baseline){assert.equal(metrics.rebuild.oceanVertices,metrics.rebuild.oceanTiles*18);pass('Open water retains six triangles per tile; extra samples remain confined to known shorelines');}
    await page.screenshot({path:path.join(output,baseline?'lake-preview-before.png':'lake-preview.png')});
    assert.equal(errors.length,0,errors.join('\n'));assert(fs.readFileSync(path.join(root,'saves/autosave.json')).equals(before));
    if(!baseline)pass('Real WebGL shader renders without errors and the active save remains byte-identical');
    metrics.save={turn:JSON.parse(before).turn,unchanged:true,sha256:crypto.createHash('sha256').update(before).digest('hex')};
    fs.writeFileSync(path.join(output,baseline?'lake-connections-baseline.json':'lake-connections-checks.json'),JSON.stringify({passed:true,baseline,gameLaunched:false,headlessIsolatedPreview:true,checks,metrics,errors},null,2));
    console.log(JSON.stringify({baseline,adjacency:metrics.adjacency.map(r=>({kind:r.kind,direction:r.direction,samples:r.samples.length,pixel:r.pixel})),rebuild:metrics.rebuild}));
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
