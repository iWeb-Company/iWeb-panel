import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/planner-session";
import { ensureTasks, getTasks, validDate, validTime } from "@/lib/planner-tasks";
import { run } from "@/lib/db";

export const runtime = "nodejs";
const priorities = ["low", "medium", "high", "urgent"];
type Item = { title: string; project: string; duration: number; date: string; time: string; priority: string };
const mins = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await req.json();
    if (!Array.isArray(body.tasks) || body.tasks.length === 0 || body.tasks.length > 70)
      return NextResponse.json({ error: "La propuesta debe tener entre 1 y 70 tareas." }, { status: 400 });

    const items: Item[] = [];
    for (const raw of body.tasks) {
      if (!raw || typeof raw !== "object" ||
          typeof raw.title !== "string" || !raw.title.trim() || raw.title.length > 200 ||
          typeof raw.project !== "string" || raw.project.length > 120 ||
          !Number.isInteger(raw.duration) || raw.duration < 15 || raw.duration > 720 ||
          !validDate(raw.scheduled_date) || !validTime(raw.start_time))
        return NextResponse.json({ error: "La propuesta contiene tareas inválidas. Revisá los campos." }, { status: 400 });
      const end = mins(raw.start_time) + raw.duration;
      if (end > 1440) return NextResponse.json({ error: "Una tarea termina después de medianoche." }, { status: 400 });
      items.push({
        title: raw.title.trim(), project: raw.project, duration: raw.duration,
        date: raw.scheduled_date, time: raw.start_time,
        priority: priorities.includes(raw.priority) ? raw.priority : "medium",
      });
    }

    await ensureTasks();
    const existing = await getTasks(user);
    // Retomar un guardado parcial previo sin volver a insertar tareas idénticas.
    const alreadySaved = (t: Item) => existing.some(x =>
      x.title === t.title && x.scheduled_date === t.date &&
      x.start_time === t.time && x.duration === t.duration && x.project === t.project);
    const pending = items.filter(t => !alreadySaved(t));
    const occupied = existing.filter(t => t.scheduled_date && t.start_time).map(t => ({
      date: t.scheduled_date!, start: mins(t.start_time!), end: mins(t.start_time!) + t.duration,
    }));
    for (const task of pending) {
      const start = mins(task.time), end = start + task.duration;
      if (occupied.some(x => x.date === task.date && start < x.end && x.start < end))
        return NextResponse.json({ error: "Hay horarios superpuestos. Revisá la planificación antes de guardar." }, { status: 409 });
      occupied.push({ date: task.date, start, end });
    }

    if (pending.length) {
      // Un solo INSERT es atómico en SQLite: o se guardan todas o ninguna.
      const placeholders = pending.map(() => "(?,?,?,?,?,?,?,?,?,?,?)").join(",");
      const params = pending.flatMap(t => [
        crypto.randomUUID(), user, t.title, t.project, t.duration,
        t.date, t.time, "pending", t.priority, "none", "private",
      ]);
      await run(
        "INSERT INTO planner_tasks (id,owner,title,project,duration,scheduled_date,start_time,status,priority,repeat_rule,visibility) VALUES " + placeholders,
        params
      );
    }
    return NextResponse.json({ success: true, created: pending.length, skipped: items.length - pending.length });
  } catch (err) {
    console.error("[planner/batch] Error saving proposal:", err);
    return NextResponse.json({ error: "Error al guardar la planificación. Consultá los logs del servidor." }, { status: 500 });
  }
}
