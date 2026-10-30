import {UNITS,VETERAN_TRAITS,veteranCapacity,veteranChoices,VETERAN_TRAINING_SECONDS} from '/rules.mjs';
export function veteranMarkup(unit,tile,control,inactive){
 if(UNITS[unit.type].civilian||unit.owner<0)return '';
 const learned=unit.veteranTraits||[],capacity=veteranCapacity(unit),available=veteranChoices(unit),home=tile.owner===unit.owner&&!unit.embarked&&(UNITS[unit.type].domain!=='air'||tile.district?.item==='airport'&&!tile.pillaged);
 const badge=key=>`<img src="/assets/veterans/${key}.webp" width="32" height="32" loading="lazy" decoding="async" alt="">`;
 return `<section class="veteran-training"><h3>老兵专长 <small>${learned.length} / ${capacity}</small></h3>${learned.map(key=>`<p class="veteran-earned">${badge(key)}<span><strong>${VETERAN_TRAITS[key].name}</strong><small>${VETERAN_TRAITS[key].description}</small></span></p>`).join('')}${control&&available.length?`<p class="inspector-note">本国领土训练 ${VETERAN_TRAINING_SECONDS} 秒，占用行动时间。${home?'选择一项永久专长。':'返回本国领土后可训练。'}</p><div class="veteran-choices">${available.map(key=>`<button data-veteran="${key}" ${inactive||!home?'disabled':''} title="${VETERAN_TRAITS[key].description}">${badge(key)}<span>${VETERAN_TRAITS[key].name}</span></button>`).join('')}</div>`:!capacity?'<p class="inspector-note">晋升至 1、3、5 级各解锁一个专长名额，最多 3 项。</p>':''}</section>`;
}
