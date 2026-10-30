import {dist} from './rules.mjs';

export function initializeTerritories(g){
  const cities=new Map(g.cities.map(c=>[c.id,c]));
  for(const t of g.map.tiles){
    const pinned=t.cityId??t.district?.city;
    if(pinned!=null&&cities.has(pinned)){t.territoryCity=pinned;t.owner=cities.get(pinned).owner;if(t.fort)t.fort.owner=t.owner;continue;}
    if(t.owner==null)continue;
    if(t.territoryCity!=null){if(!cities.has(t.territoryCity))throw Error('Invalid territorial city.');t.owner=cities.get(t.territoryCity).owner;if(t.fort)t.fort.owner=t.owner;continue;}
    const nearest=g.cities.map(c=>({c,d:dist(t,g.map.tiles[c.tile],g.map)})).sort((a,b)=>a.d-b.d||a.c.id-b.c.id);
    // Repair old partial conquests only inside the captured city's nearest area.
    const captured=nearest[0];
    const city=captured?.d<=3&&captured.c.originalOwner===t.owner?captured.c:nearest.find(x=>x.c.owner===t.owner)?.c;
    if(city){t.territoryCity=city.id;t.owner=city.owner;if(t.fort)t.fort.owner=city.owner;}
  }
}
export function transferCityTerritory(g,city,newOwner){
  delete city.loyaltyStatus;
  for(const t of g.map.tiles)if(t.territoryCity===city.id||t.cityId===city.id||t.district?.city===city.id){t.owner=newOwner;t.territoryCity=city.id;if(t.fort)t.fort.owner=newOwner;}
  for(const w of Object.values(g.wonders))if(w.city===city.id)w.owner=newOwner;
}
