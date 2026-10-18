'use client';
import { useEffect, useRef, useState } from 'react';
import DeskScene from './desk-scene';
import { createWorkspaceHydration } from '@/lib/workspace-hydration';
import HelpLibrary from './help-library';
import BudgetPlan from './budget-plan';
import { Cpu, Activity, Wrench, Layers, Sparkles, Download, ShieldCheck, Check, Plus, CircleHelp, Clock3, ChevronRight, LoaderCircle, Zap, Monitor, Thermometer, Power, RotateCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { assembly, guidedDiagnosis, initialWorkspace, workspaceSchema, type Mode, type Workspace, type Message } from '@/lib/benchmate';

const descriptions = { troubleshoot: ['Find the problem.', 'Fix it with confidence.', 'Describe what’s happening. We’ll work through it, one check at a time.'], build: ['Plan your next PC.', 'Start with the essentials.', 'Plan where your money goes, then research parts that work together.'], assemble: ['Build, step by step.', 'One connection at a time.', 'A clear path through your first build. Pick up exactly where you left off.'] };
const currency = { US: 'USD', UK: 'GBP', CA: 'CAD', AU: 'AUD' };
export default function Workbench() {
  const [mode,setMode] = useState<Mode>('troubleshoot');
  const [ws,setWs] = useState<Workspace>(initialWorkspace);
  const [loaded,setLoaded] = useState(false);
  const [signedIn,setSignedIn] = useState(false);
  const [ai,setAi] = useState(false);
  const [saveStatus,setSaveStatus] = useState('Loading workspace…');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [question,setQuestion] = useState('');
  const [diagnosis,setDiagnosis] = useState<ReturnType<typeof guidedDiagnosis>|null>(null);
  const [budgetText,setBudgetText] = useState('1200');
  const budgetValid=budgetText.trim()!=='' && Number.isFinite(Number(budgetText)) && Number(budgetText)>=300 && Number(budgetText)<=10000;
  const resultHeading=useRef<HTMLHeadingElement>(null);
  const [resultRevision,setResultRevision]=useState(0);
  useEffect(()=>{if(resultRevision)resultHeading.current?.focus();},[resultRevision]);
  const lastSaved=useRef('');
  const dirtyRevision=useRef(0);
  const saveQueue=useRef<Promise<void>>(Promise.resolve());
  const hydration=useRef(createWorkspaceHydration(initialWorkspace));
  useEffect(()=>{
    let live=true;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),10000);
    (async()=>{
      try {
        const response=await fetch('/api/workspace',{signal:controller.signal});
        if(!response.ok)throw Error('Workspace unavailable');
        const data=await response.json() as { ai?: boolean; signedIn?: boolean; workspace?: unknown };
        // A failed read must never enable saving defaults over an existing record.
        if(typeof data.signedIn!=='boolean'||!Object.hasOwn(data,'workspace'))throw Error('Invalid workspace response');
        const saved=data.workspace===null?initialWorkspace:workspaceSchema.parse(data.workspace);
        if(!live)return;
        const restored=hydration.current.restore(saved);
        lastSaved.current=JSON.stringify(saved);
        setWs(restored.workspace);
        if(restored.budgetText!==undefined)setBudgetText(restored.budgetText);
        setSignedIn(data.signedIn);
        setAi(data.signedIn && data.ai===true);
        setSaveStatus(data.signedIn?'All changes saved':'Sign in to save progress');
      } catch {
        if(live){setSignedIn(false);setAi(false);setSaveStatus('Cloud save unavailable — export your notes');}
      } finally {
        clearTimeout(timeout);
        if(live)setLoaded(true);
      }
    })();
    return()=>{live=false;clearTimeout(timeout);controller.abort();};
  },[]);
  useEffect(()=>{
    if(!loaded||!signedIn||lastSaved.current===JSON.stringify(ws))return;
    setSaveStatus('Unsaved changes');
    const revision=++dirtyRevision.current;
    const payload=JSON.stringify(ws);
    const timer=setTimeout(()=>{
      saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{
        if(revision===dirtyRevision.current)setSaveStatus('Saving…');
        try{
          const response=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:payload});
          if(!response.ok)throw Error('Save unavailable');
          lastSaved.current=payload;
          if(revision===dirtyRevision.current)setSaveStatus('All changes saved');
        }catch{if(revision===dirtyRevision.current)setSaveStatus('Not saved — export your notes');}
      });
    },700);
    return()=>clearTimeout(timer);
  },[ws,loaded,signedIn]);
  function patch(p: Partial<Workspace>){if(!loaded)hydration.current.record(p);setWs(w=>({...w,...p}));}
  function exportNotes(){const notes={project:'Benchmate',exportedAt:new Date().toISOString(),...ws,guidedResult:diagnosis};const url=URL.createObjectURL(new Blob([JSON.stringify(notes,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='benchmate-session.json';a.click();URL.revokeObjectURL(url);}
  async function ask(message:string){if(!message.trim()||busy)return;const activeMode=mode;const prior=ws.conversations[activeMode];setBusy(true);setError('');try{const r=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:activeMode,message,history:prior.slice(-8),context:{budget:ws.budget,region:ws.region,purpose:ws.purpose,step:assembly[ws.step].title}})});const result=await r.json() as { error?: string; text: string; sources?: {title:string;url:string}[] };if(!r.ok)throw Error(result.error||'The assistant could not respond. Please try again.');setWs(w=>({...w,conversations:{...w.conversations,[activeMode]:[...prior,{role:'user',text:message},{role:'assistant',text:result.text,sources:result.sources}].slice(-20) as Message[]}}));setQuestion('');}catch(e){setError(e instanceof Error?e.message:'Something went wrong. Try again.');}finally{setBusy(false);}}
  const money=(n:number)=>new Intl.NumberFormat('en',{style:'currency',currency:currency[ws.region],maximumFractionDigits:2}).format(n);
  const current=assembly[ws.step];
  const chat=<section className="assistant-panel" aria-label="Specialist conversation" aria-busy={busy}><div className="section-heading"><span><CircleHelp size={18}/> Ask Benchmate</span><span className="pill">{ai?'Available':'Not connected'}</span></div>{ws.conversations[mode].length>0&&<div className="messages">{ws.conversations[mode].map((m,i)=><article className={'message '+m.role} key={i}><small>{m.role==='user'?'YOU':'BENCHMATE'}</small><p>{m.text}</p>{m.sources?.length?<div className="sources">{m.sources.map((s,j)=><a key={j} href={s.url} target="_blank" rel="noopener noreferrer">[{j+1}] {s.title}</a>)}</div>:null}</article>)}</div>}{!ai&&<p className="muted">Live answers are not enabled yet. You can still use the planner and guided checklists.</p>}<form onSubmit={e=>{e.preventDefault();void ask(question);}}><label className="sr-only" htmlFor="followup">Ask a follow-up question</label><div className="chat-input"><input id="followup" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={3000} placeholder={mode==='assemble'?'Which RAM slots should I use?':'Ask about your PC…'} disabled={!ai||busy}/><button className="primary compact" disabled={!ai||busy||!question.trim()}>{busy?<LoaderCircle className="spin" size={18}/>:<Sparkles size={18}/>}<span>Ask</span></button></div></form>{busy&&<p role="status" className="field-help">Benchmate is working on your question…</p>}{error&&<p role="alert" className="error">{error}</p>}</section>;
  const tools = <div className="app-shell is-embedded"><a className="skip-link" href="#workspace">Skip to workspace</a><header className="topbar"><a className="brand" href="/" aria-label="Benchmate home"><span className="brand-icon"><Cpu size={23}/></span>benchmate<span className="beta">BETA</span></a><div className="top-actions"><span className="save-state" role="status">{saveStatus==='All changes saved'&&<Check size={15}/>} {saveStatus}</span><button className="quiet export" onClick={exportNotes}><Download size={16}/> Export notes</button></div></header><main id="workspace"><div className="intro-row"><div><div className="eyebrow"><span className="dash"/> BENCHMATE / WORKSPACE</div><h1>{descriptions[mode][0]}</h1><p className="intro-copy">{descriptions[mode][2]}</p></div><div className="bench-mark" aria-hidden="true"><Activity size={56} strokeWidth={1}/><span>DIAGNOSE / BUILD / LEARN</span></div></div><Tabs value={mode} onValueChange={v=>{setMode(v as Mode);setError('');setQuestion('');}} className="workbench-tabs"><TabsList className="mode-tabs" aria-label="PC support modes"><TabsTrigger value="troubleshoot"><Activity/> Troubleshoot <span>01</span></TabsTrigger><TabsTrigger value="build"><Cpu/> Plan a build <span>02</span></TabsTrigger><TabsTrigger value="assemble"><Wrench/> Assembly guide <span>03</span></TabsTrigger></TabsList><div className="workspace-grid"><div className="main-column"><TabsContent value="troubleshoot"><section className="panel primary-panel"><div className="section-heading"><span><span className="icon-box mint"><Activity size={20}/></span> What’s going on?</span><span className="meta">START HERE</span></div><form onSubmit={e=>{e.preventDefault();setDiagnosis(guidedDiagnosis(ws.symptom));setResultRevision(v=>v+1);}}><label htmlFor="symptom">Tell us about the problem</label><textarea id="symptom" placeholder="My PC turns on, but there’s no display. The fans are spinning and I haven’t changed any parts…" value={ws.symptom} maxLength={3000} onChange={e=>patch({symptom:e.target.value})} rows={4}/><p className="field-help">Include what you see, when it started, and anything you’ve already tried.</p><div className="suggestions">{[[Monitor,'No display'],[Power,'Won’t turn on'],[Thermometer,'Running hot']].map(([Icon,label])=>{const I=Icon as typeof Monitor;return <button type="button" key={label as string} onClick={()=>patch({symptom:label==='Won’t turn on'?'My PC will not power on':String(label)})}><I size={15}/>{label as string}<Plus size={13}/></button>;})}</div><div className="form-footer"><span><ShieldCheck size={16}/> Start with safe, simple checks</span><button className="primary" disabled={!ws.symptom.trim()||!loaded}><Activity size={17}/> Get guided checks</button></div></form></section>{diagnosis&&<section className="panel result-panel" aria-live="polite"><div className="eyebrow">GUIDED CHECKLIST · NOT AN AI DIAGNOSIS</div><h2 ref={resultHeading} tabIndex={-1}>{diagnosis.title}</h2><ol className="numbered-steps">{diagnosis.steps.map((s,i)=><li key={s}><span>{i+1}</span><p>{s}</p></li>)}</ol><div className="next-question"><CircleHelp size={18}/><p>{diagnosis.question}</p></div>{ai&&<button className="primary" disabled={busy} onClick={()=>ask(ws.symptom)}>Ask the troubleshooting specialist</button>}</section>}</TabsContent><TabsContent value="build"><section className="panel primary-panel"><div className="section-heading"><span><span className="icon-box mint"><Cpu size={20}/></span> Build requirements</span><span className="meta">BUILD PLANNER</span></div><div className="build-fields"><div><label htmlFor="budget">Total spending limit</label><input id="budget" type="number" min="300" max="10000" step="any" aria-invalid={!budgetValid} aria-describedby="budget-help" value={budgetText} onChange={e=>{if(!loaded)hydration.current.editBudgetText();setBudgetText(e.target.value);const n=Number(e.target.value);if(n>=300&&n<=10000)patch({budget:n});}} /><p id="budget-help" className={budgetValid?"field-help":"field-help error"}>{budgetValid?"Enter 300–10,000 in your selected currency.":"Enter a budget between 300 and 10,000. The breakdown still shows your last valid budget."}</p></div><div><label htmlFor="region">Market / currency</label><Select value={ws.region} onValueChange={v=>patch({region:v as Workspace['region']})}><SelectTrigger id="region" className="choice"><SelectValue/></SelectTrigger><SelectContent className="workspace-select">{[['US','United States · USD'],['UK','United Kingdom · GBP'],['CA','Canada · CAD'],['AU','Australia · AUD']].map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div><div><label htmlFor="purpose">Main use</label><Select value={ws.purpose} onValueChange={v=>patch({purpose:v as Workspace['purpose']})}><SelectTrigger id="purpose" className="choice"><SelectValue/></SelectTrigger><SelectContent className="workspace-select">{['Gaming','Creative work','Everyday use'].map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div><BudgetPlan ws={ws} patch={patch} money={money}/></section></TabsContent><TabsContent value="assemble"><section className="panel primary-panel"><div className="section-heading"><span><span className="icon-box mint"><Wrench size={20}/></span> Your build, step by step</span><span className="pill">{ws.completed.length} / 10 complete</span></div><Progress value={ws.completed.length*10} aria-label="Assembly progress" aria-valuetext={`${ws.completed.length} of ${assembly.length} steps completed`} className="assembly-progress"/><div className="assembly-layout"><nav aria-label="Assembly steps" className="step-nav">{assembly.map((s,i)=><button key={s.title} onClick={()=>patch({step:i})} aria-current={ws.step===i?'step':undefined}><span>{ws.completed.includes(i)?<Check size={14}/>:String(i+1).padStart(2,'0')}</span>{s.title}</button>)}</nav><article className="step-detail" key={ws.step}><div className="eyebrow">STEP {String(ws.step+1).padStart(2,'0')} <span><Clock3 size={14}/> {current.time}</span></div><h2>{current.title}</h2><p>{current.details}</p><ul className="check-list">{current.checks.map(c=><li key={c}><Check size={16}/>{c}</li>)}</ul><div className="caution"><ShieldCheck size={19}/><p>{current.caution}</p></div><label className="complete-check"><Checkbox checked={ws.completed.includes(ws.step)} onCheckedChange={checked=>patch({completed:checked?[...new Set([...ws.completed,ws.step])]:ws.completed.filter(s=>s!==ws.step)})}/> I’ve completed these checks</label><button className="primary" disabled={ws.step===9} onClick={()=>patch({step:ws.step+1})}>Next step</button>{ws.completed.length===10&&<p className="completion">All ten steps checked. Your build is ready for a final stability check.</p>}</article></div></section></TabsContent></div><aside className="workbench-assistance"><HelpLibrary/>{ai&&chat}<div className="workspace-safety"><ShieldCheck size={18}/><p>Working inside your PC? Shut down, unplug, and follow your component manuals.</p></div></aside></div></Tabs><footer><span>BENCHMATE <span className="footer-slash">/</span> BUILT TO HELP YOU BUILD</span><span>Beta · Verify advice before acting</span></footer></main></div>;
  return <DeskScene saveStatus={saveStatus} onSelect={(next, symptom) => {setMode(next);setError('');setQuestion('');if(symptom){patch({symptom});setDiagnosis(guidedDiagnosis(symptom));}}}>{tools}</DeskScene>;
}

