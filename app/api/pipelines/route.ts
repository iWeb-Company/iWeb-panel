import { NextRequest, NextResponse } from "next/server";
import { all, run } from "@/lib/db";
import { currentUser } from "@/lib/planner-session";

export const runtime = "nodejs";
async function ensure() {
  await run("CREATE TABLE IF NOT EXISTS pipeline_projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
  await run("CREATE TABLE IF NOT EXISTS pipeline_categories (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL)");
  await run("CREATE TABLE IF NOT EXISTS pipeline_tasks (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, category_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '')");
}
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const valid = (v: unknown) => typeof v === "string" && v.trim().length > 0 && v.length <= 200;
export async function GET() {
  if (!await currentUser()) return fail("No autorizado", 401);
  try { await ensure(); return NextResponse.json({ projects: await all("SELECT * FROM pipeline_projects ORDER BY rowid"), categories: await all("SELECT * FROM pipeline_categories ORDER BY rowid"), tasks: await all("SELECT * FROM pipeline_tasks ORDER BY rowid") }); } catch { return fail("No se pudo cargar el tablero", 500); }
}
export async function POST(req: NextRequest) {
  if (!await currentUser()) return fail("No autorizado", 401);
  try {
    await ensure(); const b = await req.json(); const id = crypto.randomUUID();
    if (b.type === "project" && valid(b.name)) await run("INSERT INTO pipeline_projects VALUES (?,?)", [id, b.name.trim()]);
    else if (b.type === "category" && valid(b.name) && typeof b.project_id === "string") {
      const project = await all("SELECT id FROM pipeline_projects WHERE id=?", [b.project_id]); if (!project.length) return fail("Proyecto no encontrado", 404);
      await run("INSERT INTO pipeline_categories VALUES (?,?,?,?)", [id, b.project_id, b.name.trim(), /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : "#38bdf8"]);
    } else if (b.type === "task" && valid(b.title) && typeof b.project_id === "string" && typeof b.category_id === "string") {
      const category = await all("SELECT id FROM pipeline_categories WHERE id=? AND project_id=?", [b.category_id,b.project_id]); if (!category.length) return fail("Categoría no encontrada", 404);
      await run("INSERT INTO pipeline_tasks VALUES (?,?,?,?,?)", [id,b.project_id,b.category_id,b.title.trim(),typeof b.description === "string" ? b.description.slice(0,5000) : ""]);
    } else return fail("Datos inválidos");
    return NextResponse.json({id}, {status:201});
  } catch { return fail("No se pudo guardar", 500); }
}
export async function PATCH(req: NextRequest) {
  if (!await currentUser()) return fail("No autorizado", 401);
  try { await ensure(); const b = await req.json(); if (typeof b.id !== "string") return fail("ID inválido");
    if (b.type === "task") {
      const tasks = await all<{project_id:string}>("SELECT project_id FROM pipeline_tasks WHERE id=?",[b.id]); if (!tasks.length) return fail("Tarea no encontrada",404);
      const categories = await all("SELECT id FROM pipeline_categories WHERE id=? AND project_id=?",[b.category_id,tasks[0].project_id]);
      if (!categories.length || !valid(b.title) || typeof b.description !== "string" || b.description.length > 5000) return fail("Datos inválidos");
      await run("UPDATE pipeline_tasks SET title=?, description=?, category_id=? WHERE id=?",[b.title.trim(),b.description,b.category_id,b.id]);
    } else if (b.type === "category" && valid(b.name) && /^#[0-9a-f]{6}$/i.test(b.color)) await run("UPDATE pipeline_categories SET name=?, color=? WHERE id=?",[b.name.trim(),b.color,b.id]);
    else if (b.type === "project" && valid(b.name)) await run("UPDATE pipeline_projects SET name=? WHERE id=?",[b.name.trim(),b.id]);
    else return fail("Datos inválidos");
    return NextResponse.json({success:true});
  } catch { return fail("No se pudo actualizar",500); }
}
export async function DELETE(req: NextRequest) {
  if (!await currentUser()) return fail("No autorizado", 401);
  try { await ensure(); const id=req.nextUrl.searchParams.get("id"), type=req.nextUrl.searchParams.get("type"); if (!id) return fail("ID requerido");
    if (type === "task") await run("DELETE FROM pipeline_tasks WHERE id=?",[id]);
    else if (type === "category") { await run("DELETE FROM pipeline_tasks WHERE category_id=?",[id]); await run("DELETE FROM pipeline_categories WHERE id=?",[id]); }
    else if (type === "project") { await run("DELETE FROM pipeline_tasks WHERE project_id=?",[id]); await run("DELETE FROM pipeline_categories WHERE project_id=?",[id]); await run("DELETE FROM pipeline_projects WHERE id=?",[id]); }
    else return fail("Tipo inválido"); return NextResponse.json({success:true});
  } catch { return fail("No se pudo eliminar",500); }
}
