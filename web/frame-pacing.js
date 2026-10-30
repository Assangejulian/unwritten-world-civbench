// Presentation timing only. Never advance the authoritative game clock here.
export const FRAME_INTERVAL=1000/60;
export function frameDeadline(previous,now){
  const steps=Math.floor((now-previous+.1)/FRAME_INTERVAL);
  return steps>0?previous+steps*FRAME_INTERVAL:null;
}
export function cameraElapsed(previous,now){return Math.max(0,Math.min(.1,now-(previous??now-1/30)));}
export function cameraEase(seconds){return 1-Math.pow(.87,seconds*30);}
