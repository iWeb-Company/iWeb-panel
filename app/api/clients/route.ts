import { NextRequest, NextResponse } from "next/server";
import { all, run } from "@/lib/db";
import type { Client } from "@/types/client";

// GET /api/clients - Fetch all clients
export async function GET() {
  try {
    const clients = await all<Client>("SELECT * FROM clients");
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("API GET clients error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients - Create a client
export async function POST(req: NextRequest) {
  try {
    const client: Client = await req.json();
    await run(
      "INSERT INTO clients (id, name, responsible, monthly, product, status) VALUES (?, ?, ?, ?, ?, ?)",
      [client.id, client.name, client.responsible, client.monthly, client.product, client.status]
    );
    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error("API POST client error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clients - Update a client
export async function PUT(req: NextRequest) {
  try {
    const client: Client = await req.json();
    await run(
      "UPDATE clients SET name = ?, responsible = ?, monthly = ?, product = ?, status = ? WHERE id = ?",
      [client.name, client.responsible, client.monthly, client.product, client.status, client.id]
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
