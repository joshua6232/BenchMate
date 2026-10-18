// Render only while moving or settling after input, at a bounded frame rate.
export function createSceneScheduler({render, isMoving, isHidden, request=requestAnimationFrame, cancel=cancelAnimationFrame, now=()=>performance.now()}) {
  let pending=null, stopped=false, last=-Infinity, settleUntil=0;
  function schedule(){if(!stopped&&!isHidden()&&pending===null)pending=request(tick);}
  function tick(ms){
    pending=null;
    if(stopped||isHidden())return;
    if(ms-last>=1000/24){last=ms;render(ms);}
    if(isMoving()||ms<settleUntil)schedule();
  }
  return {
    invalidate(){settleUntil=now()+800;schedule();},
    visibilityChanged(){if(pending!==null){cancel(pending);pending=null;}if(!isHidden()){last=-Infinity;this.invalidate();}},
    dispose(){stopped=true;if(pending!==null)cancel(pending);pending=null;},
  };
}
