// Historical identities are independent of the eight mechanical driver slots.
const entries = [
  ['qin','秦朝','秦','咸阳','china',['邯郸','临淄','会稽','上郡','南海','九原']],
  ['han-wudi','西汉','汉','长安','china',['洛阳','成都','长沙','朔方','敦煌','武威']],
  ['taizong','唐朝','唐','长安','china',['洛阳','扬州','成都','太原','广州','安西']],
  ['wu-zetian','武周','周','洛阳','china',['长安','并州','扬州','成都','荆州','广州']],
  ['sejong','朝鲜王朝','朝鲜','汉城','korea',['开城','平壤','全州','庆州','咸兴','公州']],
  ['tokugawa','德川幕府','德川','江户','japan',['京都','大阪','名古屋','骏府','仙台','金泽']],
  ['alexander','马其顿王国','马其顿','佩拉','classical',['埃盖','安菲波利斯','亚历山大里亚','巴比伦','苏萨','巴克特拉']],
  ['caesar','罗马共和国','罗马','罗马','classical',['卡普阿','奥斯提亚','塔伦图姆','马西利亚','科尔杜巴','阿莱西亚']],
  ['augustus','罗马帝国','罗马','罗马','classical',['拉文纳','阿奎莱亚','安条克','卢格杜努姆','塔拉科','亚历山大里亚']],
  ['pericles','雅典','雅典','雅典','classical',['比雷埃夫斯','埃琉西斯','马拉松','苏尼翁','萨拉米斯','德洛斯']],
  ['cyrus','阿契美尼德帝国','波斯','帕萨尔加德','persia',['苏萨','巴比伦','埃克巴坦那','萨第斯','波斯波利斯','巴克特拉']],
  ['darius','阿契美尼德帝国','波斯','苏萨','persia',['波斯波利斯','帕萨尔加德','巴比伦','埃克巴坦那','萨第斯','孟菲斯']],
  ['cleopatra','托勒密王国','托勒密','亚历山大里亚','egypt',['孟菲斯','底比斯','瑙克拉提斯','珀卢西翁','赫尔摩波利斯','阿斯旺']],
  ['hatshepsut','埃及新王国','埃及','底比斯','egypt',['孟菲斯','赫利奥波利斯','阿斯旺','阿拜多斯','布亨','库施']],
  ['ramesses','埃及新王国','埃及','皮拉美西斯','egypt',['底比斯','孟菲斯','阿布辛贝','阿拜多斯','赫利奥波利斯','珀卢西翁']],
  ['ashoka','孔雀王朝','孔雀','华氏城','india',['塔克西拉','乌阇衍那','托萨利','苏伐那耆厘','婆罗奈','迦毗罗卫']],
  ['chandragupta','孔雀王朝','孔雀','华氏城','india',['塔克西拉','乌阇衍那','婆罗奈','拘舍弥','王舍城','因陀罗普拉斯塔']],
  ['saladin','阿尤布王朝','阿尤布','开罗','arabia',['大马士革','阿勒颇','耶路撒冷','哈马','霍姆斯','亚历山大里亚']],
  ['suleiman','奥斯曼帝国','奥斯曼','君士坦丁堡','ottoman',['埃迪尔内','布尔萨','安卡拉','贝尔格莱德','巴格达','大马士革']],
  ['genghis','蒙古帝国','蒙古','大斡耳朵','steppe',['哈拉和林','上都','撒马尔罕','布哈拉','巴拉沙衮','燕京']],
  ['mansa-musa','马里帝国','马里','尼亚尼','mali',['廷巴克图','加奥','杰内','瓦拉塔','康加巴','奥达戈斯特']],
  ['shaka','祖鲁王国','祖鲁','夸杜库扎','zulu',['布拉瓦约','贡贡德洛武','诺恩戈马','埃肖韦','梅尔莫斯','乌伦迪']],
  ['elizabeth','英格兰王国','英格兰','伦敦','england',['约克','布里斯托尔','朴茨茅斯','普利茅斯','诺里奇','坎特伯雷']],
  ['peter','俄罗斯帝国','俄罗斯','圣彼得堡','russia',['莫斯科','诺夫哥罗德','喀山','阿尔汉格尔斯克','亚速','沃罗涅日']],
  ['pachacuti','印加帝国','印加','库斯科','andes',['奥扬泰坦博','马丘比丘','皮萨克','钦切罗','比尔卡班巴','瓦努科']]
];
export const HISTORICAL_NATIONS = Object.freeze(Object.fromEntries(entries.map(([key,name,short,capital,culture,cityNames])=>[key,Object.freeze({name,short,capital,culture,cityNames:Object.freeze(cityNames)})])));
export const NATIONAL_TRADITIONS=Object.freeze(['学术传统','军务传统','农耕传统','商贸传统','艺文传统','航海传统','信仰传统','工造传统']);
export function historicalNation(player) { return HISTORICAL_NATIONS[typeof player==='string'?player:player?.leaderKey]; }
export function historicalIdentity(key,slot) {
  const n=historicalNation(key);
  return n?{name:n.name,short:n.short,capitalName:n.capital,cityNames:[...n.cityNames],...(NATIONAL_TRADITIONS[slot]?{trait:NATIONAL_TRADITIONS[slot]}:{})}:{};
}
