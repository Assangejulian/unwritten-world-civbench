const {app,BrowserWindow,ipcMain,Menu,dialog}=require('electron');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const {validOperatorLink,existingOperatorLink,authorizedMatchNavigation}=require('./operator-link.cjs');
const ROOT=path.resolve(__dirname,'..');
const PORT=Number(process.env.PORT)||43821;
const URL=`http://127.0.0.1:${PORT}/`;
let window,server,quitting=false,operatorLink=null;
app.setName('Hex Civilizations');
app.setPath('userData',path.join(ROOT,'saves','desktop-profile'));
if(!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
  app.whenReady().then(start).catch(error=>{dialog.showErrorBox('Game could not start',error.stack||error.message);app.quit();});
}
async function health(){try{const response=await fetch(URL+'health',{signal:AbortSignal.timeout(1500)});return response.ok?await response.json():null;}catch{return null;}}
async function start(){
  fs.mkdirSync(path.join(ROOT,'logs'),{recursive:true});
  await new Promise((resolve,reject)=>{const log=fs.openSync(path.join(ROOT,'logs','desktop-build.log'),'w'),build=spawn(path.join(ROOT,'tools','node.exe'),[path.join(ROOT,'scripts','build.mjs')],{cwd:ROOT,windowsHide:true,stdio:['ignore',log,log]});fs.closeSync(log);build.on('error',reject);build.on('exit',code=>code===0?resolve():reject(new Error('A C++ player could not compile. See logs/desktop-build.log.')));});
  let state=await health();
  if(state&&(state.app!=='hex-civilizations'||path.resolve(state.project)!==ROOT))throw new Error('The game port is occupied by another project.');
  if(!state){
    fs.mkdirSync(path.join(ROOT,'logs'),{recursive:true});
    const log=fs.openSync(path.join(ROOT,'logs','desktop-server.log'),'a');
    server=spawn(path.join(ROOT,'tools','node.exe'),[path.join(ROOT,'server.mjs')],{cwd:ROOT,env:{...process.env,PORT:String(PORT)},windowsHide:true,stdio:['ignore',log,log,'ipc']});
    server.on('message',message=>{if(message?.type==='desktop-setup')operatorLink=validOperatorLink(message.url,URL);});
    fs.closeSync(log);
    fs.writeFileSync(path.join(ROOT,'logs','desktop-server.pid'),String(server.pid));
    for(let attempt=0;attempt<80&&!state;attempt++){
      await new Promise(resolve=>setTimeout(resolve,150));state=await health();
      if(server.exitCode!==null)throw new Error('The local game server exited. See logs/desktop-server.log.');
    }
    if(!state)throw new Error('The local game server did not become ready.');
  }
  Menu.setApplicationMenu(null);
  window=new BrowserWindow({title:'诸文明 · 六角纪元',icon:path.join(ROOT,'web/assets/branding/game-icon.ico'),width:1440,height:900,minWidth:900,minHeight:640,backgroundColor:'#183132',show:false,fullscreen:true,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,target)=>{
    if(target.startsWith(URL))return;
    event.preventDefault();
    void authorizedMatchNavigation(URL,operatorLink,target).then(allowed=>{if(allowed&&!window.isDestroyed())return window.loadURL(target);}).catch(()=>{});
  });
  window.webContents.on('before-input-event',(event,input)=>{
    if(input.type!=='keyDown')return;
    if(input.key==='F11'||input.key==='Enter'&&input.alt){event.preventDefault();window.setFullScreen(!window.isFullScreen());}
  });
  for(const event of ['enter-full-screen','leave-full-screen'])window.on(event,()=>window.webContents.send('desktop:fullscreen',window.isFullScreen()));
  window.once('ready-to-show',()=>window.show());
  window.on('close',event=>{if(!quitting){event.preventDefault();app.quit();}});
  if(!operatorLink)operatorLink=await existingOperatorLink(ROOT,URL);
  await window.loadURL(operatorLink||URL);
}
ipcMain.handle('desktop:fullscreen',()=>{window.setFullScreen(!window.isFullScreen());return window.isFullScreen();});
ipcMain.handle('desktop:state',()=>({desktop:true,fullscreen:window?.isFullScreen()||false,version:app.getVersion()}));
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',event=>{
  if(quitting)return;event.preventDefault();quitting=true;
  (async()=>{
    try{
      await fetch(URL+'api/pause',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      for(let i=0;i<300;i++){const state=await fetch(URL+'api/state').then(r=>r.json());if(!state.session.busy)break;await new Promise(r=>setTimeout(r,150));}
      const saved=await fetch(URL+'api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'autosave'}),signal:AbortSignal.timeout(5000)});
      if(!saved.ok)throw new Error(`Save failed: HTTP ${saved.status}`);
    }catch(error){fs.appendFileSync(path.join(ROOT,'logs','desktop-server.log'),`\nSave on exit: ${error.message}\n`);}
    if(server){
      if(process.platform==='win32')await new Promise(resolve=>{const stop=spawn('taskkill.exe',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});stop.once('exit',resolve);stop.once('error',()=>{server.kill();resolve();});});
      else server.kill();
      try{fs.unlinkSync(path.join(ROOT,'logs','desktop-server.pid'));}catch{}
    }
    app.quit();
  })();
});
