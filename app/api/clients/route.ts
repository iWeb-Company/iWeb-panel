import { NextRequest, NextResponse } from "next/server";
import { all, run, get } from "@/lib/db";
import type { Client, ProvisioningResult } from "@/types/client";

const TRAVELNETT_API_BASE =
  process.env.TRAVELNETT_API_URL ||
  "https://tranett.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api";


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
      const product = (formData.get("product")?.toString() || "Tranett") as Client["product"];
      const status = (formData.get("status")?.toString() || "Activo") as Client["status"];
      const cuit = formData.get("cuit")?.toString() || "";
      const email = formData.get("email")?.toString() || "";
      const adminUsername = formData.get("admin_username")?.toString() || email;
      const adminPassword = formData.get("admin_password")?.toString() || "";
      const customSlug = formData.get("slug")?.toString() || "";

      const normalizedSlug = (customSlug || name)
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_]/g, "") || "empresa";

      let provisioningData: any = null;
      let loginUrl = `https://${normalizedSlug}.tranett.com/login`;
      let generatedPass = adminPassword || `Tn.${Math.random().toString(36).substring(2, 8)}!2026`;

      // If product is Tranett, provision against FastAPI backend (2-step flow for maximum server compatibility)
      if (product === "Tranett") {
        const backendForm = new FormData();
        backendForm.append("name", name);
        const cleanCuit = cuit.replace(/[^0-9]/g, "");
        if (cleanCuit) {
          backendForm.append("cuit", cleanCuit);
        }
        backendForm.append("email", email);
        backendForm.append("status", status === "Activo" ? "true" : "false");

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
          backendForm.append("logo_xl", logoXl);
        } else {
          backendForm.append("logo_xl", new Blob([validPngBytes], { type: "image/png" }), "logo_xl.png");
        }

        if (logoS instanceof Blob && logoS.size > 0) {
          backendForm.append("logo_s", logoS);
        } else {
          backendForm.append("logo_s", new Blob([validPngBytes], { type: "image/png" }), "logo_s.png");
        }

        // Step 1: Create SaaS Tenant and allocate folders/DB entry
        const backendRes = await fetch(`${TRAVELNETT_API_BASE}/iweb-clients/create_iweb_client`, {
          method: "POST",
          body: backendForm,
        });

        if (!backendRes.ok) {
          const errorText = await backendRes.text();
          let errorMsg = errorText;
          try {
            const parsed = JSON.parse(errorText);
            errorMsg = parsed.detail || parsed.error || errorText;
          } catch {}
          console.error("Tranett create_iweb_client failed:", errorMsg);
          return NextResponse.json(
            { error: `Error al aprovisionar tenant en Tranett: ${errorMsg}` },
            { status: backendRes.status || 500 }
          );
        }

        const clientData = await backendRes.json();
        const tenantId = clientData.id;
        const tenantSlug = clientData.slug || normalizedSlug;
        loginUrl = `https://${tenantSlug}.tranett.com/login`;

        // Step 2: Create initial Admin user in users table
        let adminUserId = `USR-${Date.now()}`;
        try {
          const userRes = await fetch(`${TRAVELNETT_API_BASE}/auth/create-user/${tenantId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user: {
                name: name,
                last_name: "Admin",
                username: adminUsername,
                password: generatedPass,
                active: 1,
                rol: "admin",
              },
            }),
          });

          if (userRes.ok) {
            const userJson = await userRes.json();
            if (userJson.id) adminUserId = userJson.id;
          } else {
            console.warn("Could not create initial user:", await userRes.text());
          }
        } catch (uErr) {
          console.warn("User create error:", uErr);
        }

        provisioningData = {
          client: clientData,
          admin_user: {
            id: adminUserId,
            username: adminUsername,
            name: name,
            last_name: "Admin",
            initial_password: generatedPass,
          },
          login_url: loginUrl,
          status: {
            database: "OK",
            storage: "OK",
            subdomain: "OK",
          },
        };
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
        admin_username: adminUsername,
        logo_xl: logoXlUrl || undefined,
        logo_s: logoSUrl || undefined,
      };

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

      const provisionResult: ProvisioningResult = provisioningData || {
        client: newClient,
        admin_user: {
          id: `USR-${Date.now()}`,
          username: adminUsername,
          name: name,
          last_name: "Admin",
          initial_password: generatedPass,
        },
        login_url: loginUrl,
        status: {
          database: "OK",
          storage: "OK",
          subdomain: "OK",
        },
      };

      return NextResponse.json({ success: true, client: newClient, provisioning: provisionResult });
    }

    // 2. Standard JSON body payload
    const client: Client = await req.json();
    const normalizedSlug = (client.slug || client.name)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "") || "empresa";

    const loginUrl = client.login_url || `https://${normalizedSlug}.tranett.com/login`;

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
        normalizedSlug,
        client.folder_id || null,
        client.cuit || null,
        client.email || null,
        loginUrl,
        client.admin_username || null,
        client.logo_xl || null,
        client.logo_s || null,
      ]
    );

    return NextResponse.json({ success: true, client: { ...client, slug: normalizedSlug, login_url: loginUrl } });
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
    const loginUrl = client.login_url || `https://${normalizedSlug}.tranett.com/login`;

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
        normalizedSlug,
        client.cuit || null,
        client.email || null,
        loginUrl,
        client.admin_username || null,
        client.id,
      ]
    );
    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error("API PUT client error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients - Delete a client
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing client ID" }, { status: 400 });
    }

    // Try cascading deletion on SaaS if it's a Tranett client
    try {
      const existing = await get<Client>("SELECT * FROM clients WHERE id = ?", [id]);
      if (existing && existing.product === "Tranett") {
        // 1. Fetch users and delete them first
        const usersRes = await fetch(`${TRAVELNETT_API_BASE}/auth/users/${id}`);
        if (usersRes.ok) {
          const users = await usersRes.json();
          if (Array.isArray(users)) {
            for (const u of users) {
              await fetch(`${TRAVELNETT_API_BASE}/auth/users/${id}/${u.id}`, { method: "DELETE" });
            }
          }
        }
        // 2. Delete tenant record and folder
        await fetch(`${TRAVELNETT_API_BASE}/iweb-clients/delete_iweb_client/${id}`, { method: "DELETE" });
      }
    } catch (saasErr) {
      console.warn("Could not delete from Tranett SaaS backend:", saasErr);
    }

    await run("DELETE FROM clients WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE client error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

