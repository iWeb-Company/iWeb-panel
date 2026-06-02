type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300">
          {icon}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
            {title}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">{description}</p>
        </div>
      </div>

      {actions && <div className="flex gap-3">{actions}</div>}
    </header>
  );
}