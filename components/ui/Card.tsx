export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-white/10 bg-[#0B0F0F] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </div>
  );
}