import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSceneScheduler} from '../app/scene-scheduler.mjs';

function setup(){
  let time=0, moving=false, hidden=false, count=0, id=0;
  const queue=new Map();
  const scheduler=createSceneScheduler({render:()=>count++,isMoving:()=>moving,isHidden:()=>hidden,now:()=>time,request:fn=>{queue.set(++id,fn);return id;},cancel:key=>queue.delete(key)});
  return {scheduler,queue,get count(){return count;},move:value=>moving=value,hide:value=>{hidden=value;scheduler.visibilityChanged();},advance(ms){const end=time+ms;while(time<end){time+=1000/120;const batch=[...queue.values()];queue.clear();batch.forEach(fn=>fn(time));}}};
}
test('paused scene settles, stops all requests, and wakes for input',()=>{
  const h=setup();h.scheduler.invalidate();h.advance(1000);assert.equal(h.queue.size,0);
  const settled=h.count;h.advance(1000);assert.equal(h.count,settled);
  h.scheduler.invalidate();h.advance(100);assert.ok(h.count>settled);h.scheduler.dispose();
});
test('animation is capped even on a 120 Hz display',()=>{
  const h=setup();h.move(true);h.scheduler.invalidate();h.advance(1000);
  assert.ok(h.count>=18&&h.count<=25,`rendered ${h.count} frames`);h.scheduler.dispose();
});
test('hidden pages and disposed scenes cancel pending work',()=>{
  const h=setup();h.move(true);h.scheduler.invalidate();h.advance(100);
  h.hide(true);const count=h.count;assert.equal(h.queue.size,0);h.advance(1000);assert.equal(h.count,count);
  h.hide(false);h.advance(100);assert.ok(h.count>count);
  h.scheduler.dispose();assert.equal(h.queue.size,0);h.scheduler.invalidate();assert.equal(h.queue.size,0);
});
test('pausing an animated scene stops drawing after settling',()=>{
  const h=setup();h.move(true);h.scheduler.invalidate();h.advance(1000);
  h.move(false);h.scheduler.invalidate();h.advance(1000);assert.equal(h.queue.size,0);
});
