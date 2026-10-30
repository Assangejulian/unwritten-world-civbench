import assert from 'node:assert/strict';
import {readFile,writeFile,unlink,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {ROOT,importSource,compileDriver,executeDriver,driverInfo} from '../src/drivers.mjs';
import {createGame,observation,applyOrders} from '../src/engine.mjs';
const source=`#include "civ.hpp"
#include <chrono>
#include <thread>
int main() {
    const std::string input((std::istreambuf_iterator<char>(std::cin)), std::istreambuf_iterator<char>());
    const auto observation = civ::Json::parse(input);
    const auto mode = observation["memory"]["mode"].str();
    if (mode == "invalid") { std::cout << "invalid-json"; return 0; }
    if (mode == "oversized") { std::cout << std::string(300000, 'X'); return 0; }
    if (mode == "timeout") { std::this_thread::sleep_for(std::chrono::seconds(4)); return 0; }
    civ::Strategy strategy;
    strategy.science = 2.0;
    std::cout << civ::decide(observation, strategy).dump() << '\\n';
    return 0;
}
`;
const report={passed:false,checks:[]};let file;
try{
  file=await importSource('verification.cpp',source);const build=await compileDriver(file);assert.equal(build.status,'ready');report.checks.push('Imported C++ source compiles to a native executable');
  const g=createGame({players:2,seed:'CUSTOM-DRIVER',barbarians:false}),p=g.players[0];p.driver.file=file;const obs=observation(g,p),result=await executeDriver(p,obs);assert(Array.isArray(result.orders));applyOrders(g,p,result.orders);assert(g.cities.some(c=>c.owner===0));report.checks.push('Custom native player founds a real city');
  for(const [mode,message]of [['invalid','stdout'],['oversized','上限'],['timeout','2000ms']]){const input={...obs,memory:{mode}};await assert.rejects(executeDriver(p,input),e=>e.message.includes(message));report.checks.push(`Native ${mode} response is rejected`);}
  const info=await driverInfo(file),originalHash=createHash('sha256').update(await readFile(info.binary)).digest('hex');await writeFile(path.join(ROOT,'players',file),'int main() { broken code; }');
  await assert.rejects(compileDriver(file,true));assert.equal(createHash('sha256').update(await readFile(info.binary)).digest('hex'),originalHash);assert.equal((await driverInfo(file)).status,'uncompiled');await assert.rejects(executeDriver(p,obs),e=>e.message.includes('源码已变更'));report.checks.push('Failed rebuild preserves binary and blocks stale execution');
  await writeFile(path.join(ROOT,'players',file),source);assert.equal((await compileDriver(file)).status,'ready');report.checks.push('Restoring the matching source makes its binary usable again');report.passed=true;report.file=file;report.compileMs=build.ms;
}finally{
  if(file){const base=file.replace(/\.cpp$/,'');for(const relative of [`players/${file}`,`bin/${base}.exe`,`bin/${base}.exe.json`,`bin/${base}.building.exe`,`bin/${base}.building.pdb`]){const target=path.resolve(ROOT,relative);assert(target.startsWith(ROOT+path.sep));await unlink(target).catch(e=>{if(e.code!=='ENOENT')throw e;});}}
  await mkdir(path.join(ROOT,'output'),{recursive:true});await writeFile(path.join(ROOT,'output','driver-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
