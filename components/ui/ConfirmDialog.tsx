"use client";

import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "danger",
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmStyles =
    variant === "danger"
      ? "bg-red-400 text-black hover:bg-red-300"
      : "bg-yellow-300 text-black hover:bg-yellow-200";

  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          Cancelar
        </button>

        <button
          onClick={onConfirm}
          className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${confirmStyles}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}