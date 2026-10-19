import { all, run } from "@/lib/db";

export type Task={id:string;owner:string;title:string;project:string;duration:number;scheduled_date:string|null;start_time:string|null;status:string;priority:string;repeat_rule:string;visibility:string;created_at:string};
let ready:Promise<void>|undefined;
export function ensureTasks() {
  if(!ready) ready=(async()=>{
    await run(`CREATE TABLE IF NOT EXISTS planner_tasks (id TEXT PRIMARY KEY,owner TEXT NOT NULL,title TEXT NOT NULL,project TEXT NOT NULL DEFAULT '',duration INTEGER NOT NULL DEFAULT 30,scheduled_date TEXT,start_time TEXT,status TEXT NOT NULL DEFAULT 'pending',priority TEXT NOT NULL DEFAULT 'medium',repeat_rule TEXT NOT NULL DEFAULT 'none',visibility TEXT NOT NULL DEFAULT 'private',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await run("CREATE INDEX IF NOT EXISTS idx_planner_owner_date ON planner_tasks(owner, scheduled_date)");
  })().catch(err=>{ready=undefined;throw err});
  return ready;
}
export async function getTasks(owner:string) { await ensureTasks();return all<Task>("SELECT * FROM planner_tasks WHERE owner = ? ORDER BY scheduled_date, start_time, created_at",[owner]); }
export const validDate=(v:unknown)=>typeof v==="string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v+"T12:00:00"));
export const validTime=(v:unknown)=>typeof v==="string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
