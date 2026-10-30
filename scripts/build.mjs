import {buildPlayers} from '../src/drivers.mjs';
try{await buildPlayers();console.log('All eight native C++ players are ready.');}catch(e){console.error(e.message);process.exitCode=1;}
