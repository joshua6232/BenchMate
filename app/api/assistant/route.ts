import { z } from 'zod';
import { modes, messageSchema } from '@/lib/benchmate';
import { instructions } from '@/lib/specialists';
import { db, config, json, readJson, sameOrigin, userId } from '@/lib/server';
const schema=z.object({mode:z.enum(modes),message:z.string().trim().min(1).max(3000),history:z.array(messageSchema).max(8),context:z.object({budget:z.number().min(300).max(10000),region:z.enum(['US','UK','CA','AU']),purpose:z.string().max(60),step:z.string().max(100)})});
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Invalid request origin'},403);
 try{
 const id=await userId();if(!id)return json({error:'Sign in to use the specialist.'},401);
 const cfg=config();if(!cfg.OPENAI_API_KEY || cfg.AI_ENABLED !== 'true')return json({error:'Live AI is not connected yet. The owner needs to configure OpenAI.'},503);
 let body;try{body=schema.parse(await readJson(req,160000));}catch{return json({error:'Please check your message and try again.'},400);}
   const day=new Date().toISOString().slice(0,10); const bucket='user:'+id+':'+day;
   const limit=await db().prepare('INSERT INTO usage_limits (bucket,count) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<20 RETURNING count').bind(bucket).first();
   if(!limit)return json({error:'Your daily beta limit of 20 requests has been reached. Try again tomorrow (UTC).'},429);
   const global=await db().prepare('INSERT INTO usage_limits (bucket,count) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<100 RETURNING count').bind('global:'+day).first();
   if(!global)return json({error:'The site’s daily beta AI limit has been reached. Guided tools remain available.'},429);
   const result=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(90000),headers:{'Authorization':`Bearer ${cfg.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:cfg.OPENAI_MODEL||'gpt-5.5',instructions:instructions(body.mode),input:[...body.history.map(m=>({role:m.role,content:m.text})),{role:'user',content:JSON.stringify({request:body.message,buildContext:body.context,today:day})}],tools:[{type:'web_search'}],...(body.mode==='build'?{tool_choice:'required'}:{}),max_output_tokens:2200,store:false})});
   if(!result.ok){console.error('OpenAI response status',result.status);return json({error:'The AI service could not complete this request. Check the connection or try again later.'},502);}
   const data=await result.json() as {status?:string,output?:Array<{type:string,content?:Array<{type:string,text?:string,annotations?:Array<{type:string,title?:string,url?:string}>}>}>};
   if(data.status==='incomplete')return json({error:'The answer exceeded the response limit. Try a narrower question.'},502);
   if(data.status && data.status!=='completed')return json({error:'The AI service did not complete the answer. Please try again later.'},502);
   const text:string[]=[];const sources:{title:string,url:string}[]=[];
   for(const item of data.output||[])for(const c of item.content||[]){
     if(c.type==='output_text'&&c.text)text.push(c.text);
     for(const a of c.annotations||[])if(a.type==='url_citation'&&a.url){
       try{
         const url=new URL(a.url);
         if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.href.length>2000)continue;
         if(!sources.some(s=>s.url===url.href))sources.push({title:(a.title||url.hostname).slice(0,500),url:url.href});
       }catch{ /* Ignore malformed citations without discarding a usable answer. */ }
     }
   }
   if(!text.length)return json({error:'No answer was returned. Please try again.'},502);
   return json({text:text.join('\n\n').slice(0,14000),sources:sources.slice(0,25)});
 }catch(e){console.error('Specialist request failed',e instanceof Error?e.name:'unknown');return json({error:'The request could not finish. Your input is still here; please try again.'},503);}
}
