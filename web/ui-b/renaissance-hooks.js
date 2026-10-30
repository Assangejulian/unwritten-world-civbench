// Renaissance theme hooks: tag shared panels with a semantic hue family so CSS can colour them.
// Pure presentation. Reads only visible DOM text/attributes; never touches game state, routes or actions.
const KICKER = {
  'THE PURSUIT OF KNOWLEDGE': 'science',
  'THE SHAPE OF SOCIETY': 'civics', 'AN AGE DEDICATED': 'civics', 'MAGISTRATUS IMPERII': 'civics',
  'THE GOLDEN ROAD': 'cities',
  'FIELD MISSION': 'military',
  'PACTA ET LEGATIONES': 'diplomacy', 'THE COUNCIL': 'diplomacy', 'THE WORLD COUNCIL': 'diplomacy', 'ORBIS ET HOMINES': 'diplomacy',
  'FIDE ET HISTORIA': 'faith', 'RELIGIOUS MISSION': 'faith',
  'MONUMENTA MUNDI': 'heritage', 'VITAE ILLUSTRIUM': 'heritage', 'AN AGE REMEMBERED': 'heritage',
  'THE ARCHIVE OF HISTORY': 'archive', 'THE FIRST HORIZON': 'archive', 'SOUNDS OF CIVILIZATIONS': 'archive',
  'EIGHT MINDS. ONE WORLD.': 'archive', 'A WORLD WAITING TO BE WRITTEN': 'archive'
};
// Fallback on the visible Chinese title when a dialog reuses a stale kicker.
const TITLE = [[/科技/, 'science'], [/市政|政体|总督|时代/, 'civics'], [/生产|城市|商路/, 'cities'],
  [/领袖|外交|大会|诸国|城邦/, 'diplomacy'], [/军|战/, 'military'], [/宗教|信仰|万神/, 'faith'],
  [/奇观|伟人|遗产|胜利/, 'heritage'], [/存档|声音|音乐|说明|玩家/, 'archive']];

function classify(modal) {
  if (modal.hasAttribute('data-workshop')) return 'cities';
  const kicker = (document.getElementById('modal-kicker')?.textContent || '').trim().toUpperCase();
  if (KICKER[kicker]) return KICKER[kicker];
  const title = document.getElementById('modal-title')?.textContent || '';
  for (const [re, hue] of TITLE) if (re.test(title)) return hue;
  return 'archive';
}

function tag(modal) {
  const hue = classify(modal);
  if (modal.dataset.rnPanel !== hue) modal.dataset.rnPanel = hue;
}

function start() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  tag(modal);
  // Observe only the dialog header text and the dialog's own attributes (cheap, no map involvement).
  const header = modal.querySelector('.modal-shell > header');
  const observer = new MutationObserver(() => tag(modal));
  if (header) observer.observe(header, {subtree: true, childList: true, characterData: true});
  observer.observe(modal, {attributes: true, attributeFilter: ['open', 'data-workshop']});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
else start();
