// Engraved-medal unit glyphs: [body (filled relief, nonzero; holes use reversed winding), line (thick strokes, optional), detail (fine engraved cuts)].
// Coordinates fit roughly -17..17. Detail strokes are drawn thin and dark over the relief.
const ring=(x,y,r,h=0)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0-${2*r} 0Z`+(h?`M${x-h} ${y}a${h} ${h} 0 1 1 ${2*h} 0a${h} ${h} 0 1 1-${2*h} 0Z`:'');
export const ENGRAVED_INSIGNIA={
 // Mangonel: timber sledge, A-frame, arm with sling cup, counterweight, spoked wheels.
 catapult:[
  'M-16 5H14V8.5H-16Z'+'M-5 5L0-5H3L1 5Z'+'M-2-6.5H6V-4H-2Z'+'M-9 3.5L10-13.5 12.5-11-6.5 6Z'+ring(12.5,-13.5,3.2,1.5)+'M-14-1H-8V4H-14Z'+ring(-10,11.5,4.6,1.1)+ring(8,11.5,4.6,1.1),
  '',
  'M-14 6.8H12M-11-1V-4L-8-1M-10 7.6V15.4M-13.9 11.5H-6.1M8 7.6V15.4M4.1 11.5H11.9M-7 5L-4 2M-1-5.2H5'],
 // Worker: crossed hammer and pick, wrapped grips.
 builder:[
  'M-13.5 13.5L7.5-8 9.5-6-12 15.5Z'+'M-6-16.5Q6-16 15-5L12.5-3.5Q5-12.5-6-13.5Z'+'M13.5 13.5L-6-6-4-8 15.5 11.5Z'+'M-15.5-6.5L-6.5-15.5-1.5-10.5-10.5-1.5Z',
  '',
  'M-11.5 11.5L-9.5 13.5M-10 10L-8 12M11.5 11.5L9.5 13.5M10 10L8 12M-13-6.5L-6.5-13M-8.5-3.5L-3.5-8.5M-2-14.4Q6-13.5 12-5.5'],
 // Settler: covered wagon with hoop canvas and wheel.
 settler:[
  'M-15 3V-4Q-15-14-4-14H5Q15-14 15-4V3Z'+'M-16 3H16V6.5H-16Z'+ring(-9,10.5,5,1.2)+ring(9,10.5,5,1.2)+'M15 4L20 1 20.5 3 16 6Z',
  '',
  'M-8-13.5V3M0-14V3M8-13.5V3M-14-4H14M-9 6.5V15.5M-13.5 10.5H-4.5M9 6.5V15.5M4.5 10.5H13.5'],
 // Scout: spyglass and walking staff over a compass star.
 scout:[
  'M-16-4L8-13 10.5-7-13.5 2Z'+'M8.5-14L13-15.5 15.5-8.5 11-7Z'+'M-14 1L-9 0-8 3-13 4Z'+'M-1 0L1 0 -6 17H-8Z'+'M3 0H5L10 17H8Z',
  '',
  'M-9-6L-7.5-1.5M-3-8L-1.5-3.5M3-10.5L4.5-6M-2 2H6'],
 // Warrior: stone axe crossed with a round hide shield.
 warrior:[
  ring(-6,5,8.5)+'M2 16L9-12 11.5-11.5 4.5 16.5Z'+'M8-16Q16-18 16.5-8Q12.5-6 10.5-9.5Q7-12 8-16Z',
  '',
  ring(-6,5,6.2)+ring(-6,5,2.2)+'M-6-1.5V0.5M-6 9.5V11.5M-12.5 5H-10.5M-1.5 5H0.5M10-15Q14-15 15-10'],
 // Swordsman: gladius with guard, pommel, fuller, over scutum.
 swordsman:[
  'M2-12Q9-14.5 16-11V6Q9 12 2 9Z'+'M-11 12L-3.5-12.5-1.5-17 0-12-7.5 13Z'+'M-13.5 9.5L-4 12.5-4.5 14.5-14 11.5Z'+ring(-11,16,2),
  '',
  'M4-10Q9-12 14-9.5V5Q9 9.5 4 7.5M9-12V9.5M-9.5 11.5L-2-12'],
 // Spearman: leaf-blade spear, socket ring, round shield.
 spearman:[
  'M-14 16L6-10 8.5-7.5-12 18Z'+'M6.5-8.5L5-14Q11-18 17-17Q16-11 11.5-7Z'+ring(-6,-3,8.5,6.3),
  '',
  ring(-6,-3,2.6)+'M6-10L9-7M7-12L14-15.5M-11-3H-9M-3-3H-1'],
 pikeman:[
  'M-10 18L5-14 7.5-13-7.5 19Z'+'M5-14L5.5-18.5 9-19 8-14Z'+'M-16-2L-6-6-1-2V6L-8 12-16 6Z',
  '',
  'M-12-1V6L-8 9-4 6V-1L-8-3.5ZM3-11L7-9'],
 // Archer: recurve bow drawn with arrow and fletching.
 archer:[
  'M-6-17Q-1-16 2-11Q9 0 2 11Q-1 16-6 17L-5 14Q-1 13 0 9Q5 0 0-9Q-1-13-5-14Z'+'M-16-1.2H9V-4L16 0 9 4V1.2H-16Z'+'M-17-4L-12-1.2-17 1.5Z',
  '',
  'M-5.5-15.5L-12 0-5.5 15.5M-14-3L-12-1.2M-14 3L-12 1.2'],
 // Crossbow: stock, prod, trigger, bolt.
 crossbow:[
  'M-2.5 17V-2H2.5V17Z'+'M-16-3Q0-12 16-3L15-0.5Q0-8.5-15-0.5Z'+'M-1.5-16H1.5V-2H-1.5Z'+'M-4-17L0-20 4-17Z'+'M2.5 6H6V9H2.5Z',
  '',
  'M-15-1.5L0 4 15-1.5M0 0V15M-2 10H2'],
 // Horseman: horse head with mane, bridle and eye.
 horseman:[
  'M-11 16L-9 3Q-9-6-3-10L-4-16 1-12Q7-16 12-10L16-2Q17 2 14 4L8 3Q5 3 4 7L9 16Z',
  '',
  'M-3-9Q-7-4-8 4M0-11Q-4-5-5 3M3-11.5Q-1-5-2 2M8-7.5H9.5M5-3L15 1M11-1L9 3'],
 knight:[
  'M-11 16L-9 3Q-9-6-3-10L-4-16 1-12Q7-16 12-10L16-2Q17 2 14 4L8 3Q5 3 4 7L9 16Z'+'M-1-12L1-18H10L12-12Q6-9-1-12Z',
  '',
  'M-3-9Q-7-4-8 4M0-11Q-4-5-5 3M8-7.5H9.5M5-3L15 1M1-14H11M5.5-17.5V-12.5M-8 9L3 11'],
 // Musket: long flintlock with stock, lock and ramrod.
 musket:[
  'M-16 10L-11 16-4 9-6 6 15-13 13-15.5-8.5 3.5Z'+'M-4 5L1 10 5 6 1 2Z'+'M12-12L16-16 17-15 13-11Z',
  '',
  'M-6.5 7.5L13-12.5M-13 11L-9 14M-1 6L2 8.5M-12.5 13.5L-10 11'],
 rifleman:[
  'M-16 11L-11 16-5 9-6 6 14-12 12-15-9 4Z'+'M-2 4L2 10 5 7 2 1Z'+'M7-13L10-17 12-15 9-11Z',
  'M-7 5L-3 1',
  'M-7 6.5L12-12M-13 12L-10 15'],
 // Cannon: banded barrel on a spoked carriage wheel and trail.
 cannon:[
  'M-16-3L11-13 15-4-11 5Z'+ring(15,-8.5,2.3)+'M-2 4L14 11 12.5 14.5-3 8Z'+ring(-7,10,7,1.6),
  '',
  'M-9-6L-6 2M-2-8L1 0M5-10.5L8-2.5M-7 3.5V16.5M-13.5 10H-0.5M-11.6 5.4L-2.4 14.6M-11.6 14.6L-2.4 5.4'],
 bombard:[
  'M-15-3L5-15 15-4-6 10Z'+'M7-10L10-6 8-4 5-8Z'+'M-14 11H15V16H-14Z',
  '',
  'M-9-5L1 5M-4-9L6 1M-12 13.5H13'],
 // Trebuchet: timber tower, long beam, counterweight box, sling.
 trebuchet:[
  'M-16 12H16V15.5H-16Z'+'M-12 12L-2-8H2L12 12H8L0-3-8 12Z'+'M-16-15L15-6 14-3-17-12Z'+'M-16-11H-8V-3H-16Z',
  'M14-5Q16 2 12 6',
  'M-14-9H-10M-14-6H-10M-6 10L6 10M-1-6V12M-12 14H12'],
 // Galley: oared hull, ram, square sail with stitching.
 galley:[
  'M-17 5H17L11 13H-11Z'+'M-1.2 5V-17H1.2V5Z'+'M-11-14H11Q12-4 11 2H-11Q-12-4-11-14Z'+'M17 5L21 8 15 9Z',
  '',
  'M-11-9H11M-11-4H11M-11 1H11M-14 8L-17 15M-8 9L-11 16M-2 9L-5 16M4 9L1 16M10 8L7 15M-14 7H14'],
 frigate:[
  'M-18 5H18L11 14H-11Z'+'M-9 3V-11Q-3-5-9 3ZM-9 3'+'M-1 3V-17Q8-8-1 3Z'+'M9 3V-11Q15-5 9 3Z'+'M-1.5 3V-17H0V3ZM8.5 3V-11H10V3ZM-9.5 3V-11H-8V3Z',
  '',
  'M-15 8H15M-12 10.5H12M-8 8V10.5M-3 8V10.5M2 8V10.5M7 8V10.5M-1-12Q3-8-1-4M9-8Q11-5 9-2'],
 destroyer:[
  'M-18 6H18L10 16H-10Z'+'M-9 4V-4H7V4Z'+'M-3-5V-15H1V-5Z'+'M7-3L17-8 18-4 9 0Z',
  '',
  'M-14 10H14M-6 0H4M-6-2.5H4M-8 13H8'],
 // Tank: hull, turret, gun, road wheels in track.
 tank:[
  'M-15 4H15L18 9 14 16H-14L-18 9Z'+'M-11 3V-4L-6-8H6L10 3Z'+'M6-6H18V-3H7Z',
  '',
  ring(-11,10,2.4)+ring(-4,10,2.4)+ring(3,10,2.4)+ring(10,10,2.4)+'M-14 6H14M-6-4H5M-8 0H8'],
 // Missionary: Latin cross with rays and a closed book.
 missionary:[
  'M-6 17V-5H-12V-10H-6V-17H0V-10H6V-5H0V17Z'+'M4 4L15 2V14L4 16Z',
  '',
  'M-3-14V14M-10-7.5H4M6 6L13 4.8M6 9L13 7.8M6 12L13 10.8'],
 bomber:[
  'M-3-17H3L5-3 17 2V8L4 5V11H9V16H-9V11H-4V5L-17 8V2L-5-3Z',
  '',
  'M0-15V14M-14 4L-5 1M14 4L5 1M-7 13.5H7'],
};

// ---- shared engraved fragments ----
const HH='M-11 16L-9 3Q-9-6-3-10L-4-16 1-12Q7-16 12-10L16-2Q17 2 14 4L8 3Q5 3 4 7L9 16Z',HD='M-3-9Q-7-4-8 4M0-11Q-4-5-5 3M8-7.5H9.5M5-3L15 1';
const W=(x,y,r)=>ring(x,y,r,r*.28),SP=(x,y,r)=>`M${x} ${y-r*.9}V${y+r*.9}M${x-r*.9} ${y}H${x+r*.9}M${x-r*.64} ${y-r*.64}L${x+r*.64} ${y+r*.64}M${x-r*.64} ${y+r*.64}L${x+r*.64} ${y-r*.64}`;
const GUN='M-16 11L-11 16-5 9-6 6 14-12 12-15-9 4Z',GUND='M-7 6.5L12-12M-13 12L-10 15';
const HULL='M-17 5H17L11 13H-11Z',HULLD='M-14 8H14M-11 10.5H11';
const PLANE='M-1.6-17H1.6L3.5-4 17 2V6L3.5 4 2.5 11 8 14V16H-8V14L-2.5 11-3.5 4-17 6V2L-3.5-4Z',PLANED='M0-15V14M-14 4L-4 1.5M14 4L4 1.5';
const ELE='M-16 4Q-16-9-4-10Q6-11 9-6Q13-8 15-3L16 8 13.5 8Q13 2 11 0L9 6V15H5V8H-5V15H-9V8Q-14 8-16 4Z',ELED='M10-3Q12 2 14 3M-12-2Q-4-6 4-4M7-4.5H8.5';
const CHAR=W(-4,9,7.5)+'M-10-3H6V2.5H-10Z'+'M5-1L17-4 17.5-1.5 5.5 2Z',CHARD=SP(-4,9,7.5)+'M-9-1H5';
const TRACK='M-15 5H15L18 10 14 16H-14L-18 10Z',TRACKD=ring(-11,10.5,2.2)+ring(-4,10.5,2.2)+ring(3,10.5,2.2)+ring(10,10.5,2.2)+'M-14 7H14';
const SHIELDR=(x,y,r)=>ring(x,y,r),HELM='M-5-17Q0-20 5-17L6-10H-6Z';
const CROSS='M-2-17H2V-11H8V-7H2V17H-2V-7H-8V-11H-2Z';
Object.assign(ENGRAVED_INSIGNIA,{
 // ---- batch 1: ancient/medieval infantry & ranged ----
 slinger:['M-14-14Q-16 0-2 6Q12 0 9-14L11-14Q15 4-1 9L3 16 0 17.5-4 10Q-19 2-16-14Z'+ring(-2,-2,4.5),'','M-13-12Q-12-2-2 3.5M-2-5V1M-5-2H1'],
 manatarms:['M-6-17Q0-20 6-17L7-7Q0-4-7-7Z'+'M-12-3H12L10 14H-10Z'+'M10-16L13-17 6 6 3 5Z','','M-6-11H6M0-17V-5M-9 0H9M-9 4H9M-9 8H9M-3-3V14M3-3V14'],
 skirmisher:['M-12 15L-6 1-10-3-8-5-2 0 9-15 12-14 2 4 6 8 4 10-1 6-8 17Z'+'M5 2Q14-2 15 8Q11 14 4 12Z','','M-3 4L8-11M7 4Q12 3 13 8M-10 13L-7 9'],
 ranger:[GUN+'M6-17Q14-17 15-10H4Q4-15 6-17Z'+'M3-10H16V-8H3Z','',GUND+'M6-13H13'],
 specops:[GUN+ring(9,9,6.5,4.5)+'M7-17H11V-13H7Z','',GUND+'M5 9H13M9 5V13'],
 pikeandshot:['M-15 16L10-14 12-12.5-13 17.5Z'+'M10-14L12-19 15-16Z'+'M15 16L-10-14-12-12.5 13 17.5Z'+'M-10-14L-12-19-15-16Z','','M-6 5.5L-3 8.5M6 5.5L3 8.5'],
 machinegun:['M-17-2H8V-5H15V4H8V2H-17Z'+'M-7 1L-13 15H-9L-4 4Z'+'M-2 1L4 15H8L1 3Z'+'M-6-9H3V-3H-6Z'+ring(-1,4,2.5),'','M-15 0H6M-4-6H1M9-1.5H14'],
 atcrew:['M-16-2L13-9 14-5-15 2Z'+W(-3,9,6.5)+'M-14 6L-3 2-1 5-12 9Z','',SP(-3,9,6.5)+'M-12-1L10-6.5'],
 modernat:['M-16 2L10-6 11-3-15 5Z'+'M10-8L17-10 17-1 10-3Z'+'M-6 4L-8 12H-5L-3 5Z'+'M-12 8H-2V11H-12Z','','M-13 3L8-4M12-7.5V-2.5'],
 infantry:[GUN+'M-2-17Q5-20 10-15L9-11H-1Z','',GUND+'M0-13H8M2-15.5Q5-16.5 8-14'],
 // ---- batch 2: cavalry ----
 courser:[HH+'M-14-6L-6-2-6 0-15-4Z','',HD+'M-13-4.5L-7-1.5M1-12L-1-16'],
 cuirassier:[HH+'M-12 3Q-12-4-6-6L-3 0-6 6-11 7Z','',HD+'M-10 1L-5-1M-9 4L-5 3'],
 cavalry:[HH+'M-17-14L-15-16 2 1 0 3Z','',HD+'M-16-15L1 2'],
 heavychariot:[CHAR+'M-8-4L-6-13H4L5-4Z','',CHARD+'M-6-9H4'],
 // ---- batch 3: siege & engineers ----
 batteringram:['M-16 8V-1L0-12 16-1V8Z'+'M-18 1H14L18 3.5 14 6H-18Z'+W(-10,12,4)+W(10,12,4),'','M-12 0L0-9 12 0M-16 3.5H14M-8-4V8M0-9V8M8-4V8'],
 siegetower:['M-9 16V-12L-6-17H6L9-12V16Z'+W(-9,14,3.5)+W(9,14,3.5)+'M9-12L17-6 15-4 9-8Z','','M-9-6H9M-9 2H9M-9 9H9M-3-13V16M3-13V16M-5-15H5'],
 militaryengineer:['M-14 14L-1 1 1 3-12 16Z'+'M-4 2L2-12 8-13 6-6 2 4Z'+'M1 16V5H16V16Z','','M-12 12L-10 14M3-11L5-8M3 9H14M3 12.5H14M8.5 5V16'],
 artillery:['M-16-1L11-10 14-4-13 4Z'+W(-4,9,7)+'M-12 4L-4 1-2 4-16 14Z','',SP(-4,9,7)+'M-8-5L-6 0M2-7.5L4-2.5'],
 rocketartillery:[TRACK+'M-12 4V-2L12-13 15-9-4 4Z','',TRACKD+'M-10 0L13-11M-8 2L14-8'],
 // ---- batch 4: armour, AA ----
 modernarmor:[TRACK+'M-11 4V-3L-5-7H7L11 4Z'+'M7-5H19V-2H8Z','',TRACKD+'M-5-3H7M-8 1H9M-2-7V-3'],
 mechanized:[TRACK+'M-14 4V-6H8L13 4Z'+'M2-9H12V-7H2Z','',TRACKD+'M-11-3H-5V1H-11ZM-2-3H4V1H-2Z'],
 antiair:[TRACK+'M-6 4V-1H6V4Z'+'M-3-1L8-16 10-14.5 0 0Z'+'M2-1L13-16 15-14.5 5 0Z','',TRACKD],
 sam:[TRACK+'M-12 4L-2-6H2L-6 4Z'+'M-6-4L4-17 7-15-2-2Z'+'M0 4L10-9 13-7 4 4Z','',TRACKD+'M3-15L1-12M11-8L9-5'],
 // ---- batch 5: navy ----
 quadrireme:[HULL+'M-1 5V-17H1V5Z'+'M-10-14H10V0H-10Z'+'M17 6L22 8 15 10Z','',HULLD+'M-10-9H10M-10-4.5H10M-13 9L-16 16M-9 9L-12 16M-5 9L-8 16M-1 9L-4 16M3 9L0 16M7 9L4 16'],
 caravel:[HULL+'M-14 5L-10-1H-6L-7 5Z'+'M-1 5V-17Q11-8-1 4Z'+'M8 5V-10Q15-3 8 4Z'+'M-11 4V-12Q-18-4-11 4Z','',HULLD+'M0-14Q5-9 0-4M-12-9Q-15-5-12-1'],
 privateer:[HULL+'M-6 5V-14Q4-8-6 4Z'+'M3 5V-17Q14-8 3 4Z'+'M3-17L10-15 3-13Z','',HULLD+'M-5-10Q-1-7-5-3M4-13Q9-8 4-3'],
 ironclad:['M-18 5H18L13 14H-13Z'+'M-8 5V-3H8V5Z'+'M-2-3V-15H3V-3Z','','M-15 8H15M-12 11H12M-6 0H6M-6 2.5H6M-1-12H2M-1-9H2M-10 8V11M-4 8V11M2 8V11M8 8V11'],
 battleship:['M-18 4H18L11 13H-11Z'+'M-10 4V-3H10V4Z'+'M-3-3V-12H3V-3Z'+'M-1-12V-17H1V-12Z'+'M8-1L17-5 18-2 10 1Z'+'M-8-1L-17-5-18-2-10 1Z','','M-15 7H15M-12 10H12M-7 0H7M-2-9H2M-2-6H2'],
 missilecruiser:['M-18 5H18L11 14H-11Z'+'M-9 5V-3H5V5Z'+'M-2-3V-13H2V-3Z'+'M8 3L11-9 13-8 11 3Z','','M-15 8H15M-12 11H12M-7 0H3M-7 2.5H3M11-6L12-3'],
 assaultship:['M-18 3H18L12 13H-12Z'+'M-17 3H17V-1H-17Z'+'M8-1V-11H13V-1Z','','M-15 6.5H15M-12 9.5H12M-14 1H6M9-8H12M9-5H12'],
 submarine:['M-16 4Q-16-2 0-2H8Q16-2 16 4Q16 10 0 10H-8Q-16 10-16 4Z'+'M-4-2V-9H4V-2Z'+'M0-9V-16H1.5V-9Z','','M-12 4H12M-8 7H8M-2-6H2'],
 nuclearsubmarine:['M-17 4Q-17-3 0-3H9Q17-3 17 4Q17 11 0 11H-9Q-17 11-17 4Z'+'M-6-3V-11H5L3-3Z'+'M-11 0L-16-6-14-7-9-1Z','','M-13 4H13M-9 7.5H9M-4-7H3'+ring(9,4,2)],
 aircraftcarrier:['M-18 3H18L13 13H-13Z'+'M-17 3H18V0H-17Z'+'M7 0V-9H12V0Z'+'M-12-3L-6-4-6-2-12-1.5Z','','M-15 6.5H15M-12 9.5H12M-14 1.5H5M-10-2.7H-6M8-6H11'],
 athenian_trireme:[HULL+'M-1 5V-17H1V5Z'+'M-10-14H10V0H-10Z'+'M17 5L22 7 17 8Z'+ring(-12,3,1.5),'',HULLD+'M-10-7H10M0-14L-10 0M0-14L10 0M-13 9L-16 15M-8 9L-11 15M-3 9L-6 15M2 9L-1 15M7 9L4 15'],
 ptolemaic_flagship:['M-18 4H18L12 13H-12Z'+'M-18 4L-21-4-17-3-15 4Z'+'M18 4L21-4 17-3 15 4Z'+'M-7 4V-17Q6-8-7 3Z'+'M3 4V-14Q13-6 3 3Z','','M-15 7H15M-12 10H12M-6-13Q-2-8-6-3M4-10Q8-6 4-2'],
 punt_expedition_ship:['M-18 2Q-12 9 0 9Q12 9 18 2L15 0Q8 5 0 5Q-8 5-15 0Z'+'M-1 5V-16H1V5Z'+'M-12-14H12L10-12H-10ZM-12-2H12L10 0H-10Z'+'M-10-12H10V-2H-10Z','','M-10-7H10M-12 4Q0 9 12 4M-5-12V-2M5-12V-2'],
 sea_dog:[HULL+'M-6 5V-14Q4-8-6 4Z'+'M3 5V-17Q14-8 3 4Z'+ring(-11,-12,4),'',HULLD+'M-13-12H-9M-11-14V-10M4-13Q9-8 4-3'],
 // ---- batch 6: air ----
 fighter:[PLANE+ring(0,-17,2.5),'',PLANED+'M-2.5-17H2.5'],
 jetfighter:['M0-18L4-4 16 6V9L4 6 3 12 7 15V17H-7V15L-3 12-4 6-16 9V6L-4-4Z','','M0-16V15M-13 7L-4 3M13 7L4 3'],
 stealthfighter:['M0-18L17 10 9 10 5 15H-5L-9 10H-17Z','','M0-15V14M-12 8L0-10 12 8M-5 13H5'],
 stealthbomber:['M0-10L18 5 13 9 8 6 4 10 0 7-4 10-8 6-13 9-18 5Z','','M0-8V6M-14 5L0-6 14 5'],
 drone:['M-3-5H3V5H-3Z'+'M-12-11L-9-12 12 9 9 12ZM12-11L9-12-12 9-9 12Z'+ring(-11,-11,4.5,2.6)+ring(11,-11,4.5,2.6)+ring(-11,11,4.5,2.6)+ring(11,11,4.5,2.6),'','M-2-3H2M0 2V4'],
 observationdrone:['M-16 0Q-8-5 0-5H6Q14-4 16 0Q14 4 6 5H0Q-8 5-16 0Z'+'M-15-1L-18-9-14-8-11-1Z'+ring(4,8,2.5),'','M-10 0H12M5-3V3'],
 helicopter:['M-10 2Q-10-6 0-6H4Q10-6 10 2Q10 8 2 8H-4Q-10 8-10 2Z'+'M-16-11H16V-9H-16Z'+'M-1-9V-6H1V-9Z'+'M-10 0L-18-3-18 1-10 4Z'+'M-6 10H8V12H-6Z','','M1-3Q7-3 8 3M-17-6V5M-5 8V10M5 8V10'],
 balloon:['M0-18Q13-18 12-5Q11 2 4 6H-4Q-11 2-12-5Q-13-18 0-18Z'+'M-4 11H4L3 17H-3Z','','M0-18V6M-6-16Q-8-6-4 6M6-16Q8-6 4 6M-12-6H12M-4 6L-3 11M4 6L3 11'],
 giantdeathrobot:['M-5-17H5V-10H-5Z'+'M-11-8H11V6H-11Z'+'M-16-7H-12V8H-16ZM12-7H16V8H12Z'+'M-9 7H-3V17H-9ZM3 7H9V17H3Z','','M-3-14H3M-7-4H7M-7 0H7M-7 3H7M0-8V6'],
 // ---- batch 7: support, religious, civilian ----
 herbalist:['M-1 17V-4H1V17Z'+'M0-4Q-14-6-14-16Q-3-17 0-6Z'+'M0 2Q14 0 15-10Q4-12 0 0Z'+'M0 9Q-11 9-12 1Q-3 0 0 7Z','','M-1-6L-11-14M1 0L11-8M-1 7L-9 2'],
 surgeon:['M-14 15L4-3 7 0-11 18Z'+'M4-3L13-14Q17-12 15-9L7 0Z'+'M3-17H9V-11H15V-5H9V1H3V-5H-3V-11H3Z','','M-12 14L5-1M6-14V-2M0-8H12'],
 fieldmedic:['M-15-9H15V15H-15Z'+'M-6-9V-15H6V-9H3V-12H-3V-9Z'+'M-3-6V-1H-8V5H-3V10H3V5H8V-1H3V-6Z','','M-15-5H-10M15-5H10M-13 12H13'],
 ambulance:['M-16 9V-5H4L8-11H14L17-3V9Z'+W(-9,11,4)+W(10,11,4),'','M-11-1H-7M-9-3V1M6-9H13L15-3H6ZM-16 6H17'],
 envoy:['M-14-11H14V9H-14Z'+'M-1 9H1V17H-1Z','','M-14-11L0 0 14-11M-14 9L-4-1M14 9L4-1'+ring(0,0,2.5)],
 apostle:[CROSS+ring(0,-9,7,5.5),'','M0-15V15M-6-9H6'],
 inquisitor:['M-5-17H5L7 4H-7Z'+'M-12 4H12L10 9H-10Z'+'M-1 9H1V17H-1Z'+'M-3 13H3V15H-3Z','','M0-14V2M-3-8H3M-9 6.5H9'],
 guru:[ring(0,-11,4.5)+'M-12 13Q-12 0 0-4Q12 0 12 13Z'+'M-17 13H17V16H-17Z','','M-5-1Q0 4 5-1M-8 8Q0 4 8 8M0-14Q3-11 0-8'],
 warriormonk:[ring(0,-12,4)+'M-7-6H7L9 16H-9Z'+'M-17 4L12-12 13-10-16 6Z','','M0-6V16M-6 2H6M-14 3L11-10'],
 archaeologist:['M-12 15L6-3 8-1-10 17Z'+'M3-6Q10-13 16-11Q11-5 6-1Z'+'M-16-6Q-16-14-8-14Q0-14 0-6H-3V-4H-13V-6Z','','M-11 13L6-2M-14-6H-2M-8-14V-6'],
 naturalist:[ring(-4,-4,9,6.5)+'M2 3L13 14 10.5 16.5-0.5 5.5Z'+'M-4-9Q0-6-4 1Q-8-6-4-9Z','','M-4-9V1M4 6L12 14'],
 rockband:['M-4-17H4V-12H-4Z'+'M-1.5-12H1.5V2H-1.5Z'+'M-10 6Q-12-4-4 0Q0 2 4 0Q12-4 10 6Q11 16 0 16Q-11 16-10 6Z','','M0-12V10M-4 10H4M-3-15H3'+ring(0,7,2.5)],
 great_person:['M-11 15L9-12 11-10-9 17Z'+'M-5 9Q-4-6 13-15Q16 0-5 9Z','','M-3 6Q2-5 11-12M2 2L6 4M5-3L9-1'],
 great_admiral:['M-1.5-15H1.5V12H-1.5Z'+'M-6-13H6V-10H-6Z'+ring(0,-17,2.5,1)+'M-14 2Q-14 15 0 15Q14 15 14 2L11 1Q11 12 0 12Q-11 12-11 1Z'+'M-17 3L-12-1-10 4ZM17 3L12-1 10 4Z','','M-12 6Q-8 12 0 12'],
 // ---- batch 8: unique units (civ identity) ----
 qin_crossbow:['M-2.5 17V-2H2.5V17Z'+'M-16-3Q0-12 16-3L15-0.5Q0-8.5-15-0.5Z'+'M-1.5-16H1.5V-2H-1.5Z'+'M-4-17L0-20 4-17Z'+'M-7 9H7V12H-7Z','','M-15-1.5L0 4 15-1.5M0 0V15M-5 10.5H5M-2 4L2 7'],
 han_cavalry:[HH+'M-17-15L-15-17 1 1-1 3Z'+'M-17-15L-20-17-18-12Z','',HD+'M-16-16L0 2'],
 xuanjia_knight:[HH+'M-10 4Q-10-4-5-7L-2-1-6 6Z'+'M-1-12L1-18H10L12-12Q6-9-1-12Z','',HD+'M-9 1L-5-1M-9 3.5L-5 2M1-14H11M2-16H10'],
 wuju_guard:['M-7-17H7L8-7H-8Z'+'M-12-5H12L10 14H-10Z'+'M13-17L15-18 7 7 5 6Z','','M-6-12H6M-10-1H10M-10 3H10M-10 7H10M-10 11H10M-6-5V14M0-5V14M6-5V14'],
 hwacha:['M-14-6H12V6H-14Z'+W(-9,11,5)+W(7,11,5)+'M12-2L18-4V3L12 1Z','','M-12-3.5H10M-12-1H10M-12 1.5H10M-12 4H10'+SP(-9,11,5)+SP(7,11,5)],
 hatamoto_samurai:['M-9-14Q0-21 9-14L12-10H-12Z'+'M-6-10H6V-4H-6Z'+'M-14 16L8-6 10-4-12 18Z'+'M8-6Q12-12 16-16Q15-10 10-4Z','','M-12-12L-15-17M12-12L15-17M-9-12H9M-12 15L9-5'],
 hetairoi:[HH+'M-18 5L-5-16-3-14-16 7Z','',HD+'M-16 5L-4-14M2-12L0-16'],
 roman_legion:['M-1-12Q8-14 16-10V7Q8 13-1 9Z'+'M-12 16L-4-12-2-16 0-12-8 17Z'+'M-14 10L-5 12-5.5 14-14.5 12Z','','M2-10Q8-12 14-9V5Q8 9.5 2 7.5M8-12V9.5M3-1H14'+ring(8,-1,2.2)],
 praetorian_guard:['M-6-16Q0-19 6-16L7-8H-7Z'+'M-1-21Q4-22 8-18L6-16Q2-19-2-18Z'+'M-11-6H11V16H-11Z','','M-6-11H6M0-6V16M-11 5H11'+ring(0,5,3)+'M-7-1L-3-4M7-1L3-4'],
 persian_immortal:['M-14 17L5-9 3-10 12-17 10-7 7-8-12 19Z'+'M-16-8Q-10-14-3-8V6Q-9 12-16 6Z','','M-14-6Q-9-10-5-6V5Q-9 9-14 5M-14-2H-5M-14 2H-5'],
 scythed_chariot:[CHAR+'M-12 9L-19 6-12 7Z'+'M4 9L11 12 4 11Z','',CHARD],
 maryannu_chariot:[CHAR+'M-8-3Q-10-14-2-16Q8-16 6-3Z','',CHARD+'M-6-12Q-2-17 4-12'],
 dharma_elephant:[ELE+'M-7-10L-6-18H3L4-10Z','',ELED+'M-6-14H3M-1-18V-10'],
 maurya_war_elephant:[ELE+'M-9-10Q-9-17-1-17Q7-17 5-10Z','',ELED+'M-5-14H3M14 3L18 6'],
 mamluk_knight:[HH+'M-1-12Q4-20 11-12Q6-9-1-12Z'+'M-17-12Q-12-18-5-14L-6-12Q-11-15-15-10Z','',HD+'M5-16V-13'],
 janissary:['M-5-17Q0-22 5-17L6-11H-6Z'+'M-1-17L-9-20-11-10-6-11Z'+GUN.replace('M-16 11','M-16 13'),'',GUND+'M-4-14H4'],
 keshig:[HH+'M-16-12Q-19-2-13 6L-11 4Q-16-2-14-11Z'+'M-17-8H-9V-6.5H-17Z','',HD+'M-15-12Q-18-2-12 5'],
 mandekalu_cavalry:[HH+'M-14 8Q-16 0-11-3L-8 3-9 9Z','',HD+'M-12 2L-9 1M-12 5L-9 4'],
 zulu_impi:['M-8-15Q2-16 4-6Q6 6-2 15Q-10 10-10 0Q-11-10-8-15Z'+'M-12 16L12-14 14-12-10 18Z'+'M12-14L15-19 17-16Z','','M-5-13Q-1-2-3 13M-7-6H0M-7 4H0'],
 cossack:[HH+'M-15-16L-13-17 3 3 1 4Z'+'M-11-2Q-13-8-8-9L-6-3Z','',HD+'M-14-16Q-6-8 2 3'],
 warakaq:['M-14-14Q-16 0-2 6Q12 0 9-14L11-14Q15 4-1 9L3 16 0 17.5-4 10Q-19 2-16-14Z'+ring(-2,-2,4.5)+'M-17 13H-9L-13 17Z','','M-13-12Q-12-2-2 3.5M-2-5V1M-5-2H1M-14 14H-11'],
});
// ---- v4: revisions matched to in-game unit art (web/assets) ----
const HORSE_F='M4 16L5 6Q2 4 2 0Q3-5 8-6L10-11 12-8Q16-7 17-3L18 1 15 2 13 0 12 4 13 16H11L10 6H7L6 16Z';// small horse, facing right
Object.assign(ENGRAVED_INSIGNIA,{
 // batch A: base units whose art diverged
 warrior:[ring(-5,4,9)+'M3 12L14-6 15.5-5 5 13.5Z'+'M2 12H7V14H2Z'+'M6-17Q12-19 14-13L12-12Q10-15 6-15Z','',ring(-5,4,6.6)+ring(-5,4,2.2)+'M-5-3V-1M-5 9V11M5 11.5L14.5-5'],
 settler:[ring(1,-13,3.5)+'M-4-8H6L7 6H-5Z'+'M-5 6H-1L-2 17H-5ZM3 6H7L7 17H4Z'+'M-13-9Q-13-13-8-13H-4V-3H-8Q-13-3-13-7Z'+'M11-14H13V17H11Z','','M-12-8H-5M-12-6H-5M-3-2H6M12-14V-17'],
 scout:['M-6-17Q2-20 6-13L7-5Q2-1-5-4Z'+'M-8-6Q-12 4-10 16H8Q10 6 6-6Z'+'M6 2L15-5 16-3 7 4Z','','M-3-11Q0-14 3-11M-6 0Q0 3 6 0M-4 16V6M4 16V6M8 3L15-4'],
 catapult:['M16 5H-14V8.5H16Z'+'M5 5L0-5H-3L-1 5Z'+'M2-6.5H-6V-4H2Z'+'M9 3.5L-10-13.5-12.5-11 6.5 6Z'+ring(-12.5,-13.5,3.4)+'M14-1H8V4H14Z'+ring(10,11.5,4.6,1.1)+ring(-8,11.5,4.6,1.1),'','M14 6.8H-12M10 7.6V15.4M6.1 11.5H13.9M-8 7.6V15.4M-11.9 11.5H-4.1M7 5L4 2M1-5.2H-5M-14-15Q-12-17-10-15'],
 manatarms:['M-12-14Q-6-20 0-14L1-11H-13Z'+'M-11-11H-1V-6H-11Z'+'M-1-4H15V4Q15 13 7 17Q-1 13-1 4Z'+'M-14 16L-2-6 0-5-12 17Z','','M-14-11H2M-8-9H-4M7-4V16M1 1H13M4-1L10 5M10-1L4 5'],
 machinegun:['M-16-4H8V-7H14V0H8V-2H-16Z'+'M-6-2L-14 10H-11L-4 0Z'+ring(-2,8,6,1.5)+'M-6-10H2V-5H-6Z','','M-14-3H6M-4-8H0M-2 2.5V13.5M-7.5 8H3.5'],
 drone:['M0-6L18 4 15 6 6 3 4 7H-4L-6 3-15 6-18 4Z','','M-14 4L0-3 14 4M-3 5H3'],
 observationdrone:['M-3-5H3V5H-3Z'+'M-12-11L-9-12 12 9 9 12ZM12-11L9-12-12 9-9 12Z'+ring(-11,-11,4.5,2.6)+ring(11,-11,4.5,2.6)+ring(-11,11,4.5,2.6)+ring(11,11,4.5,2.6)+'M-4 7H4V12H-4Z','','M-2-3H2M-4 9.5H4'],
 mechanized:['M-16 6L-13-2H8L15 2 17 6Z'+'M-5-2V-6H4V-2Z'+'M2-5H14V-3.5H2Z'+W(-12,10,3.4)+W(-4,10,3.4)+W(4,10,3.4)+W(12,10,3.4),'','M-13 2H14M-10-1H-6M-2-1H2'],
 ironclad:['M-18 5H18L13 14H-13Z'+'M-6 5V-3H8V5Z'+'M-1-3V-15H3V-3Z'+'M3-15L12-14 3-11Z'+ring(-10,4,6,2),'','M-15 8H15M-12 11H12M-10-1V9M-15 4H-5M-13.5 0L-6.5 8M-13.5 8L-6.5 0'],
 heavychariot:[W(-9,10,6.5)+'M-14-2H-2V3H-14Z'+'M-9-2V-12H-6V-2Z'+'M-3 1L4 0'+HORSE_F,'',SP(-9,10,6.5)+'M-13 0H-3M-2 1L4 1M13-5H14'],
 maryannu_chariot:[W(-9,10,6.5)+'M-14-2H-2V3H-14Z'+'M-13-2Q-14-12-8-14Q-4-14-4-2Z'+'M-3 0H5V2H-3Z'+HORSE_F,'',SP(-9,10,6.5)+'M-12-10Q-9-12-6-10M13-5H14'],
 scythed_chariot:[W(-9,10,6.5)+'M-14-2H-2V3H-14Z'+'M-3 0H5V2H-3Z'+'M-15 10L-20 7-15 8.5Z'+HORSE_F+'M-11-2L-10-12H-6L-5-2Z','',SP(-9,10,6.5)+'M13-5H14'],
 envoy:['M-12-10H12V-6H-12Z'+'M-10-6H10V12H-10Z'+'M-12 12H12V16H-12Z'+ring(4,6,3.5),'','M-7-2H7M-7 1H7M-7 4H0M-12-8H12M-12 14H12'],
 naturalist:[ring(6,-8,8,6.2)+'M-1 -3L1-2-11 17-13 16Z'+'M-15 2H-3V12H-15Z','','M-9 2V12M-14 5H-10M-14 8H-10M1-13L11-3M1-3L11-13'],
 // batch B: unique units
 hatamoto_samurai:['M-6-11Q0-17 6-11L8-8H-8Z'+'M-6-8H6V-3H-6Z'+'M-13 15L5-5 7-3-11 17Z'+'M10-18H12V12H10Z'+'M12-18H18V-6H12Z','','M-8-10L-11-15M8-10L11-15M-11 14L6-4'+ring(15,-12,2.2)],
 wuju_guard:['M-12-13Q-6-19 0-13L1-9H-13Z'+'M-7-19Q-3-22 1-18L-1-16Q-4-19-7-17Z'+'M-11-9H-1V-4H-11Z'+'M1-6H14V15H1Z'+'M-14 16L-2-6 0-5-12 17Z','','M-12-11H0M3-3H12V13H3ZM7.5-6V15M1 4.5H14'],
 praetorian_guard:['M-12-11Q-6-17 0-11L1-7H-13Z'+'M-12-14Q-6-21 1-15L-1-13Q-6-18-11-12Z'+'M-11-7H-1V-2H-11Z'+'M1-10Q16-10 16 3Q16 16 1 16Q-1 3 1-10Z'+'M-14 16L-3-4-1-3-12 17Z','',ring(8,3,2.8)+'M8-8V-1M8 7V14M-12-9H0'],
 sea_dog:[HULL+'M-6 5V-14Q4-8-6 4Z'+'M3 5V-17Q14-8 3 4Z'+'M3-17H11V-12H3Z','',HULLD+'M7-17V-12M3-14.5H11M4-10Q9-6 4-2'],
 ptolemaic_flagship:[HULL+'M-1 5V-17H1V5Z'+'M-12-15H12Q13-5 12 1H-12Q-13-5-12-15Z'+'M17 5L21-2 19 6Z'+'M-17 5L-21-2-19 6Z','',HULLD+'M-8-8Q0-12 8-8M-3-8H3M-14 8L-17 15M-8 9L-11 16M-2 9L-5 16M4 9L1 16M10 8L7 15'],
 zulu_impi:['M2-17Q15-10 14 2Q13 14 3 17Q-6 10-6 0Q-5-12 2-17Z'+'M-16 14L4-8 5.5-6.5-14 15.5Z'+'M4-8L7-12 8-7Z','','M4-14V14M0-6H8M0 4H8M-1-1H2M7 9H10'],
});
Object.assign(ENGRAVED_INSIGNIA,{envoy:['M-9-8H9V7H-9Z'+'M-14-12Q-12-14-10-12V12Q-12 14-14 12Z'+'M10-12Q12-14 14-12V12Q12 14 10 12Z'+ring(0,11,3.5)+'M-1 13L-3 18 0 16 3 18 1 13Z','','M-6-4H6M-6-1H6M-6 2H3M-12-11V11M12-11V11']});
// v5: settler as a planted banner (Civ-style founding flag)
Object.assign(ENGRAVED_INSIGNIA,{settler:['M-9-16H-6V14H-9Z'+ring(-7.5,-17,2.2)+'M-6-14Q2-17 8-13Q12-11 16-12L13-6 16 0Q11 1 7-1Q1-4-6-1Z'+'M-15 13Q-7.5 9 0 13V16H-15Z','','M-6-9Q2-12 8-8.5Q11-7 14-7.5M-6-5Q1-8 7-5M-7.5-13V12M-12 14.5H-3']});
