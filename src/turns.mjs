import {RealtimeSimulation,ECONOMY_PERIOD,developmentAIOrders} from './realtime.mjs';
import {assignController,isDecisionSeat,isInactiveSeat} from './environment/controllers.mjs';
import {applyAction,finishTurn,movementAllowance,linkedPartner,event} from './engine.mjs';
import {movementBlocked} from './movement-rules.mjs';
import {UNITS,dist} from './rules.mjs';
import {unitDetected} from './movement-rules.mjs';
import {unitRoute,advanceMoveOrder} from './player-planning.mjs';

// Human games use discrete nation turns. Seconds remain an internal compatibility clock,
// advanced exactly once per completed round, never by wall time or presentation playback.
export class GameSimulation extends RealtimeSimulation {
  constructor(game,options={}){
    const saved=game.turnOrder?game.units.map(u=>({id:u.id,acted:u.acted,moves:u.moves})):null;
    super(game,options);
    this.onNative=options.onNative||null;
    this.replayNative=options.replayNative||null;
    if(saved)for(const old of saved){const u=game.units.find(u=>u.id===old.id);if(u)Object.assign(u,old);}
    if(game.settings.playMode==='turns'||game.players.some(p=>p.manual))this.enterTurns();
  }
  get turnBased(){return this.game.settings.playMode==='turns';}
  get activePlayer(){return this.game.turnOrder?.order[this.game.turnOrder.index];}
  enterTurns(){
    this.pause();const g=this.game;
    if(!g.turnOrder){
      // Cancel uncommitted legacy realtime work; reserved nuclear ammunition is refunded once.
      for(const entity of [...g.units,...g.cities]){if(entity.activity?.nuclearReserved){const p=g.players[entity.owner];if(p)p.nuclearStockpile=(p.nuclearStockpile||0)+1;}delete entity.activity;}
      g.realtime.queues={};g.settings.playMode='turns';
      const first=g.players.find(p=>p.alive&&isDecisionSeat(p))?.id??g.players.find(p=>p.alive)?.id;
      const order=g.players.filter(p=>p.alive).map(p=>p.id),i=order.indexOf(first);
      g.turnOrder={version:1,round:g.turn,order:[...order.slice(i),...order.slice(0,i)],index:0};
      for(const entity of [...g.units,...g.cities])for(const key of ['cooldownUntil','moveUntil','attackUntil','healUntil','supportUntil'])delete entity[key];
      this.beginPlayer();
    }else{
      const t=g.turnOrder;
      if(t.version!==1||t.round!==g.turn||!Array.isArray(t.order)||!t.order.length||new Set(t.order).size!==t.order.length||t.order.some(id=>!Number.isInteger(id)||!g.players[id])||!Number.isInteger(t.index)||t.index<0||t.index>=t.order.length)throw Error('Invalid saved turn order.');
      g.settings.playMode='turns';
    }
    this.phase='human';this.onChange();
  }
  setControl(player,manual){
    if(this.turnBased&&this.phase==='ai')throw Error('请等待当前文明完成回合。');
    if(manual&&this.turnBased&&this.activePlayer!==player.id)throw Error('请在该文明的回合接管。');
    this.pause();this.game.realtime.queues[player.id]=[];if(!manual)for(const u of this.game.units.filter(u=>u.owner===player.id)){delete u.moveOrder;delete u.stance;}
    assignController(player,manual?'human':'native',{bump:true});
    if(manual){
      if(!this.turnBased)this.enterTurns();
      else if(this.activePlayer!==player.id)throw Error('请在该文明的回合接管。');
    }else if(!this.game.players.some(p=>p.alive&&isDecisionSeat(p))){
      delete this.game.turnOrder;this.game.settings.playMode='realtime';this.phase=null;super.ready();
    }
    this.onChange();
  }
  beginPlayer(){
    const g=this.game;
    for(const u of g.units.filter(u=>u.owner===this.activePlayer)){u.moves=movementAllowance(g,u);u.acted=(u.cooldownUntil||0)>g.realtime.time||!!UNITS[u.type].civilian&&movementBlocked(g,u);}
    for(const u of g.units.filter(u=>u.owner===this.activePlayer&&u.stance==='alert')){const p=g.players[u.owner],enemy=g.units.some(e=>e.owner!==u.owner&&e.hp>0&&!UNITS[e.type].civilian&&(e.owner<0||p.relations[e.owner]?.status==='war')&&p.visible.includes(e.tile)&&unitDetected(g,e,p.id)&&dist(g.map.tiles[u.tile],g.map.tiles[e.tile],g.map)<=3);if(enemy){delete u.stance;event(g,'military','警戒部队发现附近敌军，已唤醒等待命令。',p.id,u.tile);}else{u.acted=true;u.moves=0;}}
    for(const c of g.cities.filter(c=>c.owner===this.activePlayer))c.attacked=false;
    const p=g.players[this.activePlayer];for(const u of g.units.filter(u=>u.owner===p.id&&u.moveOrder))advanceMoveOrder(g,p,u,a=>this.command(p,a));
  }
  ready(){return this.turnBased?false:super.ready();}
  advance(seconds){if(!this.turnBased)return super.advance(seconds);}
  async plan(options){if(!this.turnBased)return super.plan(options);}
  play(){if(this.turnBased)throw Error('回合制对局请点击「结束回合」。');return super.play();}
  command(p,action){
    if(!this.turnBased)return this.enqueue(p,[action],{manual:true});
    if(p.id!==this.activePlayer||this.game.winner)throw Error('现在不是该文明的回合。');
    const g=this.game,u=g.units.find(u=>u.owner===p.id&&u.id===action?.unit),partner=u&&linkedPartner(g,u);
    if(['alert','wake'].includes(action?.type)){if(!u)throw Error('单位不存在。');if(action.type==='wake')delete u.stance;else{if(u.acted||u.moves<=0||UNITS[u.type].civilian)throw Error('此单位不能进入警戒。');applyAction(g,p,{type:'fortify',unit:u.id});u.stance='alert';delete u.moveOrder;}this.onChange();return 0;}
    if(['route','cancelRoute'].includes(action?.type)){
      if(!u)throw Error('单位不存在。');if(action.type==='cancelRoute')delete u.moveOrder;
      else{const route=unitRoute(g,p,u,action.tile);if(!route||route.path.length<2)throw Error('已探索地图中没有可通行的路线。');u.moveOrder={destination:action.tile,issuedTurn:g.turn};advanceMoveOrder(g,p,u,a=>this.command(p,a));}
      this.stats.accepted++;this.onChange();return 0;
    }
    applyAction(g,p,action);
    if(u&&!action.continueRoute){delete u.moveOrder;delete u.stance;}
    // Movement spends its actual budget; subsequent movement/attack is possible until exhausted.
    if(['move','separate'].includes(action.type))for(const unit of [u,partner])if(unit&&g.units.includes(unit))unit.acted=unit.moves<=0||!!UNITS[unit.type].civilian&&movementBlocked(g,unit);
    this.stats.accepted++;this.onChange();return 0;
  }
  enqueue(p,orders,options={}){
    if(!this.turnBased)return super.enqueue(p,orders,options);
    if(!Array.isArray(orders)||orders.length>128)throw Error('最多提交 128 条指令。');
    for(const action of orders)this.command(p,action);return 0;
  }
  async endTurn(player,{force=false,system=false}={}){
    const actor=this.game.players[player];
    const allowed=system?isDecisionSeat(actor)||isInactiveSeat(actor):isDecisionSeat(actor);
    if(!this.turnBased||this.phase==='ai'||player!==this.activePlayer||!allowed)throw Error('无法结束当前回合。');
    const pending=this.game.cities.filter(c=>c.owner===player&&c.capturePending);if(pending.length&&!force)throw Error('请先决定保留或摧毁新占领的城市。');if(force)for(const c of pending)applyAction(this.game,this.game.players[player],{type:'keepCity',city:c.id});
    const g=this.game;this.phase='ai';this.onChange();
    try{
      let settled=0;
      for(let count=0;count<=g.players.length&&!g.winner;count++){
        const t=g.turnOrder;t.index++;
        if(t.index>=t.order.length){
          const before=g.players.map(p=>({id:p.id,gold:p.gold,faith:p.faith,science:p.scienceTotal,culture:p.cultureTotal,techs:[...p.techs],civics:[...p.civics],cities:g.cities.filter(c=>c.owner===p.id).length,population:g.cities.filter(c=>c.owner===p.id).reduce((n,c)=>n+c.population,0),units:g.units.filter(u=>u.owner===p.id).length}));
          g.realtime.time=Math.round((g.realtime.time+ECONOMY_PERIOD)*1000)/1000;g.realtime.nextEconomy=g.realtime.time+ECONOMY_PERIOD;
          finishTurn(g);t.round=g.turn;t.order=t.order.filter(id=>g.players[id].alive);t.index=0;
          settled++;
          if(!t.order.length)break;this.beginPlayer();this.onEconomy(before);this.onChange();
          if(g.winner)break;
        }else this.beginPlayer();
        const p=g.players[this.activePlayer];
        if(settled&&!g.players.some(x=>x.alive&&isDecisionSeat(x)))break;
        if(!p?.alive||isInactiveSeat(p))continue;
        if(isDecisionSeat(p))break;
        this.onChange();
        // A nation finishes its own bounded decision passes before the next nation is observed.
        for(let pass=0;pass<3&&!g.winner;pass++){
          if(!this.execute&&!this.replayNative)break;
          try{
            if(this.replayNative){
              const recorded=this.replayNative(p.id);
              if(!recorded)break;
              if(recorded.error)throw new Error(String(recorded.error));
              p.driver.calls++;p.driver.lastMs=0;p.driver.status='ready';p.driver.message='';
              p.memory=recorded.memory===undefined?null:recorded.memory;
              let accepted=0;
              for(const action of recorded.orders||[])try{this.command(p,action);accepted++;}catch(error){this.stats.rejected++;this.onRejected?.({stage:'turn',owner:p.id,type:action.type,reason:error.message,time:g.realtime.time});}
              if(!accepted)break;
              continue;
            }
            const obs=await this.prepareObservation(g,p),extra=developmentAIOrders(obs),response=await this.execute(p,obs);
            if(this.onNative){
              const orders=JSON.parse(JSON.stringify([...(response.orders||[]),...extra].slice(0,128)));
              const memory=response.memory===undefined?null:JSON.parse(JSON.stringify(response.memory));
              this.onNative({seat:p.id,orders,memory,error:null});
              p.driver.calls++;p.driver.lastMs=response.ms;p.driver.status='ready';p.driver.message=response.stderr;p.memory=memory;
              let accepted=0;
              for(const action of orders)try{this.command(p,action);accepted++;}catch(error){this.stats.rejected++;this.onRejected?.({stage:'turn',owner:p.id,type:action.type,reason:error.message,time:g.realtime.time});}
              if(!accepted)break;
            }else{
              p.driver.calls++;p.driver.lastMs=response.ms;p.driver.status='ready';p.driver.message=response.stderr;p.memory=response.memory;
              let accepted=0;
              for(const action of [...(response.orders||[]),...extra].slice(0,128))try{this.command(p,action);accepted++;}catch(error){this.stats.rejected++;this.onRejected?.({stage:'turn',owner:p.id,type:action.type,reason:error.message,time:g.realtime.time});}
              if(!accepted)break;
            }
          }catch(error){
            if(this.onNative&&!this.replayNative)this.onNative({seat:p.id,orders:[],memory:p.memory??null,error:String(error.message||error).slice(0,1500)});
            p.driver.calls++;p.driver.failures++;p.driver.status='error';p.driver.message=String(error.message||error).slice(0,1500);event(g,'driver',`${p.short} 驱动执行失败：${p.driver.message}`,p.id);break;
          }
        }
      }
    }finally{this.phase='human';this.onChange();}
  }
  state(view=-1){
    if(!this.turnBased)return super.state(view);
    return {...super.state(view),mode:'turns',running:false,turn:this.game.turn,activePlayer:this.activePlayer,phase:this.phase||'human',canEndTurn:view>=0&&view===this.activePlayer&&this.phase!=='ai'&&isDecisionSeat(this.game.players[view]),players:this.game.players.filter(p=>view<0||p.id===view).map(p=>({id:p.id,planning:this.phase==='ai'&&p.id===this.activePlayer,queued:0,active:0}))};
  }
}
