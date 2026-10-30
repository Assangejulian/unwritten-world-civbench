import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {CIV_PALETTE_16,PAIR_DE,assignCivPalette,deriveSecondary} from '../src/civ-colours.mjs';
const checks=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
assert.equal(CIV_PALETTE_16.length,16);assert.equal(new Set(CIV_PALETTE_16.map(p=>p.color)).size,16);
for(let i=0;i<16;i++)for(let j=0;j<16;j++){assert(Number.isFinite(PAIR_DE[i][j]));assert.equal(PAIR_DE[i][j],PAIR_DE[j][i]);assert.equal(PAIR_DE[i][i],0);if(i!==j)assert(PAIR_DE[i][j]>=14);}
for(const n of [2,8,16]){const distance=(i,j)=>Math.abs(i-j)+1,oldRandom=Math.random;let chosen;try{Math.random=()=>{throw Error('Palette assignment consumed randomness');};chosen=assignCivPalette(n,distance);}finally{Math.random=oldRandom;}assert.equal(new Set(chosen.map(p=>p.color)).size,n);assert.deepEqual(chosen,assignCivPalette(n,distance));}
pass('Sixteen unique two-tone entries have a symmetric distance matrix and deterministic RNG-free assignment');
for(const count of [2,8,16]){
 const options={players:count,size:count===16?'massive':'small',seed:'PALETTE-RELEASE-'+count,barbarians:false},a=E.createGame(options),b=E.createGame(options);
 // Match IDs identify separate runs; all seeded gameplay and color data must agree.
 b.id=a.id;assert.equal(E.serialize(a),E.serialize(b));assert.equal(new Set(a.players.map(p=>p.color)).size,count);assert(a.players.every(p=>/^#[0-9a-f]{6}$/i.test(p.secondaryColor)));
 const saved=E.serialize(a),restored=E.restore(saved);assert.equal(E.serialize(restored),saved);
}
pass('Actual 2/8/16-player worlds are deterministic, use unique colors and round-trip without state drift');
const g=E.createGame({players:4,size:'small',seed:'LEGACY-COLOURS',barbarians:false}),raw=JSON.parse(E.serialize(g));raw.players.forEach((p,i)=>{p.color=['#6fc1d0','#dd806e','#9dc47f','#d6b56f'][i];delete p.secondaryColor;});
const old=JSON.stringify(raw),restored=E.restore(old);assert.deepEqual(restored.players.map(p=>p.color),raw.players.map(p=>p.color));assert(restored.players.every(p=>p.secondaryColor===deriveSecondary(p.color)));const canonical=E.serialize(restored);assert.equal(E.serialize(E.restore(canonical)),canonical);
assert.deepEqual(restored.units,raw.units);assert.equal(restored.rngState,raw.rngState);assert.equal(restored.turn,raw.turn);
raw.players[0].secondaryColor='invalid';assert.equal(E.restore(JSON.stringify(raw)).players[0].secondaryColor,deriveSecondary(raw.players[0].color));
pass('Legacy colors, units, turn and RNG survive migration; malformed secondary colors use the safe fallback');
const out=process.env.UI_CHECK_OUTPUT||'output/universe-review-20261023';await mkdir(out,{recursive:true});await writeFile(out+'/civ-colours-checks.json',JSON.stringify({passed:true,checks},null,2));
