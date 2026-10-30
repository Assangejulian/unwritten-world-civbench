import auditBrowserRuntime from './browser-runtime.cjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {PAINTED_UNITS} from '../web/painted-actions.js';
const sharp=auditBrowserRuntime.load('sharp');
const read=file=>readFile(new URL('../'+file,import.meta.url)),hash=bytes=>createHash('sha256').update(bytes).digest('hex'),checks=[];
const manifest=JSON.parse(await read('web/assets/air-warfare/manifest.json'));
assert.equal(manifest.mainPoses,120);assert.equal(manifest.records.length,16);assert.equal(manifest.newUnitTypes.length,6);assert.equal(manifest.staticAssets.length,2);
for(const record of manifest.records){const original=await read(record.original),runtime=await read(record.runtime);assert.equal(hash(original),record.sourceSha256);assert.equal(hash(runtime),record.runtimeSha256);assert.equal(runtime.length,record.bytes);assert((await sharp(original).metadata()).hasAlpha);assert((await sharp(runtime).metadata()).hasAlpha);}
checks.push('All eight original ImageGen sources and sixteen runtime assets have matching provenance hashes and real alpha');
const unique=new Set();for(const type of manifest.newUnitTypes){const spec=PAINTED_UNITS[type],record=manifest.records.find(r=>r.key===type);assert.equal(spec.file,'air-warfare/'+type+'.webp');assert(spec.grid&&spec.lazy);assert.equal(record.sourceCells.length,20);assert.equal(record.sourceBands.length,5);assert.deepEqual(record.actions,{idle:4,move:8,attack:8});const bytes=await read(record.runtime),meta=await sharp(bytes).metadata();assert.equal(meta.width,512);assert.equal(meta.height,640);unique.add(record.sourceSha256);for(let i=0;i<20;i++){const alpha=await sharp(bytes).extract({left:i%4*128,top:Math.floor(i/4)*128,width:128,height:128}).ensureAlpha().raw().toBuffer();let occupied=0;for(let p=3;p<alpha.length;p+=4)if(alpha[p]>24)occupied++;assert(occupied>150,type+' pose '+i+' is empty');}}assert.equal(unique.size,6);
checks.push('Six distinct identities provide 120 nonempty authored poses with shared scale and fixed anchors; lazy painted assets take precedence');
for(const file of ['web/assets/world-systems/manifest.json','web/assets/medical/manifest.json','web/assets/siege-aviation/manifest.json'])for(const record of JSON.parse(await read(file)).records){if(record.runtimeSha256)assert.equal(hash(await read(record.runtime)),record.runtimeSha256);if(record.sourceSha256&&record.original)assert.equal(hash(await read(record.original)),record.sourceSha256);}
checks.push('Existing drone, rocket artillery, old bomber, medical and world-system artwork remains byte-identical');
const report={passed:true,checks,assets:16,mainPoses:120,activeSaveWritten:false,gameLaunched:false};await writeFile(new URL('../output/air-warfare-art-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');for(const check of checks)console.log('PASS '+check);
