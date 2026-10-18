'use client';
import { allocation, type Workspace } from '@/lib/benchmate';
const notes = [
 'Compare performance in your actual apps; include the cost of its platform.',
 'Match your games and display target. Everyday-use plans assume a CPU with usable integrated graphics.',
 'Check CPU support and BIOS, memory generation, case size and the connections you need.',
 'Choose capacity for your workload and a kit supported by the board.',
 'Allow room for your operating system, applications and files; plan backups separately.',
 'Choose for the complete system’s power and connector requirements. Do not sacrifice suitability to meet this allowance.',
 'Verify board, graphics card and cooler clearances plus airflow.',
 'Check whether a suitable cooler is included. Increase this allowance if a separate cooler or fans are required.',
];
export default function BudgetPlan({ws,patch,money}:{ws:Workspace;patch:(p:Partial<Workspace>)=>void;money:(n:number)=>string}) {
 const hardware=Math.max(0,ws.budget-ws.reserve);
 const parts=allocation(hardware,ws.purpose);
 const remainder=Math.round((hardware-parts.reduce((sum,p)=>sum+p.amount,0))*100)/100;
 return <section className="budget-explainer" aria-label="Your spending plan">
  <label htmlFor="reserve">Set aside for extras</label>
  <input id="reserve" type="number" min="0" max="10000" step="1" value={ws.reserve} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=0&&n<=10000)patch({reserve:n});}}/>
  <p className="field-help">Enter your combined allowance for tax, shipping, operating system, monitor, keyboard and mouse. Include only what you still need. This is your estimate, not an automatic tax calculation.</p>
  <div className="budget-total"><div><small>Available for PC components</small><strong>{money(hardware)}</strong></div><span>Total limit {money(ws.budget)}<br/>Extras reserved {money(ws.reserve)}</span></div>
  {ws.reserve>=ws.budget?<p role="alert" className="error">Your extras use the entire budget. Reduce the reserve or raise the total before planning components.</p>:<>
   <h3>A starting point for {ws.purpose.toLowerCase()}</h3>
   <p>{ws.purpose==='Gaming'?'This plan gives graphics the largest share. Choose your games and resolution before deciding where to spend more.':ws.purpose==='Creative work'?'This plan balances CPU, graphics and memory. Check your main application: editing, rendering and design can have very different needs.':'This plan has no separate graphics-card allowance. Confirm the chosen processor provides graphics and the board has a suitable display output.'}</p>
   <table className="parts-table"><caption>Planning allowances · {ws.region} currency · not retailer prices</caption><thead><tr><th scope="col">Component</th><th scope="col">Share</th><th scope="col">Allowance</th></tr></thead><tbody>{parts.map((p,i)=><tr key={p.name}><th scope="row">{p.name}<details><summary>What to check</summary><p>{notes[i]}</p></details></th><td>{p.share}%</td><td>{p.share?money(p.amount):'No separate card'}</td></tr>)}</tbody></table>
   <p className="field-help">Unallocated rounding buffer: {money(remainder)}. Currency selection changes the label; it does not convert amounts or look up local prices.</p>
   <div className="caution"><p>These percentages are a shopping starting point, not proof that suitable parts exist at each allowance. Shift money between categories after comparing real products. Cooling and power requirements must be met even if they exceed the suggested share.</p></div>
  </>}
  <h3>Before you buy</h3><ol className="budget-checks"><li>Write down exact part models and current shop prices, including required cooling.</li><li>Check CPU/BIOS support, memory type, case clearances, storage slots and PSU connections against manufacturer manuals.</li><li>Add the component prices and extras. Keep the final checkout total within your limit; avoid counting included tax twice.</li><li>If it does not fit, revise the performance target or optional extras and compare again. These allowances do not guarantee compatibility or performance.</li></ol>
 </section>;
}
