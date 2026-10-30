// Match the yield label and calculation to the same visible perspective.
const BASE = Object.freeze({id:-1,techs:[],civics:[]});
export function tileYieldPerspective(game,tile,view,selectedPlayer) {
  if(view>=0){const player=game?.players.find(p=>p.id===view)||selectedPlayer||BASE;return {player,label:player.short||player.name||'当前文明'};}
  const owner=Number.isInteger(tile?.owner)&&tile.owner>=0?game?.players.find(p=>p.id===tile.owner):null;
  return owner?{player:owner,label:owner.short||owner.name}:{player:BASE,label:'基础产出'};
}
