"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/types/project";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/lib/LanguageContext";

type ProjectFormModalProps = {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSave: (project: Project) => void;
};

interface DockerContainer {
  id: string;
  name: string;
  status: string;
}

export function ProjectFormModal({
  open,
  project,
  onClose,
  onSave,
}: ProjectFormModalProps) {
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Project["priority"]>("MEDIA");
  const [responsible, setResponsible] = useState("");
  const [category, setCategory] = useState("");
  const [cuit, setCuit] = useState("");
  const [status, setStatus] = useState<Project["status"]>("Pendiente");
  const [startDate, setStartDate] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [advancePercent, setAdvancePercent] = useState("");
  const [remainingBalance, setRemainingBalance] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [paymentUpToDate, setPaymentUpToDate] = useState<Project["paymentUpToDate"]>("SI");
  const [domain, setDomain] = useState("");
  const [debtSince, setDebtSince] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
  
  const [availableContainers, setAvailableContainers] = useState<DockerContainer[]>([]);

  // Fetch Docker containers from our VPS detection API
  useEffect(() => {
    if (open) {
      fetch("/api/docker/containers")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableContainers(data);
          }
        })
        .catch((err) => console.error("Error fetching containers:", err));
    }
  }, [open]);

  useEffect(() => {
    setName(project?.name ?? "");
    setPriority(project?.priority ?? "MEDIA");
    setResponsible(project?.responsible ?? "");
    setCategory(project?.category ?? "");
    setCuit(project?.cuit ?? "");
    setStatus(project?.status ?? "Pendiente");
    setStartDate(project?.startDate ?? "");
    setBillingDate(project?.billingDate ?? "");
    setEndDate(project?.endDate ?? "");
    setBudget(project?.budget ?? "");
    setAdvancePercent(project?.advancePercent ?? "");
    setRemainingBalance(project?.remainingBalance ?? "");
    setMaintenance(project?.maintenance ?? "");
    setPaymentUpToDate(project?.paymentUpToDate ?? "SI");
    setDomain(project?.domain ?? "");
    setDebtSince(project?.debtSince ?? "");
    setNotes(project?.notes ?? "");
    setSelectedContainers(project?.containerIds ?? []);
  }, [project, open]);

  function handleToggleContainer(containerId: string) {
    setSelectedContainers((current) =>
      current.includes(containerId)
        ? current.filter((id) => id !== containerId)
        : [...current, containerId]
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newProject: Project = {
      id: project?.id ?? `PR-${Date.now()}`,
      name,
      priority,
      responsible,
      category,
      cuit,
      status,
      startDate,
      billingDate,
      endDate,
      budget,
      advancePercent,
      remainingBalance,
      maintenance,
      paymentUpToDate,
      domain,
      debtSince,
      notes,
      containerIds: selectedContainers,
    };

    onSave(newProject);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={project ? t("guardarProyecto") : t("nuevoProyecto")}
      description={t("proyectosDesc")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto pr-2 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {t("propietario")}
            </label>
            <input
              value={responsible}
              onChange={(event) => setResponsible(event.target.value)}
              required
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("categoria")}
            </label>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="Web, E-commerce, etc."
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("prioridad")}
            </label>
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Project["priority"])
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
            >
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="ALTA">ALTA</option>
              <option value="MEDIA">MEDIA</option>
              <option value="BAJA">BAJA</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("estado")}
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Project["status"])
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
            >
              <option value="Completado">Completado</option>
              <option value="En desarrollo">En desarrollo</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En revisión">En revisión</option>
              <option value="Pausado">Pausado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("cuit")}
            </label>
            <input
              value={cuit}
              onChange={(event) => setCuit(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="30718344439"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("pagoAlDia")}
            </label>
            <select
              value={paymentUpToDate}
              onChange={(event) =>
                setPaymentUpToDate(event.target.value as Project["paymentUpToDate"])
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
            >
              <option value="SI">SI</option>
              <option value="NO">NO</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("fechaInicio")}
            </label>
            <input
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="18/03/2025"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("fechaCobro")}
            </label>
            <input
              value={billingDate}
              onChange={(event) => setBillingDate(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="Dia: 20"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("fechaFinalizacion")}
            </label>
            <input
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="18/04/2025"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("presupuesto")}
            </label>
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="$300.000"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("anticipoPago")}
            </label>
            <input
              value={advancePercent}
              onChange={(event) => setAdvancePercent(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="50%"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("saldoRestante")}
            </label>
            <input
              value={remainingBalance}
              onChange={(event) => setRemainingBalance(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="Al finalizar"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("mantencion")}
            </label>
            <input
              value={maintenance}
              onChange={(event) => setMaintenance(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="$200.000"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("dominio")}
            </label>
            <input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
              placeholder="Vence el 18/04"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
              {t("deudaDesde")}
            </label>
            <input
              value={debtSince}
              onChange={(event) => setDebtSince(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-cyan-400/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">
            {t("notas")}
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="h-20 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400/40 resize-none"
          />
        </div>

        <div>
          <label className="mb-3 block text-xs uppercase tracking-[0.25em] text-zinc-400 font-semibold">
            {t("contenedoresAsignados")}
          </label>
          {availableContainers.length === 0 ? (
            <p className="text-sm text-zinc-600">No se detectaron contenedores activos</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto border border-white/10 rounded-xl bg-black/20 p-4">
              {availableContainers.map((container) => {
                const isSelected = selectedContainers.includes(container.name) || selectedContainers.includes(container.id);
                return (
                  <label
                    key={container.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleContainer(container.name)}
                      className="rounded border-white/20 text-cyan-400 focus:ring-0 focus:ring-offset-0 accent-cyan-400"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-white">{container.name}</p>
                      <p className="text-zinc-600">{container.status}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
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
            {t("guardarProyecto")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
