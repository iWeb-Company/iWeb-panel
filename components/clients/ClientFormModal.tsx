"use client";

import { useEffect, useState } from "react";
import type { Client } from "@/types/client";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/lib/LanguageContext";

type ClientFormModalProps = {
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
};

export function ClientFormModal({
  open,
  client,
  onClose,
  onSave,
}: ClientFormModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(client?.name ?? "");
  const [responsible, setResponsible] = useState(client?.responsible ?? "");
  const [monthly, setMonthly] = useState(client?.monthly ?? "$0");
  const [product, setProduct] = useState<Client["product"]>(
    client?.product ?? "A medida"
  );
  const [status, setStatus] = useState<Client["status"]>(
    client?.status ?? "Activo"
  );
  useEffect(() => {
    setName(client?.name ?? "");
    setResponsible(client?.responsible ?? "");
    setMonthly(client?.monthly ?? "$0");
    setProduct(client?.product ?? "A medida");
    setStatus(client?.status ?? "Activo");
  }, [client, open]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newClient: Client = {
      id: client?.id ?? `CL-${Date.now()}`,
      name,
      responsible,
      monthly,
      product,
      status,
    };

    onSave(newClient);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={client ? t("editarCliente") : t("nuevoCliente")}
      description={t("datosComerciales")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
            {t("nombre")}
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
            {t("responsable")}
          </label>
          <input
            value={responsible}
            onChange={(event) => setResponsible(event.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
            {t("mensualidad")}
          </label>
          <input
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("producto")}
            </label>
            <select
              value={product}
              onChange={(event) =>
                setProduct(event.target.value as Client["product"])
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
            >
              <option>Tranett</option>
              <option>Foonett</option>
              <option value="A medida">{t("aMedida")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("estado")}
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Client["status"])
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
            >
              <option value="Activo">{t("activo")}</option>
              <option value="Inactivo">{t("inactivo")}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-zinc-300"
          >
            {t("cancelar")}
          </button>

          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black cursor-pointer"
          >
            {t("guardarCliente")}
          </button>
        </div>
      </form>
    </Modal>
  );
}