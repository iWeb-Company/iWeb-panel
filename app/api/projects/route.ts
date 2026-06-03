import { NextRequest, NextResponse } from "next/server";
import { all, run } from "@/lib/db";
import type { Project } from "@/types/project";

// GET /api/projects - Fetch all projects
export async function GET() {
  try {
    const rows = await all<any>("SELECT * FROM projects");
    
    // Parse containerIds JSON string back to array
    const projects: Project[] = rows.map((row) => {
      let containerIds: string[] = [];
      try {
        if (row.containerIds) {
          containerIds = JSON.parse(row.containerIds);
        }
      } catch (err) {
        console.error("Failed to parse containerIds for project " + row.id + ":", err);
      }
      return {
        ...row,
        containerIds,
      };
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("API GET projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/projects - Create a project
export async function POST(req: NextRequest) {
  try {
    const project: Project = await req.json();
    const containerIdsStr = JSON.stringify(project.containerIds || []);
    
    await run(
      `INSERT INTO projects (
        id, name, priority, responsible, cuit, status, startDate, billingDate, endDate,
        budget, advancePercent, remainingBalance, maintenance, paymentUpToDate, domain,
        debtSince, notes, containerIds, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.id,
        project.name,
        project.priority,
        project.responsible,
        project.cuit,
        project.status,
        project.startDate,
        project.billingDate,
        project.endDate,
        project.budget,
        project.advancePercent,
        project.remainingBalance,
        project.maintenance,
        project.paymentUpToDate,
        project.domain,
        project.debtSince || "",
        project.notes || "",
        containerIdsStr,
        project.category,
      ]
    );
    
    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("API POST project error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/projects - Update a project
export async function PUT(req: NextRequest) {
  try {
    const project: Project = await req.json();
    const containerIdsStr = JSON.stringify(project.containerIds || []);

    await run(
      `UPDATE projects SET 
        name = ?, priority = ?, responsible = ?, cuit = ?, status = ?, startDate = ?, 
        billingDate = ?, endDate = ?, budget = ?, advancePercent = ?, remainingBalance = ?, 
        maintenance = ?, paymentUpToDate = ?, domain = ?, debtSince = ?, notes = ?, 
        containerIds = ?, category = ? 
      WHERE id = ?`,
      [
        project.name,
        project.priority,
        project.responsible,
        project.cuit,
        project.status,
        project.startDate,
        project.billingDate,
        project.endDate,
        project.budget,
        project.advancePercent,
        project.remainingBalance,
        project.maintenance,
        project.paymentUpToDate,
        project.domain,
        project.debtSince || "",
        project.notes || "",
        containerIdsStr,
        project.category,
        project.id,
      ]
    );

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("API PUT project error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/projects - Delete a project
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }
    await run("DELETE FROM projects WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE project error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
