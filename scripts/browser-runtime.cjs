// Resolve optional audit dependencies without publishing a developer's home path.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
function load(name){
  const roots=[process.env.CIV_BROWSER_MODULES,path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules')].filter(Boolean);
  try{return require(name);}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
  for(const root of roots){const file=path.join(root,name);if(fs.existsSync(file))return require(file);}
  throw Error(`Install ${name} locally or set CIV_BROWSER_MODULES to the directory containing it.`);
}
function chromiumExecutable(){
  if(process.env.CIV_CHROMIUM_EXECUTABLE)return process.env.CIV_CHROMIUM_EXECUTABLE;
  const bundled=load('playwright').chromium.executablePath();if(fs.existsSync(bundled))return bundled;
  const cache=process.env.PLAYWRIGHT_BROWSERS_PATH||path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'ms-playwright');
  if(fs.existsSync(cache))for(const folder of fs.readdirSync(cache).filter(f=>/^chromium-\d+$/.test(f)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1]))){
    const file=path.join(cache,folder,'chrome-win64','chrome.exe');if(fs.existsSync(file))return file;
  }
  throw Error('Chromium is unavailable. Run npx playwright install chromium or set CIV_CHROMIUM_EXECUTABLE.');
}
module.exports={load,chromiumExecutable};
