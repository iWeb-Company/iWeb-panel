import type { ProjectPriority, ProjectStatus } from "@/types/project";

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const styles: Record<ProjectPriority, string> = {
    FINALIZADO: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20",
    ALTA: "bg-red-400/10 text-red-300 border border-red-400/20",
    MEDIA: "bg-yellow-400/10 text-yellow-300 border border-yellow-400/20",
    BAJA: "bg-zinc-400/10 text-zinc-300 border border-white/5",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${
        styles[priority] || styles.BAJA
      }`}
    >
      {priority}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    Completado: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20",
    "En desarrollo": "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20",
    Pendiente: "bg-zinc-400/10 text-zinc-400 border border-white/5",
    "En revisión": "bg-violet-400/10 text-violet-300 border border-violet-400/20",
    Pausado: "bg-red-400/10 text-red-300 border border-red-400/20",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${
        styles[status] || styles.Pendiente
      }`}
    >
      {status}
    </span>
  );
}