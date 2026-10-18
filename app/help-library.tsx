'use client';
import { useId, useMemo, useRef, useState } from 'react';
import { Search, BookOpen, ArrowUpRight } from 'lucide-react';
import { helpGuides, helpQuestions, searchHelp, hasSafetyConcern } from '@/lib/help-library.mjs';
import { helpDetails } from '@/lib/help-details.mjs';
type Entry = (typeof helpQuestions)[number];
export default function HelpLibrary(){
 const id=useId();const [query,setQuery]=useState('');const [open,setOpen]=useState(false);const [active,setActive]=useState(-1);const [selected,setSelected]=useState<Entry|null>(null);const heading=useRef<HTMLHeadingElement>(null);
 const matches=useMemo(()=>searchHelp(query),[query]);const safety=hasSafetyConcern(query);
 function choose(entry:Entry){setSelected(entry);setQuery(entry.question);setOpen(false);setActive(-1);requestAnimationFrame(()=>heading.current?.focus());}
 return <section className="help-library" aria-label="Search PC help">
  <div className="section-heading"><span><BookOpen size={18}/> Search PC help</span><span className="pill">Saved guides</span></div>
  <p className="help-intro">100 question suggestions. Practical answers stored on this site—no live AI or web search.</p>
  <form onSubmit={e=>{e.preventDefault();if(matches.length&&!safety)choose(matches[Math.max(0,active)]);else setOpen(true);}}>
   <label htmlFor={id}>What do you need help with?</label>
   <div className="help-search"><Search size={18} aria-hidden="true"/><input id={id} type="search" role="combobox" aria-autocomplete="list" aria-expanded={open&&!safety&&matches.length>0} aria-controls={`${id}-results`} aria-activedescendant={open&&active>=0&&matches[active]?`${id}-option-${active}`:undefined} aria-describedby={`${id}-hint`} autoComplete="off" maxLength={240} placeholder="Try “PC turns on but…”" value={query} onFocus={()=>setOpen(true)} onBlur={()=>{setOpen(false);setActive(-1);}} onChange={e=>{setQuery(e.target.value);setSelected(null);setOpen(true);setActive(-1);}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(a=>Math.min(a+1,matches.length-1));}else if(e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(a=>Math.max(0,a-1));}else if(e.key==='Escape'){setOpen(false);setActive(-1);}}}/></div>
   <p id={`${id}-hint`} className="field-help">Choose a suggestion, or use ↑ ↓ and Enter.</p>
   {open&&!safety&&matches.length>0&&<ul id={`${id}-results`} role="listbox" aria-label="Suggested questions" className="help-results">{matches.map((entry,i)=><li key={entry.id} id={`${id}-option-${i}`} role="option" aria-selected={active===i} onPointerDown={e=>e.preventDefault()} onClick={()=>choose(entry)} className={active===i?'is-active':''}><span>{entry.question}</span><small>{entry.guide.category}</small></li>)}</ul>}
  </form>
  {safety?<div className="help-safety" role="alert"><strong>Stop before troubleshooting.</strong><p>For smoke, sparks, swelling, liquid or a burning smell, stop using the equipment. Disconnect power only if safe; do not touch wet or damaged equipment or open a power supply. Seek qualified help. Do not keep powering it on to test it.</p></div>:<>
   {query.trim()&&!matches.length&&<p role="status" className="help-empty">No close match in our saved library. Try a short phrase such as “no display” or browse the topics below. We won’t guess an answer.</p>}
   {selected&&<article className="help-answer"><span className="help-kicker">{selected.guide.category} · SAVED GUIDE</span><h3 ref={heading} tabIndex={-1}>{selected.guide.title}</h3><p className="field-help">Related guide for: {selected.question}</p><h4>Before you start</h4><p>{helpDetails[selected.guide.id as keyof typeof helpDetails][0]}</p><h4>Work through these checks</h4><ol>{selected.guide.steps.map((step:string)=><li key={step}>{step}</li>)}</ol><h4>Check the result</h4><p>{helpDetails[selected.guide.id as keyof typeof helpDetails][1]}</p><h4>If that does not resolve it</h4><p>{helpDetails[selected.guide.id as keyof typeof helpDetails][2]}</p><p className="help-note">Before opening a PC: shut down, unplug, and follow the exact component manuals. Stop if a check feels unsafe.</p><a href={selected.guide.source.url} target="_blank" rel="noopener noreferrer">{selected.guide.source.title}<ArrowUpRight size={14}/></a><small className="help-reviewed">Reviewed {selected.guide.reviewedOn}. Source links open online; answers are stored here.</small></article>}
  </>}
  <details className="help-topics"><summary>Browse all 20 help topics</summary><div>{helpGuides.map(guide=><button type="button" key={guide.id} onClick={()=>choose(helpQuestions.find(entry=>entry.guide.id===guide.id)!)}>{guide.title}<ArrowUpRight size={14}/></button>)}</div></details>
 </section>;
}
