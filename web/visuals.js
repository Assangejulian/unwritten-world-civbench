import {UNIT_ETCHINGS,UNIT_ANIMATION_HINTS} from './unit-etchings.js';
// Each unit uses the same atlas artwork with a distinct motion profile.
export const UNIT_MOTIONS={
  great_person:{family:'civilian',cadence:11,bob:1.4,swing:.035},
  great_admiral:{family:'naval',cadence:7,bob:.8,swing:.08},
  herbalist:{family:'civilian',cadence:11,bob:1.4,swing:.035},
  surgeon:{family:'civilian',cadence:11,bob:1.4,swing:.035},
  fieldmedic:{family:'civilian',cadence:13,bob:1.4,swing:.035},
  ambulance:{family:'vehicle',cadence:20,bob:.5,swing:.02},
  bomber:{family:'bomb',cadence:18,bob:.5,swing:.02},
  trebuchet:{family:'siege',cadence:18,bob:.6,swing:.04},
  envoy:{family:'civilian',cadence:11,bob:1.4,swing:.035},
  settler:{family:'civilian',cadence:10,bob:1.4,swing:.04},
  builder:{family:'civilian',cadence:12,bob:1.7,swing:.06},
  scout:{family:'melee',cadence:17,bob:2.8,swing:.11},
  warrior:{family:'melee',cadence:12,bob:2,swing:.16},
  archer:{family:'arrow',cadence:13,bob:1.8,swing:.07},
  spearman:{family:'melee',cadence:12,bob:1.8,swing:.09},
  swordsman:{family:'melee',cadence:13,bob:2,swing:.2},
  horseman:{family:'cavalry',cadence:16,bob:3.2,swing:.1},
  catapult:{family:'siege',cadence:19,bob:.7,swing:.07},
  crossbow:{family:'arrow',cadence:12,bob:1.8,swing:.06},
  knight:{family:'cavalry',cadence:15,bob:2.7,swing:.14},
  musket:{family:'bullet',cadence:12,bob:1.6,swing:.09},
  cannon:{family:'shell',cadence:20,bob:.7,swing:.1},
  tank:{family:'shell',cadence:24,bob:.5,swing:.025},
  galley:{family:'naval',cadence:7,bob:.8,swing:.08},
  frigate:{family:'shell',cadence:6,bob:.9,swing:.07},
  missionary:{family:'civilian',cadence:11,bob:1.4,swing:.035},
  rifleman:{family:'bullet',cadence:14,bob:1.7,swing:.075},
  bombard:{family:'shell',cadence:20,bob:.65,swing:.1},
  destroyer:{family:'shell',cadence:6,bob:.6,swing:.045}
};

Object.assign(UNIT_MOTIONS,{infantry:{family:'bullet',cadence:14,bob:1.7,swing:.075},mechanized:{family:'bullet',cadence:21,bob:.5,swing:.02},modernarmor:{family:'shell',cadence:24,bob:.5,swing:.02},rocketartillery:{family:'missile',cadence:20,bob:.5,swing:.02},missilecruiser:{family:'missile',cadence:6,bob:.6,swing:.04},assaultship:{family:'naval',cadence:6,bob:.6,swing:.04},drone:{family:'bomb',cadence:18,bob:.4,swing:.02},apostle:{family:'civilian',cadence:11,bob:1.4,swing:.035},inquisitor:{family:'civilian',cadence:11,bob:1.4,swing:.035}});
UNIT_MOTIONS.destroyer.family='naval';
for(const type of ['submarine','nuclearsubmarine'])UNIT_MOTIONS[type]={family:'torpedo',cadence:6,bob:.45,swing:.02};
UNIT_MOTIONS.aircraftcarrier={family:'naval',cadence:6,bob:.45,swing:.02};
export const uniqueMotionBases={"qin_crossbow":"crossbow","han_cavalry":"horseman","xuanjia_knight":"knight","wuju_guard":"manatarms","hwacha":"crossbow","hatamoto_samurai":"manatarms","hetairoi":"horseman","roman_legion":"swordsman","praetorian_guard":"swordsman","athenian_trireme":"galley","persian_immortal":"swordsman","scythed_chariot":"horseman","ptolemaic_flagship":"galley","punt_expedition_ship":"galley","maryannu_chariot":"horseman","dharma_elephant":"pikeman","maurya_war_elephant":"horseman","mamluk_knight":"knight","janissary":"musket","keshig":"courser","mandekalu_cavalry":"knight","zulu_impi":"pikeman","sea_dog":"frigate","cossack":"cavalry","warakaq":"crossbow"};


export const RESOURCE_MARKS={
  wheat:{kind:'bonus',color:'#dfbd65',path:'M0 8V-8 M0 2L-5-2 M0-2L5-6 M0-5L-4-8'},
  cattle:{kind:'bonus',color:'#d8c9a2',path:'M-6-3L-8-7 M6-3L8-7 M-6-3H6V3L2 7H-2L-6 3Z'},
  deer:{kind:'bonus',color:'#d8c9a2',path:'M-2 8V-2L-7-6V-9 M-7-6L-10-5 M2 8V-2L7-6V-9 M7-6L10-5 M-3 3H3'},
  fish:{kind:'bonus',color:'#8cc7da',path:'M-8 0Q0-9 7 0Q0 9-8 0L-11 5V-5Z M3-2V-1'},
  stone:{kind:'bonus',color:'#bdc4c0',path:'M-9 5L-5-5L3-7L9 1L6 7Z M-5-5L0 4L9 1'},
  iron:{kind:'strategic',color:'#a9c4d5',path:'M-9-6H6L9-2L6 5H-7L-10 1Z M-9-6L-6-2H9 M-6-2L-7 5'},
  horses:{kind:'strategic',color:'#cfb494',path:'M-6 8V0L-2-7L2-9L3-4L8 0L5 4L1 2L0 8Z'},
  gold:{kind:'luxury',color:'#f3ce64',path:'M-9 5L-6-3H6L9 5Z M-6-3L-4-6H4L6-3 M-5 1H5'},
  gems:{kind:'luxury',color:'#d4acf0',path:'M-9-3L-5-7H5L9-3L0 8Z M-9-3H9 M-5-7L-3-3L0 8L3-3L5-7'},
  spices:{kind:'luxury',color:'#e29a71',path:'M-6-4Q9-8 6 2Q1 9-8 7Q-1 4-2-1 M-6-4L-4-8L1-9'},
  silk:{kind:'luxury',color:'#e6c0d6',path:'M-8-6Q0-2 8-6V6Q0 2-8 6Z M-4-4V4 M1-3V3'},
  oil:{kind:'strategic',color:'#b1a6df',path:'M0-10Q-10 1-6 6Q0 12 6 6Q10 1 0-10Z M-4 2Q-5 6-1 7'},
  uranium:{kind:'strategic',color:'#b8df72',path:'M0-1L-5-8Q0-11 5-8Z M-1 1L-9 1Q-8 7-3 9Z M1 1L9 1Q8 7 3 9Z'}
};
Object.assign(UNIT_MOTIONS,{slinger:{family:'arrow',cadence:13,bob:1.8,swing:.12},pikeman:{family:'melee',cadence:12,bob:1.8,swing:.09},manatarms:{family:'melee',cadence:13,bob:2,swing:.2},courser:{family:'cavalry',cadence:17,bob:3.2,swing:.1},cuirassier:{family:'cavalry',cadence:15,bob:2.7,swing:.14},cavalry:{family:'cavalry',cadence:17,bob:3,swing:.12},artillery:{family:'shell',cadence:20,bob:.7,swing:.1},battleship:{family:'shell',cadence:6,bob:.6,swing:.045}});
const paths=new Map();
export function drawResource(c,t,p,zoom,name){
  const mark=RESOURCE_MARKS[t.resource];if(!mark)return;
  const radius=Math.max(5,Math.min(10,zoom*5)),x=p.x,y=p.y;
  c.save();c.shadowColor='#102422';c.shadowBlur=4;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fillStyle='#14292bf0';c.fill();c.shadowBlur=0;c.strokeStyle=mark.color;c.lineWidth=mark.kind==='strategic'?2:1.2;c.stroke();
  c.translate(x,y);c.scale(radius/14,radius/14);c.lineWidth=1.7;c.lineCap='round';c.lineJoin='round';if(!paths.has(t.resource))paths.set(t.resource,new Path2D(mark.path));c.stroke(paths.get(t.resource));c.restore();
  if(name&&zoom>1.45){c.font='9px "Microsoft YaHei",sans-serif';c.textAlign='center';c.fillStyle='#122927e8';const width=c.measureText(name).width+8;c.fillRect(x-width/2,y+14,width,13);c.fillStyle=mark.color;c.fillText(name,x,y+24);}
}

Object.assign(UNIT_MOTIONS,{fighter:{family:'bullet',cadence:18,bob:.4,swing:.02},jetfighter:{family:'missile',cadence:18,bob:.4,swing:.02},stealthfighter:{family:'missile',cadence:18,bob:.4,swing:.02},stealthbomber:{family:'bomb',cadence:18,bob:.4,swing:.02},antiair:{family:'bullet',cadence:20,bob:.5,swing:.02},sam:{family:'missile',cadence:20,bob:.5,swing:.02}});

Object.assign(uniqueMotionBases,Object.fromEntries(Object.entries(UNIT_ETCHINGS).map(([key,v])=>[key,v[0]])));
// Register replacements after every base motion profile has been initialized.
for(const [key,base]of Object.entries(uniqueMotionBases))UNIT_MOTIONS[key]={...UNIT_MOTIONS[base]};
for(const key of ['persian_immortal','maryannu_chariot','keshig'])UNIT_MOTIONS[key].family='arrow';
UNIT_MOTIONS.hwacha.family='arrow';
for(const [type,hint]of Object.entries(UNIT_ANIMATION_HINTS))UNIT_MOTIONS[type].family=hint.family;
