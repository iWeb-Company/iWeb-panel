import { NextRequest,NextResponse } from "next/server";
import { currentUser } from "@/lib/planner-session";
import { getTasks,validDate,validTime } from "@/lib/planner-tasks";
import { callGeminiJSON } from "@/lib/gemini";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const user=await currentUser();if(!user)return NextResponse.json({error:"No autorizado"},{status:401});
 try{
 const body=await req.json();const prompt=body.prompt,week=body.week;
 if(typeof prompt!=="string"||!prompt.trim()||prompt.length>6000||!validDate(week))return NextResponse.json({error:"Instrucciones o semana inválidas"},{status:400});
 const start=new Date(week+"T12:00:00Z"),existing=await getTasks(user);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10)});
 const busy=existing.filter(t=>t.scheduled_date&&days.includes(t.scheduled_date)).map(t=>({date:t.scheduled_date,time:t.start_time,duration:t.duration,title:t.title}));
 const instruction=`Sos un asistente de planificación semanal. Devolvé SOLO JSON {"tasks":[{"title":"...","project":"...","duration":60,"scheduled_date":"YYYY-MM-DD","start_time":"HH:mm","priority":"medium","repeat_rule":"none"}],"notes":"..."}. Semana de lunes a domingo: ${days.join(", ")}. Horario predeterminado 09:00 a 18:00 de lunes a viernes, bloques de 15 minutos, duración 15..720 min. Interpretá las indicaciones del usuario. Respetá restricciones de fecha y horarios mencionadas; si solo se menciona mañana/tarde asigná un horario sugerido. Para tareas cada día generá una tarea por día laboral. No replantees tareas existentes, ni superpongas sus horarios. Si falta tiempo para algo, dejalo explicado en notes y no inventes compromisos confirmados. Agenda existente: ${JSON.stringify(busy)}. Solicitud: ${prompt}`;
 const result=await Promise.race([callGeminiJSON<{tasks?:unknown[],notes?:string}>(instruction),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error("PLANNER_TIMEOUT")),30000))]);if(!Array.isArray(result.tasks)||result.tasks.length>70)return NextResponse.json({error:"Respuesta IA inválida"},{status:502});
 const proposals=[] as {title:string;project:string;duration:number;scheduled_date:string;start_time:string;priority:string;repeat_rule:string}[];
 for(const item of result.tasks){if(!item||typeof item!=="object")return NextResponse.json({error:"Respuesta IA inválida"},{status:502});const t=item as Record<string,unknown>;
 if(typeof t.title!=="string"||!t.title.trim()||t.title.length>200||!Number.isInteger(t.duration)||Number(t.duration)<15||Number(t.duration)>720||!validDate(t.scheduled_date)||!days.includes(t.scheduled_date as string)||!validTime(t.start_time))return NextResponse.json({error:"La IA devolvió horarios inválidos; intentá reformular"},{status:502});
 proposals.push({title:t.title.trim(),project:typeof t.project==="string"?t.project.slice(0,120):"",duration:Number(t.duration),scheduled_date:t.scheduled_date as string,start_time:t.start_time as string,priority:["low","medium","high","urgent"].includes(String(t.priority))?String(t.priority):"medium",repeat_rule:"none"});
 }
 const intervals=[...busy.filter(t=>t.date&&t.time).map(t=>({date:t.date!,time:t.time!,duration:t.duration,title:t.title}))];
 const conflicts:string[]=[];for(const t of proposals){const a=Number(t.start_time.slice(0,2))*60+Number(t.start_time.slice(3));if(intervals.some(b=>{if(b.date!==t.scheduled_date)return false;const s=Number(b.time.slice(0,2))*60+Number(b.time.slice(3));return a<s+b.duration&&s<a+t.duration;}))conflicts.push(t.title);intervals.push({date:t.scheduled_date,time:t.start_time,duration:t.duration,title:t.title});}
 return NextResponse.json({tasks:proposals,notes:typeof result.notes==="string"?result.notes.slice(0,1000):"",conflicts});
 }catch(err){
 console.error("Planner AI",err);
 const message=err instanceof Error?err.message:"";
 if(message==="PLANNER_TIMEOUT")return NextResponse.json({error:"Gemini tardó más de 30 segundos en responder. Revisá la conectividad y la cuota del modelo."},{status:504});
 if(message.includes("GEMINI_API_KEY no está configurada"))return NextResponse.json({error:"Falta GEMINI_API_KEY en el servidor. Configurala en el entorno y reiniciá el servicio."},{status:503});
 if(/HTTP 429/.test(message))return NextResponse.json({error:"Gemini superó la cuota o el límite de solicitudes (429). Revisá la cuota del proyecto y probá más tarde."},{status:429});
 if(/HTTP 401|HTTP 403/.test(message))return NextResponse.json({error:"Gemini rechazó la API key o el proyecto no tiene permisos (401/403)."},{status:502});
 if(/HTTP 404/.test(message))return NextResponse.json({error:"El modelo Gemini configurado no está disponible (404). Revisá AI_MODEL."},{status:502});
 if(/HTTP 400/.test(message))return NextResponse.json({error:"Gemini rechazó la solicitud (400). Revisá el modelo y su compatibilidad con respuestas JSON."},{status:502});
 return NextResponse.json({error:"No se pudo generar el plan. Consultá el log del servidor para ver el motivo."},{status:502});
 }
}
