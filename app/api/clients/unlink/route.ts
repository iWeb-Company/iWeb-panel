import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/planner-session";
import { get, run } from "@/lib/db";
import type { Client } from "@/types/client";
const base = (process.env.TRAVELNETT_API_URL || "https://tranett.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api").replace(/\/$/, "");
export async function POST(req: NextRequest) {
  if (!await currentUser()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await req.json();
    if (typeof body.id !== "string" || body.confirm !== true) return NextResponse.json({ error: "Falta confirmar" }, { status: 400 });
    const client = await get<Client>("SELECT * FROM clients WHERE id = ? AND product = ?", [body.id, "Tranett"]);
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    const upstream = await fetch(`${base}/iweb-clients/get_iweb_client_by_id/${encodeURIComponent(client.id)}`, { cache: "no-store" });
    if (upstream.ok) return NextResponse.json({ error: "El tenant todavía existe en Tranett; revisá sus datos antes de eliminarlo" }, { status: 409 });
    if (upstream.status !== 404) return NextResponse.json({ error: "No se pudo verificar el tenant en Tranett" }, { status: 502 });
    await run("DELETE FROM clients WHERE id = ? AND product = ?", [client.id, "Tranett"]);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "No se pudo verificar el tenant; el registro sigue en el panel" }, { status: 502 }); }
}
