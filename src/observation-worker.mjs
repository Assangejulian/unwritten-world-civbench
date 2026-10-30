import {parentPort} from 'node:worker_threads';
import {indexMap} from './world.mjs';
import {observation} from './engine.mjs';
parentPort.on('message',({id,game,player,options})=>{
 try{indexMap(game.map);const started=performance.now(),result=observation(game,game.players[player],options);parentPort.postMessage({id,result,ms:performance.now()-started});}
 catch(error){parentPort.postMessage({id,error:error.message});}
});
