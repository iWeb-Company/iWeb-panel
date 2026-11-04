import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/planner-session";
import { get, run } from "@/lib/db";
import type { Client } from "@/types/client";

const base = (process.env.TRAVELNETT_API_URL || "https://tranett.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api").replace(/\/$/, "");
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });
type Tenant = { id: string; slug: string; cuit: number | string; name: string; folder_id?: number; logo_xl?: string; logo_s?: string };
const cuitValue = (value: unknown) => String(value ?? "").replace(/\D/g, "");

async function findCandidate(id: string): Promise<{ client: Client; tenant: Tenant }> {
  const client = await get<Client>("SELECT * FROM clients WHERE id = ?", [id]);
  if (!client || client.product !== "Tranett") throw new Error("Cliente de Tranett no encontrado");
  if (!client.slug || !cuitValue(client.cuit)) throw new Error("El cliente necesita un subdominio y CUIT para buscar una coincidencia segura");
  const old = await fetch(`${base}/iweb-clients/get_iweb_client_by_id/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (old.ok) throw new Error("El vínculo actual sigue activo en Tranett");
  if (old.status !== 404) throw new Error("No se pudo verificar el vínculo actual en Tranett");
  const lookup = await fetch(`${base}/iweb-clients/get_iweb_client_by_slug/${encodeURIComponent(client.slug)}`, { cache: "no-store" });
  if (lookup.status === 404) throw new Error("No se encontró un tenant con ese subdominio en Tranett");
  if (!lookup.ok) throw new Error("No se pudo buscar el tenant en Tranett");
  const tenant = await lookup.json() as Tenant;
  if (!tenant.id || !tenant.slug || tenant.slug.toLowerCase() !== client.slug.toLowerCase() || !cuitValue(tenant.cuit) || cuitValue(tenant.cuit) !== cuitValue(client.cuit)) {
    throw new Error("El CUIT o el subdominio no coinciden; no se puede vincular automáticamente");
  }
  if (await get<Client>("SELECT id FROM clients WHERE id = ?", [tenant.id])) throw new Error("Ese tenant ya está vinculado a otro cliente del panel");
  return { client, tenant };
}
export async function GET(req: NextRequest) {
  if (!await currentUser()) return error("No autorizado", 401);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return error("Falta el ID del cliente", 400);
  try { const { client, tenant } = await findCandidate(id); return NextResponse.json({ client: { id: client.id, name: client.name, cuit: client.cuit, slug: client.slug }, tenant: { id: tenant.id, name: tenant.name, cuit: tenant.cuit, slug: tenant.slug } }, { headers: { "Cache-Control": "no-store" } }); }
  catch (err) { return error(err instanceof Error ? err.message : "No se pudo buscar la coincidencia", 409); }
}
export async function POST(req: NextRequest) {
  if (!await currentUser()) return error("No autorizado", 401);
  try {
    const body = await req.json();
    if (typeof body.id !== "string" || typeof body.tenant_id !== "string") return error("Datos inválidos", 400);
    const { client, tenant } = await findCandidate(body.id);
    if (tenant.id !== body.tenant_id) return error("La coincidencia cambió; revisala de nuevo", 409);
    const updated = await run("UPDATE clients SET id = ?, slug = ?, folder_id = ?, logo_xl = ?, logo_s = ?, login_url = ? WHERE id = ? AND product = ? AND slug = ? AND cuit = ?", [tenant.id, tenant.slug, tenant.folder_id ?? null, tenant.logo_xl ?? null, tenant.logo_s ?? null, `https://${tenant.slug}.tranett.com/login`, client.id, "Tranett", client.slug, client.cuit]);
    if (!updated.changes) return error("El cliente cambió; volvé a intentarlo", 409);
    return NextResponse.json({ success: true });
  } catch (err) { return error(err instanceof Error ? err.message : "No se pudo vincular el tenant", 409); }
}
