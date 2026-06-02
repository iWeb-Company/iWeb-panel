import type { TechnicalStatus } from "@/types/performance";

export function TechnicalStatusBadge({
  status,
}: {
  status: TechnicalStatus;
}) {
  const styles: Record<TechnicalStatus, string> = {
    Running: "bg-cyan-400/15 text-cyan-300 border-cyan-400/20",
    Starting: "bg-yellow-400/15 text-yellow-300 border-yellow-400/20",
    Exited: "bg-red-400/10 text-red-300 border-red-400/20",
    Stopped: "bg-zinc-400/10 text-zinc-400 border-zinc-400/20",
  };

  return (
    <span
      className={`rounded-md border px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}