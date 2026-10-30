import {readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import * as R from '../src/rules.mjs';
import {HERITAGE_DESIGN as currentDesign} from '../src/heritage-data.mjs';

const proposed=process.argv[2];
const baseline=JSON.parse(await readFile(new URL('../output/wonders-great-people-20261015/expanded-v2.0.3.json',import.meta.url),'utf8'));
const design=proposed?JSON.parse(await readFile(proposed,'utf8')):currentDesign;
const errors=[],warnings=[],check=(condition,message)=>{if(!condition)errors.push(message);};
const oldPeople=new Map(baseline.greatPeopleRoster.map(v=>[v.key,v])),oldWonders=new Map(baseline.wonders.map(v=>[v.key,v]));
const people=design.greatPeopleRoster||[],wonders=design.wonders||[],classes=design.greatPeopleClasses||[];
const normalized=value=>String(value||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g,'');
for(const [name,list,count]of [['people',people,256],['wonders',wonders,64],['classes',classes,9]]){
 check(list.length===count,`${name}: expected ${count}, got ${list.length}`);
 for(const field of ['key','name',...(name==='classes'?[]:['englishName'])]){
  const names=list.map(v=>normalized(v[field]));check(names.every(Boolean),`${name}: missing ${field}`);check(new Set(names).size===names.length,`${name}: duplicate ${field}`);
 }
}
const classCounts={},eraCounts={},positions=new Set(),baselineTargets=new Set(baseline.greatPeopleRoster.map(v=>v.targetRequirement));
for(const person of people){
 const label=person.key,params=person.recipeParams||{},recipe=design.recipeRegistry?.[person.recipeType];classCounts[person.classKey]=(classCounts[person.classKey]||0)+1;eraCounts[person.era]=(eraCounts[person.era]||0)+1;
 check(classes.some(c=>c.key===person.classKey),`${label}: invalid class`);check(Number.isInteger(person.era)&&person.era>=0&&person.era<=6,`${label}: invalid era`);
 check(Number.isInteger(person.charges)&&person.charges>0&&person.charges<=7,`${label}: invalid charges`);check(Number.isFinite(person.baseThreshold)&&person.baseThreshold>0,`${label}: invalid threshold`);
 const position=[person.classKey,person.era,person.eraIndex].join(':');check(!positions.has(position),`${label}: duplicate eraIndex ${position}`);positions.add(position);
 check(!!recipe,`${label}: missing recipe ${person.recipeType}`);check(!!baseline.recipeRegistry[person.recipeType],`${label}: new required recipe ${person.recipeType}`);
 check(baselineTargets.has(person.targetRequirement),`${label}: new target requirement ${person.targetRequirement}`);
 for(const parameter of Object.keys(params)){check(recipe?.parameters?.includes(parameter),`${label}: undeclared parameter ${parameter}`);check(!!person.effectScopes?.[parameter],`${label}: missing effect scope ${parameter}`);}
 check(!!person.runtimeRules,`${label}: missing runtime rules`);
 for(const tech of params.eurekaTechs||[])check(!!R.TECHS[tech],`${label}: invalid tech ${tech}`);
 for(const civic of params.inspirationCivics||[])check(!!R.CIVICS[civic],`${label}: invalid civic ${civic}`);
 if(params.freeBuilding)check(!!R.BUILDINGS[params.freeBuilding],`${label}: invalid building ${params.freeBuilding}`);
 if(params.freeNavalUnit)check(!!R.UNITS[params.freeNavalUnit],`${label}: invalid naval gift ${params.freeNavalUnit}`);
 if(params.workType){check(params.works?.length===person.charges,`${label}: work count differs from charges`);check(params.works?.every(w=>!!w.title&&['culture','tourism','faith'].every(k=>w[k]===undefined||Number.isFinite(w[k]))),`${label}: malformed work`);}
 if(person.aura){check(person.aura.applicableEras?.every(e=>Number.isInteger(e)&&e>=0&&e<=6),`${label}: invalid aura era`);check((person.aura.artilleryRange||0)<=2&&(person.aura.artilleryBombardRange||0)<=2,`${label}: excessive range bonus`);}
 const old=oldPeople.get(label);if(old)for(const field of ['classKey','era','eraIndex','charges','baseThreshold','targetRequirement','recipeType','recipeParams','effectScopes','aura'])check(isDeepStrictEqual(person[field],old[field]),`${label}: baseline field changed: ${field}`);
}
for(const old of oldPeople.keys())check(people.some(v=>v.key===old),`Missing baseline person ${old}`);
const passiveFields=new Set(baseline.wonders.flatMap(w=>Object.keys(w.passiveEffects))),grantFields=new Set(baseline.wonders.flatMap(w=>Object.keys(w.instantGrants)));
for(const key of ['cityHousingBonus'])passiveFields.add(key);
for(const wonder of wonders){
 const label=wonder.key;check(!wonder.tech||!!R.TECHS[wonder.tech],`${label}: invalid tech ${wonder.tech}`);check(!wonder.civic||!!R.CIVICS[wonder.civic],`${label}: invalid civic ${wonder.civic}`);check(wonder.footprintHexes===1,`${label}: invalid footprint`);
 check(wonder.placement?.validTerrains?.every(t=>Object.hasOwn(R.TERRAINS,t)),`${label}: invalid terrain`);
 for(const field of ['requiresAdjacentDistrict','requiresDistrictBuilding'])if(wonder.placement?.[field])check(!!R.BUILDINGS[wonder.placement[field]],`${label}: invalid ${field}`);
 for(const free of wonder.instantGrants?.freeUnits||[])check(!!R.UNITS[free.unitType]&&free.count>0,`${label}: invalid unit grant`);
 for(const field of Object.keys(wonder.passiveEffects||{}))check(passiveFields.has(field),`${label}: unsupported passive ${field}`);
 for(const field of Object.keys(wonder.instantGrants||{}))check(grantFields.has(field),`${label}: unsupported completion effect ${field}`);
 const old=oldWonders.get(label);if(old)for(const field of ['era','tech','civic','cost','placement','recurringYields','instantGrants','passiveEffects'])check(isDeepStrictEqual(wonder[field],old[field]),`${label}: baseline field changed: ${field}`);
}
for(const old of oldWonders.keys())check(wonders.some(v=>v.key===old),`Missing baseline wonder ${old}`);
for(const [key,count]of Object.entries(classCounts))check(design.statistics?.distributionByClass?.[key]===count,`Wrong reported class count: ${key}`);
check(design.statistics?.greatPeopleCount===256&&design.statistics?.wondersCount===64,'Statistics totals disagree');
check(people.filter(v=>!oldPeople.has(v.key)).length===156,'Expected 156 additions');check(wonders.filter(v=>!oldWonders.has(v.key)).length===28,'Expected 28 wonder additions');
warnings.push('Names/biographies/works require historical judgement; schema validation is not a historical fact-check.');
const report={at:new Date().toISOString(),version:design.version,counts:{people:people.length,wonders:wonders.length,classes:classes.length,classCounts,eraCounts},newPeople:people.filter(v=>!oldPeople.has(v.key)).map(v=>v.key),newWonders:wonders.filter(v=>!oldWonders.has(v.key)).map(v=>v.key),errors,warnings,passed:errors.length===0};
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
