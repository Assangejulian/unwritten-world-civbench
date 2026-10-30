// Keep historical PNG goldens untouched; compare frozen-before and current art in the same browser.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/playwright/render-cache-trial-20261017/death-regression');fs.mkdirSync(out,{recursive:true});
const name=path.join(root,'scripts/unit-death-check.cjs');let code=fs.readFileSync(name,'utf8');
const routes={
 "path.join(root,'output/unit-death-baseline.json')":"path.join(root,'output/playwright/render-cache-trial-20261017/death-regression/baseline.json')",
 "path.join(root,'output/unit-death-checks.json')":"path.join(root,'output/playwright/render-cache-trial-20261017/death-regression/checks.json')",
 "path.join(root,'output/playwright/'+type+'-death-in-game.png')":"path.join(root,'output/playwright/render-cache-trial-20261017/death-regression/'+type+'-death-in-game.png')"
};
for(const [a,b]of Object.entries(routes)){if(!code.includes(a))throw Error('Missing output isolation anchor');code=code.replaceAll(a,b);}
const anchor="res.setHeader('Content-Type',";
if(code.split(anchor).length!==3)throw Error('Missing frozen-server anchor');
// Only the file-serving branch, not the inline HTML response, has a file variable.
const pos=code.lastIndexOf(anchor);code=code.slice(0,pos)+"if(baseline){const frozen=path.join(root,'output/playwright/render-cache-trial-20261017/frozen',path.relative(root,file));if(fs.existsSync(frozen))file=frozen;}"+code.slice(pos);
const loaded=new Module(name,module);loaded.filename=name;loaded.paths=Module._nodeModulePaths(path.dirname(name));loaded._compile(code,name);
