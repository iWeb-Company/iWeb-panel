import { NextRequest, NextResponse } from "next/server";
import { all, run, get } from "@/lib/db";
import type { Client, ProvisioningResult } from "@/types/client";

const TRAVELNETT_API_BASE =
  process.env.TRAVELNETT_API_URL ||
  "https://tranett.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api";


const FOONET_API_BASE = process.env.FOONET_API_URL ||
  "https://foonet.iwebtecnology.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Foonet/api/v1";

// GET /api/clients - Fetch all clients
export async function GET() {
  try {
    const clients = await all<Client>("SELECT * FROM clients ORDER BY rowid DESC");
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("API GET clients error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients - Create or provision a client
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Check if multipart/form-data (provisioning with logo uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const name = formData.get("name")?.toString() || "";
      const responsible = formData.get("responsible")?.toString() || "";
      const monthly = formData.get("monthly")?.toString() || "$0";
      const product = formData.get("product")?.toString() as Client["product"];
      if (product !== "Tranett" && product !== "Foonett") return NextResponse.json({ error: "Producto SaaS inválido" }, { status: 400 });
      const status = (formData.get("status")?.toString() || "Activo") as Client["status"];
      const cuit = formData.get("cuit")?.toString() || "";
      const email = formData.get("email")?.toString() || "";
      const adminUsername = formData.get("admin_username")?.toString() || email;
      const adminPassword = formData.get("admin_password")?.toString() || "";
      const customSlug = formData.get("slug")?.toString() || "";

      if (product === "Foonett") {
        const slug = (customSlug || name).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (!slug || !email) return NextResponse.json({ error: "El subdominio y el correo administrador son obligatorios" }, { status: 400 });
        const backendForm = new FormData();
        backendForm.append("name", name);
        backendForm.append("email_admin", email);
        backendForm.append("slug", slug);
        const logo = formData.get("logo_xl");
        if (logo instanceof File && logo.size) backendForm.append("logo", logo);
        const backendRes = await fetch(`${FOONET_API_BASE.replace(/\/$/, "")}/restaurants`, { method: "POST", body: backendForm });
        if (!backendRes.ok) {
          const message = await backendRes.text();
          return NextResponse.json({ error: `Error al crear tenant en Foonet: ${message}` }, { status: backendRes.status });
        }
        const tenant = await backendRes.json();
        const loginUrl = `https://${tenant.slug}.foonet.iwebtecnology.com/login`;
        const newClient = { id: tenant.id, name, responsible, monthly, product, status, slug: tenant.slug, folder_id: tenant.folder_id, cuit, email, login_url: loginUrl, admin_username: email, logo_xl: tenant.logo_url };
        try {
          await run(`INSERT INTO clients (id,name,responsible,monthly,product,status,slug,folder_id,cuit,email,login_url,admin_username,logo_xl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [newClient.id,name,responsible,monthly,product,status,newClient.slug,newClient.folder_id ?? null,cuit,email,loginUrl,email,newClient.logo_xl ?? null]);
        } catch {
          return NextResponse.json({ error: `El tenant ${tenant.id} se creó en Foonet, pero no pudo guardarse en el panel. No repitas el alta sin reconciliarlo.` }, { status: 500 });
        }
        return NextResponse.json({ success: true, client: newClient });
      }

      const normalizedSlug = (customSlug || name)
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_]/g, "") || "empresa";

      let provisioningData: any = null;
      let loginUrl = `https://${normalizedSlug}.tranett.com/login`;

      // Tranett provisions the tenant and its initial administrator together.
      if (product === "Tranett") {
        const backendForm = new FormData();
        backendForm.append("name", name);
        const cleanCuit = cuit.replace(/[^0-9]/g, "") || "20000000001";
        backendForm.append("cuit", cleanCuit);
        const effectiveEmail = email || adminUsername || `admin@${normalizedSlug}.com`;
        backendForm.append("email", effectiveEmail);
        backendForm.append("status", status === "Activo" ? "true" : "false");
        backendForm.append("slug", normalizedSlug);
        backendForm.append("admin_username", adminUsername || effectiveEmail);
        if (adminPassword) backendForm.append("admin_password", adminPassword);

        const logoXl = formData.get("logo_xl");
        const logoS = formData.get("logo_s");

        // Standard valid 1x1 transparent PNG blob for default logos
        const validPngBytes = new Uint8Array([
          137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
          0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84,
          120, 156, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 167, 54, 129, 52, 0,
          0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
        ]);

        if (logoXl instanceof Blob && logoXl.size > 0) {
          backendForm.append("logo_xl", logoXl, (logoXl as File).name || "logo_xl.png");
        } else {
          backendForm.append("logo_xl", new Blob([validPngBytes], { type: "image/png" }), "logo_xl.png");
        }

        if (logoS instanceof Blob && logoS.size > 0) {
          backendForm.append("logo_s", logoS, (logoS as File).name || "logo_s.png");
        } else {
          backendForm.append("logo_s", new Blob([validPngBytes], { type: "image/png" }), "logo_s.png");
        }

        const backendRes = await fetch(`${TRAVELNETT_API_BASE.replace(/\/$/, "")}/iweb-clients/provision`, {
          method: "POST",
          body: backendForm,
        });

        if (!backendRes.ok) {
          const errorText = await backendRes.text();
          let errorMsg = errorText;
          try {
            const parsed = JSON.parse(errorText);
            if (Array.isArray(parsed.detail)) {
              errorMsg = parsed.detail.map((d: any) => `${d.loc?.join(".") || "campo"}: ${d.msg}`).join(", ");
            } else if (typeof parsed.detail === "string") {
              errorMsg = parsed.detail;
            } else if (parsed.error) {
              errorMsg = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
            }
          } catch {}
          console.error("Tranett provisioning failed:", backendRes.status);
          return NextResponse.json(
            { error: `Error al aprovisionar tenant en Tranett: ${errorMsg}` },
            { status: backendRes.status || 500 }
          );
        }

        let result: ProvisioningResult;
        try {
          result = await backendRes.json();
        } catch {
          return NextResponse.json({ error: "Tranett respondió sin confirmar el aprovisionamiento. Verificá si el tenant fue creado antes de reintentar." }, { status: 502 });
        }
        if (!result?.client?.id || !result.client.slug || !result.admin_user?.id || !result.admin_user.username || !result.admin_user.initial_password || !result.login_url || !result.status) {
          return NextResponse.json({ error: "Tranett no confirmó el tenant y su administrador. Verificá el alta antes de reintentar." }, { status: 502 });
        }
        provisioningData = result;
        loginUrl = result.login_url;
      }

      const clientId = provisioningData?.client?.id || `CL-${Date.now()}`;
      const folderId = provisioningData?.client?.folder_id ?? null;
      const logoXlUrl = provisioningData?.client?.logo_xl || (folderId ? `/tenants/${folderId}/logos/logo_xl.png` : null);
      const logoSUrl = provisioningData?.client?.logo_s || (folderId ? `/tenants/${folderId}/logos/logo_s.png` : null);
      const finalSlug = provisioningData?.client?.slug || normalizedSlug;

      const newClient: Client = {
        id: clientId,
        name,
        responsible,
        monthly,
        product,
        status,
        slug: finalSlug,
        folder_id: folderId ?? undefined,
        cuit,
        email,
        login_url: loginUrl,
        admin_username: provisioningData.admin_user.username,
        logo_xl: logoXlUrl || undefined,
        logo_s: logoSUrl || undefined,
      };

      try {
        await run(
        `INSERT INTO clients (
          id, name, responsible, monthly, product, status,
          slug, folder_id, cuit, email, login_url, admin_username, logo_xl, logo_s
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newClient.id,
          newClient.name,
          newClient.responsible,
          newClient.monthly,
          newClient.product,
          newClient.status,
          newClient.slug,
          newClient.folder_id ?? null,
          newClient.cuit ?? null,
          newClient.email ?? null,
          newClient.login_url ?? null,
          newClient.admin_username ?? null,
          newClient.logo_xl ?? null,
          newClient.logo_s ?? null,
        ]
        );
      } catch {
        return NextResponse.json({ error: `El tenant ${clientId} se creó en Tranett, pero no pudo guardarse en el panel. No repitas el alta sin reconciliarlo.` }, { status: 500 });
      }

      // Confirm the credentials against the same endpoint used by the Tranett login screen.
      try {
        const verifyRes = await fetch(`${TRAVELNETT_API_BASE.replace(/\/$/, "")}/auth/login-system`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: finalSlug, username: provisioningData.admin_user.username, password: provisioningData.admin_user.initial_password }),
          cache: "no-store",
        });
        const verified = verifyRes.ok ? await verifyRes.json() : null;
        if (!verifyRes.ok || !verified?.access_token || verified?.iweb_client?.id !== clientId) {
          return NextResponse.json({ error: `El tenant ${clientId} fue creado y guardado, pero Tranett no confirmó las credenciales. No repitas el alta; revisá el administrador del tenant.` }, { status: 502 });
        }
      } catch {
        return NextResponse.json({ error: `El tenant ${clientId} fue creado y guardado, pero no se pudo verificar el acceso. No repitas el alta; comprobá el administrador del tenant.` }, { status: 502 });
      }
      return NextResponse.json({ success: true, client: newClient, provisioning: provisioningData });
    }

    // 2. Standard JSON body payload
    const client: Client = await req.json();
    const normalizedSlug = (client.slug || client.name)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "") || "empresa";

    const loginUrl = client.product === "Tranett" ? (client.login_url || `https://${normalizedSlug}.tranett.com/login`) : (client.login_url && !client.login_url.includes(".tranett.com") ? client.login_url : null);

    await run(
      `INSERT INTO clients (
        id, name, responsible, monthly, product, status,
        slug, folder_id, cuit, email, login_url, admin_username, logo_xl, logo_s
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.id || `CL-${Date.now()}`,
        client.name,
        client.responsible,
        client.monthly,
        client.product,
        client.status,
        client.product === "Tranett" ? normalizedSlug : client.product === "Foonett" ? (client.slug || null) : null,
        client.folder_id || null,
        client.cuit || null,
        client.email || null,
        loginUrl,
        client.admin_username || null,
        client.logo_xl || null,
        client.logo_s || null,
      ]
    );

    return NextResponse.json({ success: true, client: { ...client, slug: client.product === "Tranett" ? normalizedSlug : client.product === "Foonett" ? (client.slug || null) : null, login_url: loginUrl } });
  } catch (error: any) {
    console.error("API POST client error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clients - Update a client
export async function PUT(req: NextRequest) {
  try {
    const client: Client = await req.json();
    const normalizedSlug = (client.slug || client.name)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "") || "empresa";
    const loginUrl = client.product === "Tranett" ? (client.login_url || `https://${normalizedSlug}.tranett.com/login`) : (client.login_url && !client.login_url.includes(".tranett.com") ? client.login_url : null);

    await run(
      `UPDATE clients SET 
        name = ?, responsible = ?, monthly = ?, product = ?, status = ?,
        slug = ?, cuit = ?, email = ?, login_url = ?, admin_username = ?
       WHERE id = ?`,
      [
        client.name,
        client.responsible,
        client.monthly,
        client.product,
        client.status,
        client.product === "Tranett" ? normalizedSlug : client.product === "Foonett" ? (client.slug || null) : null,
        client.cuit || null,
        client.email || null,
        loginUrl,
        client.admin_username || null,
        client.id,
      ]
    );
    return NextResponse.json({ success: true, client: { ...client, slug: client.product === "Tranett" ? normalizedSlug : client.product === "Foonett" ? (client.slug || null) : null, login_url: loginUrl } });
  } catch (error: any) {
    console.error("API PUT client error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients - Delete a client only after the SaaS confirms deletion.
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Falta el ID del cliente" }, { status: 400 });

    const existing = await get<Client>("SELECT * FROM clients WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    if (existing.product === "Tranett") {
      let response: Response;
      try {
        response = await fetch(`${TRAVELNETT_API_BASE.replace(/\/$/, "")}/iweb-clients/delete_iweb_client/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch {
        return NextResponse.json({ error: "No se pudo conectar con Tranett. El cliente sigue en el panel; verificá el estado del tenant antes de reintentar." }, { status: 502 });
      }
      if (!response.ok) {
        let detail = "Tranett no confirmó la eliminación. El cliente sigue en el panel.";
        try {
          const body = await response.json();
          if (typeof body.detail === "string") detail = body.detail;
        } catch { /* Use the generic message for non-JSON errors. */ }
        return NextResponse.json({ error: detail }, { status: response.status });
      }
    }

    try {
      await run("DELETE FROM clients WHERE id = ?", [id]);
    } catch {
      return NextResponse.json({ error: existing.product === "Tranett" ? "Tranett confirmó la eliminación, pero el cliente no pudo borrarse del panel. Actualizá el registro manualmente." : "No se pudo borrar el cliente del panel." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API DELETE client error:", error);
    return NextResponse.json({ error: "No se pudo eliminar el cliente" }, { status: 500 });
  }
}
