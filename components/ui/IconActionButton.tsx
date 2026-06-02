"use client";

type IconActionButtonProps = {
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "danger";
  onClick?: () => void;
};

export function IconActionButton({
  label,
  icon,
  variant = "default",
  onClick,
}: IconActionButtonProps) {
  const styles = {
    default: "text-cyan-300 hover:border-cyan-400/30 hover:bg-cyan-400/10",
    warning: "text-yellow-300 hover:border-yellow-400/30 hover:bg-yellow-400/10",
    danger: "text-red-300 hover:border-red-400/30 hover:bg-red-400/10",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition ${styles[variant]}`}
    >
      {icon}
    </button>
  );
}