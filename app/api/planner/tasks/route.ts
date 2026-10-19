import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/planner-session";
import { ensureTasks,getTasks,validDate,validTime } from "@/lib/planner-tasks";
import { run } from "@/lib/db";
export const runtime="nodejs";
const allowedStatus=["pending","progress","review","done"];
const priorities=["low","medium","high","urgent"];
const repeats=["none","daily","weekdays","weekly"];
const bad=(message:string,status=400)=>NextResponse.json({error:message},{status});
export async function GET(){const user=await currentUser();if(!user)return bad("No autorizado",401);try{return NextResponse.json(await getTasks(user));}catch{return bad("Error leyendo tareas",500)}}
export async function POST(req:NextRequest){const user=await currentUser();if(!user)return bad("No autorizado",401);
 try {const body=await req.json();if(!body||typeof body.title!=="string"||!body.title.trim()||body.title.length>200)return bad("Título inválido");
 const duration=Number(body.duration);if(!Number.isInteger(duration)||duration<15||duration>720)return bad("Duración inválida");
 const date=body.scheduled_date??null,time=body.start_time??null;
 if(date!==null&&!validDate(date)||time!==null&&!validTime(time)||time&&!date)return bad("Horario inválido");
 const project=typeof body.project==="string"?body.project.slice(0,120):"";
 const status=allowedStatus.includes(body.status)?body.status:"pending";
 const priority=priorities.includes(body.priority)?body.priority:"medium";
 const repeat=repeats.includes(body.repeat_rule)?body.repeat_rule:"none";
 const id=crypto.randomUUID();await ensureTasks();
 await run("INSERT INTO planner_tasks (id,owner,title,project,duration,scheduled_date,start_time,status,priority,repeat_rule,visibility) VALUES (?,?,?,?,?,?,?,?,?,?,?)",[id,user,body.title.trim(),project,duration,date,time,status,priority,repeat,"private"]);
 return NextResponse.json({id},{status:201});}catch{return bad("No se pudo crear la tarea",500)}
}
export async function PATCH(req:NextRequest){const user=await currentUser();if(!user)return bad("No autorizado",401);
 try{const body=await req.json();if(typeof body.id!=="string")return bad("ID requerido");
 const cols:Record<string,unknown>={};if("title" in body){if(typeof body.title!=="string"||!body.title.trim()||body.title.length>200)return bad("Título inválido");cols.title=body.title.trim();}
 if("project" in body){if(typeof body.project!=="string"||body.project.length>120)return bad("Proyecto inválido");cols.project=body.project;}
 if("duration" in body){if(!Number.isInteger(body.duration)||body.duration<15||body.duration>720)return bad("Duración inválida");cols.duration=body.duration;}
 if("scheduled_date" in body){if(body.scheduled_date!==null&&!validDate(body.scheduled_date))return bad("Fecha inválida");cols.scheduled_date=body.scheduled_date;}
 if("start_time" in body){if(body.start_time!==null&&!validTime(body.start_time))return bad("Hora inválida");cols.start_time=body.start_time;}
 if("status" in body){if(!allowedStatus.includes(body.status))return bad("Estado inválido");cols.status=body.status;}
 if("priority" in body){if(!priorities.includes(body.priority))return bad("Prioridad inválida");cols.priority=body.priority;}
 if("repeat_rule" in body){if(!repeats.includes(body.repeat_rule))return bad("Recurrencia inválida");cols.repeat_rule=body.repeat_rule;}
 const entries=Object.entries(cols);if(!entries.length)return bad("Nada que actualizar");
 await ensureTasks();const result=await run("UPDATE planner_tasks SET "+entries.map(([k])=>k+" = ?").join(", ")+" WHERE id = ? AND owner = ?",[...entries.map(([,v])=>v),body.id,user]);
 return result.changes?NextResponse.json({success:true}):bad("Tarea no encontrada",404);
 }catch{return bad("No se pudo actualizar",500)}
}
export async function DELETE(req:NextRequest){const user=await currentUser();if(!user)return bad("No autorizado",401);const id=req.nextUrl.searchParams.get("id");if(!id)return bad("ID requerido");await ensureTasks();const r=await run("DELETE FROM planner_tasks WHERE id=? AND owner=?",[id,user]);return r.changes?NextResponse.json({success:true}):bad("Tarea no encontrada",404)}
