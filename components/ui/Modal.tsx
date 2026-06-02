"use client";

type ModalProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-[620px] rounded-[24px] border border-white/10 bg-[#0B0F0F] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
              iWeb Panel
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {title}
            </h2>

            {description && (
              <p className="mt-2 text-sm text-zinc-500">{description}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}