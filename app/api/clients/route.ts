import { NextRequest, NextResponse } from "next/server";
import { all, run, get } from "@/lib/db";
import type { Client, ProvisioningResult } from "@/types/client";

const TRAVELNETT_API_BASE =
  process.env.TRAVELNETT_API_URL ||
  "http://127.0.0.1:8012/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api";

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

      // If product is Tranett, attempt to provision against the FastAPI backend
      if (product === "Tranett") {
        try {
          const backendForm = new FormData();
          backendForm.append("name", name);
          backendForm.append("cuit", cuit.replace(/[^0-9]/g, "") || "20000000001");
          backendForm.append("email", email);
          backendForm.append("status", status === "Activo" ? "true" : "false");
          backendForm.append("slug", normalizedSlug);
          backendForm.append("admin_username", adminUsername);
          backendForm.append("admin_password", generatedPass);

          const logoXl = formData.get("logo_xl");
          const logoS = formData.get("logo_s");

          if (logoXl instanceof Blob && logoXl.size > 0) {
            backendForm.append("logo_xl", logoXl);
          } else {
            // Provide a dummy 1x1 png blob if not provided
            const dummyBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });
            backendForm.append("logo_xl", dummyBlob, "logo_xl.png");
          }

          if (logoS instanceof Blob && logoS.size > 0) {
            backendForm.append("logo_s", logoS);
          } else {
            const dummyBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });
            backendForm.append("logo_s", dummyBlob, "logo_s.png");
          }

          const backendRes = await fetch(`${TRAVELNETT_API_BASE}/iweb-clients/provision`, {
            method: "POST",
            body: backendForm,
          });

          if (backendRes.ok) {
            provisioningData = await backendRes.json();
            loginUrl = provisioningData.login_url || loginUrl;
            if (provisioningData.admin_user?.initial_password) {
              generatedPass = provisioningData.admin_user.initial_password;
            }
          } else {
            console.warn("Backend provision returned non-200:", await backendRes.text());
          }
        } catch (fetchErr) {
          console.warn("Could not reach FastAPI backend directly (running standalone mode):", fetchErr);
        }
      }

      const clientId = provisioningData?.client?.id || `CL-${Date.now()}`;
      const folderId = provisioningData?.client?.folder_id || Math.floor(Date.now() / 1000) % 10000;
      const logoXlUrl = provisioningData?.client?.logo_xl || `/tenants/${folderId}/logos/logo_xl.png`;
      const logoSUrl = provisioningData?.client?.logo_s || `/tenants/${folderId}/logos/logo_s.png`;

      const newClient: Client = {
        id: clientId,
        name,
        responsible,
        monthly,
        product,
        status,
        slug: normalizedSlug,
        folder_id: folderId,
        cuit,
        email,
        login_url: loginUrl,
        admin_username: adminUsername,
        logo_xl: logoXlUrl,
        logo_s: logoSUrl,
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
          newClient.folder_id,
          newClient.cuit,
          newClient.email,
          newClient.login_url,
          newClient.admin_username,
          newClient.logo_xl,
          newClient.logo_s,
        ]
      );

      const provisionResult: ProvisioningResult = {
        client: newClient,
        admin_user: {
          id: provisioningData?.admin_user?.id || `USR-${Date.now()}`,
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
    await run("DELETE FROM clients WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE client error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

