// Never merge a delta from another world, perspective or revision.
export function mergeStateDelta(game,delta,revision,view){
  if(!game||delta.id!==game.id||delta.baseRevision!==revision||delta.view!==view)throw new Error('State delta requires a fresh snapshot.');
  const next={...game,...delta.fields};
  if(delta.tiles.length){const tiles=game.map.tiles.slice();for(const tile of delta.tiles){if(!Number.isInteger(tile.id)||tile.id<0||tile.id>=tiles.length)throw new Error('Invalid tile delta.');tiles[tile.id]=tile;}next.map={...game.map,tiles};}
  return next;
}
