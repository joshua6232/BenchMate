'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Cpu, MousePointer2, X, CornerDownLeft, Monitor, Wrench, CircleHelp, Volume2, Headphones, Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';
import type { Mode } from '@/lib/benchmate';
import './workspace.css';

const objects = [
  { id:'display', name:'Troubleshoot', description:'Find out what’s wrong.', object:'Left monitor', x:37, y:30, left:24.3, top:16, width:25, height:28, mode:'troubleshoot' as Mode, icon:Monitor },
  { id:'build', name:'Plan your build', description:'Your budget. The right parts.', object:'Right monitor', x:61.8, y:29.7, left:49.8, top:16, width:23, height:27, mode:'build' as Mode, icon:Cpu },
  { id:'tower', name:'Build your PC', description:'From the first screw to first boot.', object:'PC tower', x:91.1, y:35, left:79, top:19, width:18, height:34, mode:'assemble' as Mode, icon:Wrench },
  { id:'keyboard', name:'Need a hand?', description:'Find your way around the desk.', object:'Keyboard', x:50.3, y:52.7, left:40.5, top:50.8, width:20.5, height:8, mode:null, icon:Keyboard },
  { id:'headphones', name:'Headphone help', description:'Get your sound back.', object:'Headphones', x:12.2, y:45.1, left:6.7, top:33.5, width:9.4, height:23, mode:'troubleshoot' as Mode, symptom:'My headphones have no sound. Help me check the connection and audio output settings.', icon:Headphones },
  { id:'speaker', name:'Audio help', description:'Check your speakers and output.', object:'Speakers', x:77.6, y:38.5, left:72.7, top:33.7, width:5.5, height:16, mode:'troubleshoot' as Mode, symptom:'My speakers have no sound. Help me check audio output, volume, mute and the physical connection.', icon:Volume2 },
  { id:'speaker-left', name:'Audio help', description:'Check your speakers and output.', object:'Left speaker', x:22.9, y:41.5, left:16.4, top:35.8, width:7.1, height:18, mode:'troubleshoot' as Mode, symptom:'My speakers have no sound. Help me check audio output, volume, mute and the physical connection.', icon:Volume2 },
  { id:'mouse', name:'Mouse & keyboard', description:'When something stops responding.', object:'Mouse', x:67.2, y:52.7, left:63.8, top:50.5, width:5.1, height:7, mode:'troubleshoot' as Mode, symptom:'My mouse or keyboard is not responding. Help me check the connection, power, pairing and USB port.', icon:MousePointer2 },
];
export default function DeskScene({children,onSelect,saveStatus}:{children:ReactNode;onSelect:(mode:Mode,symptom?:string)=>void;saveStatus:string}){
  const mount=useRef<HTMLDivElement|null>(null);
  const anchorRefs=useRef<Record<string,HTMLButtonElement>>({});
  const engine=useRef<{setActive:(id:string|null)=>void;setPaused:(value:boolean)=>void;setHover:(id:string|null)=>void;focus:(id:string)=>void;dispose:()=>void}|null>(null);
  const pickRef=useRef<(id:string)=>void>(()=>{});
  const [ready,setReady]=useState(false);
  const [fallback,setFallback]=useState(false);
  const [paused,setPaused]=useState(true);
  const [active,setActive]=useState<string|null>(null);
  const [hovered,setHovered]=useState<string|null>(null);
  const lastTrigger=useRef<HTMLButtonElement|null>(null);
  const guideButton=useRef<HTMLButtonElement|null>(null);
  function open(id:string,button?:HTMLButtonElement){const item=objects.find(o=>o.id===id);if(!item)return;if(button)lastTrigger.current=button;if(item.mode)onSelect(item.mode,'symptom' in item?item.symptom:undefined);setActive(id);}
  pickRef.current=(id)=>open(id,anchorRefs.current[id]);
  useEffect(()=>{let cancelled=false;import('./scene-engine.mjs').then(({createDesk})=>{if(cancelled||!mount.current)return;try{engine.current=createDesk(mount.current,{onPick:(id:string)=>pickRef.current(id),onHover:(id:string|null)=>setHovered(id),onReady:()=>setReady(true),onFailure:()=>setFallback(true),anchors:anchorRefs.current});}catch{setFallback(true);}}).catch(()=>setFallback(true));return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};},[]);
  useEffect(()=>{if(fallback){engine.current?.dispose();engine.current=null;}},[fallback]);
  useEffect(()=>{engine.current?.setActive(active);},[active]);
  useEffect(()=>{engine.current?.setPaused(paused);},[paused]);
  return <div className={'desk-world live-3d'+(active?' desk-open':'')}>
    <header className="desk-brandbar"><a href="/" className="desk-brand"><Cpu size={18}/><span>benchmate</span></a><span className="desk-edition">YOUR SPACE. YOUR PC.</span></header>
    <main className="desk-stage" aria-label="Interactive 3D PC desk"><h1 className="sr-only">Benchmate interactive 3D PC workbench</h1><div className="webgl-mount" ref={mount}/>{!ready&&!fallback&&<div className="scene-loading" role="status">Lighting your workspace…</div>}{fallback&&<div className="scene-fallback"><img src="/desk-scene.png" alt="PC desk reference"/><p>3D isn’t available on this device. Choose a tool below.</p><div>{objects.filter(o=>['display','build','tower','keyboard'].includes(o.id)).map(o=><button key={o.id} onClick={e=>open(o.id,e.currentTarget)}>{o.name}</button>)}</div></div>}{!fallback&&<div className="scene-hotspots" aria-label="Desk objects">{objects.map(o=><button key={o.id} ref={el=>{if(el)anchorRefs.current[o.id]=el;}} type="button" className={'scene-anchor'+(hovered===o.id?' is-hovered':'')} style={{visibility:'hidden'}} aria-label={o.object+': '+o.name} aria-haspopup="dialog" onClick={e=>open(o.id,e.currentTarget)} onMouseEnter={()=>engine.current?.setHover(o.id)} onMouseLeave={()=>engine.current?.setHover(null)} onFocus={()=>{engine.current?.focus(o.id);engine.current?.setHover(o.id);}} onBlur={()=>engine.current?.setHover(null)}><span className="scene-anchor-core"/><span className="scene-object-label"><o.icon size={18}/><span><strong>{o.name}</strong><small>{o.description}</small></span></span></button>)}</div>}</main>
    <div className="desk-invitation"><span className="invitation-line"/><MousePointer2 size={15}/><p>A little curiosity goes a long way. <span>Select something on the desk.</span></p><span className="invitation-line"/></div>
    <div className="desk-bottom"><span className="desktop-instruction">EXPLORE YOUR SETUP</span><span className="mobile-instruction">DRAG TO EXPLORE</span><Toggle className="motion-toggle" pressed={!paused} onPressedChange={enabled=>setPaused(!enabled)} aria-label="Scene animation">{paused?"Enable motion":"Pause motion"}</Toggle><span className="desk-save" role="status">{saveStatus}</span><button ref={guideButton} onClick={e=>open('keyboard',e.currentTarget)} aria-label="How to use this desk"><CircleHelp size={17}/><span>Desk guide</span></button></div>
    <Dialog open={!!active} onOpenChange={isOpen=>{if(!isOpen)setActive(null);}}><DialogContent className={'desk-dialog'+(active==='keyboard'?' help-dialog':'')} showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();const trigger=lastTrigger.current; if(trigger?.isConnected && getComputedStyle(trigger).visibility!=='hidden')trigger.focus(); else guideButton.current?.focus();}}>
      <header className="desk-dialog-header"><div><span className="dialog-object">benchmate</span><DialogTitle>{active==='keyboard'?'Desk guide':'Your PC workspace'}</DialogTitle></div><DialogClose className="back-to-desk"><CornerDownLeft size={15}/><span>Back to desk</span><X size={16}/></DialogClose></header>
      <DialogDescription className="sr-only">Plan a build, troubleshoot a problem, or follow the assembly guide. Press Escape or select Back to desk to return to the scene.</DialogDescription>
      {active==='keyboard'?<div className="desk-help"><p className="help-intro">Everything starts at your desk.</p><p>Choose an object to open its tools. Your desk is always one click away.</p><div className="help-destinations">{objects.filter(o=>['display','build','tower'].includes(o.id)).map(o=><button key={o.id} onClick={()=>open(o.id)}><o.icon size={24}/><span><strong>{o.name}</strong><small>{o.description}</small></span></button>)}</div><div className="help-footnote"><p>Headphones and speakers open audio troubleshooting. The mouse opens connection help.</p><p><kbd>Tab</kbd> moves between objects. <kbd>Enter</kbd> opens a tool. <kbd>Esc</kbd> brings you back.</p><p>Guided tools are available now. Live AI is held until the owner enables it. Sign in to save your progress.</p><a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a></div></div>:children}
    </DialogContent></Dialog>
  </div>;
}
