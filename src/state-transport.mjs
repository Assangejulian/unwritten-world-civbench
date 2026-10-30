// Bounded, perspective-local snapshot history. Signatures never retain live engine references.
export class StateTransport{
  constructor(limit=4){this.limit=limit;this.views=new Map();this.generation=0;}
  // generation changes on every history reset so callers can detect stale paced revisions.
  clear(){this.views.clear();this.generation++;}
  has(gameId,view,revision){const history=this.views.get(String(view));return !!history&&history[0]?.game.id===gameId&&history.some(entry=>entry.revision===revision);}
  response(gameId,revision,view,since,clientGame,makeSnapshot){
    const key=String(view);let history=this.views.get(key);
    if(!history){history=[];this.views.set(key,history);}
    if(history[0]?.game.id!==gameId)history.length=0;
    let current=history.find(entry=>entry.revision===revision);
    if(!current){
      const game=makeSnapshot(),fields={},detached={},latest=history.at(-1);
      for(const [name,value]of Object.entries(game))if(name!=='map'){
        const signature=JSON.stringify(value);fields[name]=signature;
        if(signature!==undefined)detached[name]=latest&&signature===latest.fields[name]?latest.game[name]:JSON.parse(signature);
      }
      const {tiles,...metadata}=game.map;
      const signatures=tiles.map(t=>JSON.stringify(t)),metadataSignature=JSON.stringify(metadata);
      detached.map={...JSON.parse(metadataSignature),tiles:signatures.map((signature,index)=>latest?.tiles[index]===signature?latest.game.map.tiles[index]:JSON.parse(signature))};
      current={revision,game:detached,fields,metadata:metadataSignature,tiles:signatures};
      history.push(current);if(history.length>this.limit)history.shift();
    }
    const previous=clientGame===gameId?history.find(entry=>entry.revision===since):null;
    if(!previous||previous.metadata!==current.metadata||previous.tiles.length!==current.tiles.length)return {game:current.game};
    const fields={},tiles=[];
    for(const name of Object.keys(current.fields))if(current.fields[name]!==previous.fields[name])fields[name]=current.game[name];
    for(let index=0;index<current.tiles.length;index++)if(current.tiles[index]!==previous.tiles[index])tiles.push(current.game.map.tiles[index]);
    return {delta:{baseRevision:since,id:gameId,view,fields,tiles}};
  }
}
