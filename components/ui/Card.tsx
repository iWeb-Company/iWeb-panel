export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.09] bg-[#0B1010] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}