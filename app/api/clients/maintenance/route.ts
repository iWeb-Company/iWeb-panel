import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/planner-session";
import { get, run } from "@/lib/db";
import type { Client } from "@/types/client";

const base = (process.env.TRAVELNETT_API_URL || "https://tranett.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api").replace(/\/$/, "");
const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });
export async function POST(req: NextRequest) {
  if (!await currentUser()) return fail("No autorizado", 401);
  const key = process.env.IWEB_TENANT_MAINTENANCE_KEY;
  if (!key || key.length < 32) return fail("La gestión de tenants no está configurada en el panel", 503);
  try {
    const body = await req.json();
    if (typeof body.id !== "string" || !["preview", "backup", "delete"].includes(body.action)) return fail("Datos inválidos", 400);
    const client = await get<Client>("SELECT * FROM clients WHERE id = ?", [body.id]);
    if (!client || client.product !== "Tranett") return fail("Cliente de Tranett no encontrado", 404);
    if (body.action !== "preview" && (typeof body.snapshot !== "string" || !/^[a-f0-9]{64}$/.test(body.snapshot))) return fail("Falta revisar los datos del tenant", 400);
    if (body.action === "delete" && body.confirm !== true) return fail("Falta confirmar la eliminación", 400);
    const id = encodeURIComponent(client.id);
    const query = body.action === "preview" ? "" : `?snapshot=${encodeURIComponent(body.snapshot)}${body.action === "delete" ? "&confirm=true" : ""}`;
    const route = body.action === "preview" ? `/${id}/preview` : body.action === "backup" ? `/${id}/backup` : `/${id}`;
    const upstream = await fetch(`${base}/iweb-clients/maintenance${route}${query}`, { method: body.action === "delete" ? "DELETE" : "GET", headers: { "X-iWeb-Maintenance-Key": key }, cache: "no-store" });
    if (!upstream.ok) {
      let message = "Tranett no pudo completar la operación";
      try { const result = await upstream.json(); if (typeof result.detail === "string") message = result.detail; } catch { /* generic error */ }
      return fail(message, upstream.status);
    }
    if (body.action === "backup") {
      return new Response(upstream.body, { status: 200, headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="tenant-${id}.zip"`, "Cache-Control": "no-store" } });
    }
    const result = await upstream.json();
    if (body.action === "delete") {
      try { await run("DELETE FROM clients WHERE id = ? AND product = ?", [client.id, "Tranett"]); }
      catch { return fail("Tranett eliminó el tenant, pero no se pudo actualizar el panel. No repitas la eliminación.", 500); }
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Tenant maintenance error:", err instanceof Error ? err.message : "Error");
    return fail("No se pudo conectar con Tranett; verificá el estado antes de reintentar", 502);
  }
}
