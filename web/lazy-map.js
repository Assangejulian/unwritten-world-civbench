// Keep title-screen startup independent of WebGL and world artwork.
import {tileYield} from '/rules.mjs';
import {tileYieldPerspective} from './tile-yields.js';
export class LazyMapRenderer {
  constructor(...args) {
    this.instance=null;this.loading=null;this.args=args;this.game=null;this.session=null;this.yieldPlayer=null;this.cameraIntent=null;
    this.options={menuOpen:true,keys:new Set(),dirty:true,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,showGrid:false,showYields:false,showResources:true,showUnitNames:true,borderStyle:'soft',selected:null,orders:[],orderPreview:null};
    this.setBorderStyle(localStorage.getItem('hex-civilizations-border-style')||'soft');
    return new Proxy(this,{get:(target,key)=>key in target?typeof target[key]==='function'?target[key].bind(target):target[key]:target.instance?typeof target.instance[key]==='function'?target.instance[key].bind(target.instance):target.instance[key]:target.options[key],set:(target,key,value)=>{if(key in target)target[key]=value;else{target.options[key]=value;if(target.instance)target.instance[key]=value;}return true;}});
  }
  get initialized(){return !!this.instance;}
  async ensure(){
    if(this.instance)return this.instance;
    if(this.loading)return this.loading;
    this.loading=(async()=>{
      const {MapRenderer}=await import('./map3d.js');
      const real=new MapRenderer(...this.args);
      Object.assign(real,this.options);
      if(this.session)real.setSimulationState(this.session);
      if(this.game)real.setState(this.game);
      if(this.yieldPlayer)real.setYieldPlayer(this.yieldPlayer,this.yieldView);
      if(this.cameraIntent)real[this.cameraIntent.method](...this.cameraIntent.args);
      this.cameraIntent=null;this.instance=real;return real;
    })();
    try{return await this.loading;}finally{this.loading=null;}
  }
  setState(game){this.game=game;this.instance?.setState(game);}
  setSimulationState(session){this.session=session;this.instance?.setSimulationState(session);}
  setYieldPlayer(player,view=player?.id??-1){this.yieldPlayer=player;this.yieldView=view;this.instance?.setYieldPlayer(player,view);}
  tileYields(tile){return this.instance?.tileYields(tile)??tileYield(tile,tileYieldPerspective(this.game,tile,this.yieldView??-1,this.yieldPlayer).player);}
  terrainType(tile){return this.instance?.terrainType(tile)??tile.terrain;}
  focus(...args){if(this.instance)this.instance.focus(...args);else this.cameraIntent={method:'focus',args};}
  fit(...args){if(this.instance)this.instance.fit(...args);else this.cameraIntent={method:'fit',args};}
  zoomAt(...args){this.instance?.zoomAt(...args);}
  pick(...args){return this.instance?.pick(...args);}
  setBorderStyle(style){this.options.borderStyle=style==='hidden'?'hidden':'soft';this.options.showBorders=this.options.borderStyle!=='hidden';this.instance?.setBorderStyle(this.options.borderStyle);}
}
