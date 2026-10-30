const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopGame',Object.freeze({
  toggleFullscreen:()=>ipcRenderer.invoke('desktop:fullscreen'),
  state:()=>ipcRenderer.invoke('desktop:state'),
  onFullscreen:callback=>{const listener=(_event,value)=>callback(value);ipcRenderer.on('desktop:fullscreen',listener);return()=>ipcRenderer.removeListener('desktop:fullscreen',listener);}
}));
