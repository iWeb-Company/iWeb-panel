import { Card } from "./Card";

export function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_70%)]" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {title}
          </p>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
            {icon}
          </div>
        </div>

        <h3 className="mt-6 text-3xl font-bold tracking-tight text-white">
          {value}
        </h3>

        {description && (
          <p className="mt-3 text-sm text-cyan-300/80">{description}</p>
        )}
      </div>
    </Card>
  );
}