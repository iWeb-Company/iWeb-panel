import { NextRequest, NextResponse } from "next/server";
import { all, run } from "@/lib/db";
import { exec } from "child_process";
import type { Project } from "@/types/project";

function execPromise(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error && !stdout && !stderr) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

// Fallback container list matching API fallback
const mockContainers = [
  { id: "3e5fa80bca12", name: "tranett-web", status: "Up 24 hours" },
  { id: "721a9c43d8ef", name: "tranett-api", status: "Up 24 hours" },
  { id: "a90dfb841a32", name: "tranett-db", status: "Up 24 hours" },
  { id: "492bc837d9fa", name: "foonett-frontend", status: "Up 12 hours" },
  { id: "891afc320d91", name: "foonett-backend", status: "Up 12 hours" },
  { id: "b2849c328ef1", name: "vitalis-web", status: "Up 3 days" },
  { id: "c9028ef17a22", name: "vitalis-api", status: "Exited (1) 2 hours ago" }, // Stopped container
  { id: "0d8a1c32ef44", name: "nginx-proxy", status: "Up 5 days" },
  { id: "1c32ef44289a", name: "redis-cache", status: "Up 5 days" },
  { id: "e44289ad910f", name: "portainer", status: "Up 5 days" }
];

async function getDockerContainers() {
  try {
    const stdout = await execPromise(
      'docker ps -a --format "ID: {{.ID}} | NAME: {{.Names}} | STATUS: {{.Status}}"'
    );
    const lines = stdout.split("\n").filter(Boolean);
    return lines.map((line) => {
      const parts = line.split(" | ");
      const item: any = {};
      parts.forEach((part) => {
        const [key, ...val] = part.split(": ");
        if (key && val.length > 0) {
          item[key.toLowerCase().trim()] = val.join(": ").trim();
        }
      });
      return {
        id: item.id || "",
        name: item.name || "",
        status: item.status || ""
      };
    });
  } catch (err) {
    return mockContainers;
  }
}

// GET /api/notifications?username=email
export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "Missing username parameter" }, { status: 400 });
    }

    // 1. Fetch user notifications from SQLite
    let userNotifications = await all<any>(
      "SELECT * FROM notifications WHERE username = ? ORDER BY id ASC",
      [username]
    );

    // 2. If user has no notifications, generate them dynamically from actual database and server states
    if (userNotifications.length === 0) {
      console.log(`Generating dynamic notifications for user: ${username}`);
      const generated = [];

      // A. Query projects from SQLite
      const projectsRows = await all<any>("SELECT * FROM projects");
      const projects: Project[] = projectsRows.map((row) => {
        let containerIds: string[] = [];
        try {
          if (row.containerIds) {
            containerIds = JSON.parse(row.containerIds);
          }
        } catch (e) {}
        return { ...row, containerIds };
      });

      // B. Check 1: Delayed Payment Warnings (morosity)
      const debtorProjects = projects.filter((p) => p.paymentUpToDate === "NO" && p.status !== "Completado");
      for (const p of debtorProjects) {
        generated.push({
          id: `pay-${p.id}`,
          username,
          type: "warning",
          titleES: `Pago pendiente: ${p.name}`,
          titleEN: `Pending payment: ${p.name}`,
          descriptionES: `El proyecto tiene saldo adeudado de ${p.remainingBalance || "N/A"} desde ${p.debtSince || "el mes pasado"}.`,
          descriptionEN: `The project has outstanding balance of ${p.remainingBalance || "N/A"} since ${p.debtSince || "last month"}.`,
          href: "/dashboard/proyectos",
          actionES: "Ir a proyectos",
          actionEN: "Go to projects"
        });
      }

      // C. Check 2: Exited/Stopped Docker Container Dangers
      const containers = await getDockerContainers();
      const stoppedContainers = containers.filter((c) => {
        const isUp = c.status.toLowerCase().includes("up") || c.status.toLowerCase().includes("running");
        return !isUp;
      });

      for (const p of projects) {
        // Find if any assigned container is stopped
        const assignedStopped = stoppedContainers.filter(
          (c) => p.containerIds?.includes(c.name) || p.containerIds?.includes(c.id)
        );
        for (const stopped of assignedStopped) {
          generated.push({
            id: `docker-${p.id}-${stopped.id}`,
            username,
            type: "danger",
            titleES: `Contenedor detenido: ${p.name}`,
            titleEN: `Container stopped: ${p.name}`,
            descriptionES: `El contenedor '${stopped.name}' de ${p.name} figura como Exited/Stopped.`,
            descriptionEN: `Container '${stopped.name}' of ${p.name} is Exited or Stopped.`,
            href: "/dashboard/rendimiento",
            actionES: "Revisar contenedor",
            actionEN: "Review container"
          });
        }
      }

      // D. Check 3: Upcoming Deliveries Infos (within 15 days)
      const activeProjects = projects.filter((p) => p.status !== "Completado");
      const today = new Date();
      const fifteenDaysLater = new Date();
      fifteenDaysLater.setDate(today.getDate() + 15);

      for (const p of activeProjects) {
        if (p.endDate) {
          const endDate = new Date(p.endDate);
          if (!isNaN(endDate.getTime()) && endDate >= today && endDate <= fifteenDaysLater) {
            const formattedDate = endDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
            generated.push({
              id: `delivery-${p.id}`,
              username,
              type: "info",
              titleES: `Entrega cercana: ${p.name}`,
              titleEN: `Upcoming delivery: ${p.name}`,
              descriptionES: `La entrega final está pactada para el día ${formattedDate}.`,
              descriptionEN: `The final delivery is scheduled for ${formattedDate}.`,
              href: "/dashboard/proyectos",
              actionES: "Ir a proyectos",
              actionEN: "Go to projects"
            });
          }
        }
      }

      // E. Write generated notifications to SQLite
      for (const n of generated) {
        try {
          await run(
            `INSERT INTO notifications (
              id, username, type, titleES, titleEN, descriptionES, descriptionEN, href, actionES, actionEN, isRead
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [n.id, n.username, n.type, n.titleES, n.titleEN, n.descriptionES, n.descriptionEN, n.href, n.actionES, n.actionEN]
          );
        } catch (dbErr) {
          console.error("Error saving dynamic notification to DB:", dbErr);
        }
      }

      // F. Fetch updated notifications list
      userNotifications = await all<any>(
        "SELECT * FROM notifications WHERE username = ? ORDER BY id ASC",
        [username]
      );
    }

    return NextResponse.json(userNotifications);
  } catch (error: any) {
    console.error("API GET notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/notifications?id=xxx&username=email
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const username = req.nextUrl.searchParams.get("username");

    if (!id || !username) {
      return NextResponse.json({ error: "Missing id or username parameter" }, { status: 400 });
    }

    await run(
      "DELETE FROM notifications WHERE id = ? AND username = ?",
      [id, username]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
