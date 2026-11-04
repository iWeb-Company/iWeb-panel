"use client";

import { useState, useMemo, useEffect } from "react";
import type { Client, ProvisioningResult } from "@/types/client";
import { getStoredClients, setStoredClients } from "@/lib/storage";

import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";

import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ProvisioningSummaryModal } from "@/components/clients/ProvisioningSummaryModal";

import {
  ClientsIcon,
  CreditCardIcon,
  TrendUpIcon,
  UsersIcon,
} from "@/components/icons/SidebarIcons";

import { clients as initialClients } from "@/data/clients";
import { useLanguage } from "@/lib/LanguageContext";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletePhase, setDeletePhase] = useState<"preview" | "backup">("preview");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deletePreview, setDeletePreview] = useState<{ tenant: { id: string; name: string; slug: string }; tables: Record<string, number>; files: number; snapshot: string } | null>(null);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [reconcileClient, setReconcileClient] = useState<Client | null>(null);
  const [reconcileCandidate, setReconcileCandidate] = useState<{ id: string; name: string; slug: string; cuit: string | number } | null>(null);
  const [reconcileError, setReconcileError] = useState("");
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const { t, language } = useLanguage();

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch((err) => console.error("Error fetching clients:", err));
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.slug && client.slug.toLowerCase().includes(searchTerm.toLowerCase())) ||
        client.responsible.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter =
        selectedFilter === "Todos" || client.product === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, selectedFilter]);

  // Dynamically compute the product filters from the active clients list
  const availableFilters = useMemo(() => {
    const products = new Set<string>();
    clients.forEach((client) => {
      if (client.product) {
        products.add(client.product);
      }
    });
    return ["Todos", ...Array.from(products)];
  }, [clients]);

  const activeClientsCount = useMemo(() => {
    return clients.filter((c) => c.status === "Activo").length;
  }, [clients]);

  const estimatedBillingStr = useMemo(() => {
    const total = clients.reduce((sum, client) => {
      if (client.status !== "Activo") return sum;
      const cleanVal = client.monthly.replace(/[^0-9]/g, "");
      return sum + (parseFloat(cleanVal) || 0);
    }, 0);
    return new Intl.NumberFormat(language === "ES" ? "es-AR" : "en-US", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(total);
  }, [clients, language]);

  function handleSaveClient(savedClient: Client, provisioning?: ProvisioningResult) {
    setClients((current) => {
      const exists = current.some((item) => item.id === savedClient.id);
      if (exists) {
        return current.map((item) => (item.id === savedClient.id ? savedClient : item));
      } else {
        return [savedClient, ...current];
      }
    });

    if (provisioning) {
      setProvisioningResult(provisioning);
    }
  }


  function handleCreateClient() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function handleEditClient(client: Client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  async function handleReconcile(client: Client) {
    setReconcileClient(client); setReconcileCandidate(null); setReconcileError(""); setReconcileBusy(true);
    try {
      const res = await fetch(`/api/clients/reconcile?id=${encodeURIComponent(client.id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se encontró una coincidencia");
      setReconcileCandidate(data.tenant);
    } catch (err) { setReconcileError(err instanceof Error ? err.message : "No se pudo buscar el tenant"); }
    finally { setReconcileBusy(false); }
  }
  async function confirmReconcile() {
    if (!reconcileClient || !reconcileCandidate) return;
    setReconcileBusy(true); setReconcileError("");
    try {
      const res = await fetch("/api/clients/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: reconcileClient.id, tenant_id: reconcileCandidate.id }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo vincular");
      const updated = await fetch("/api/clients"); const rows = await updated.json(); if (!updated.ok || !Array.isArray(rows)) throw new Error("El vínculo se actualizó, pero no se pudo refrescar la lista");
      setClients(rows); setReconcileClient(null);
    } catch (err) { setReconcileError(err instanceof Error ? err.message : "No se pudo vincular"); }
    finally { setReconcileBusy(false); }
  }

  async function beginDelete(client: Client) {
    setClientToDelete(client); setDeleteError(""); setDeletePhase("preview"); setDeletePreview(null); setBackupDownloaded(false);
    if (client.product !== "Tranett") return;
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/clients/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: client.id, action: "preview" }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo revisar el tenant");
      setDeletePreview(data);
    } catch (err) { setDeleteError(err instanceof Error ? err.message : "No se pudo revisar el tenant"); }
    finally { setDeleteBusy(false); }
  }
  async function downloadTenantBackup() {
    if (!clientToDelete || !deletePreview) return;
    setDeleteBusy(true); setDeleteError("");
    try {
      const res = await fetch("/api/clients/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientToDelete.id, action: "backup", snapshot: deletePreview.snapshot }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "No se pudo generar el respaldo"); }
      const blob = await res.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `tenant-${clientToDelete.id}.zip`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); setBackupDownloaded(true);
    } catch (err) { setDeleteError(err instanceof Error ? err.message : "No se pudo generar el respaldo"); }
    finally { setDeleteBusy(false); }
  }
  async function unlinkMissingTenant() {
    if (!clientToDelete || !window.confirm("¿Eliminar solo este registro del panel? Si existe otro tenant en Tranett con un ID distinto, permanecerá intacto.")) return;
    setDeleteBusy(true); setDeleteError("");
    try {
      const res = await fetch("/api/clients/unlink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientToDelete.id, confirm: true }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo eliminar el registro");
      setClients(current => current.filter(client => client.id !== clientToDelete.id)); setClientToDelete(null);
    } catch (err) { setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar el registro"); }
    finally { setDeleteBusy(false); }
  }

  async function confirmTenantDelete() {
    if (!clientToDelete || !deletePreview) return;
    setDeleteBusy(true); setDeleteError("");
    try {
      const res = await fetch("/api/clients/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientToDelete.id, action: "delete", snapshot: deletePreview.snapshot, confirm: true }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo eliminar el tenant");
      setClients(current => current.filter(client => client.id !== clientToDelete.id)); setClientToDelete(null);
      if (data.warning) window.alert(data.warning);
    } catch (err) { setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar el tenant"); }
    finally { setDeleteBusy(false); }
  }

  async function handleDeleteClient() {
    if (!clientToDelete) return;
    setDeleteError("");
    try {
      const res = await fetch(`/api/clients?id=${encodeURIComponent(clientToDelete.id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar el cliente");
      setClients((current) => current.filter((client) => client.id !== clientToDelete.id));
      setClientToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar el cliente");
    }
  }

  function handleExportClients() {
    if (clients.length === 0) return;
    const headers = ["ID", "Nombre", "Responsable", "Mensualidad", "Producto", "Estado"];
    const rows = clients.map((c) => [
      c.id,
      c.name,
      c.responsible,
      c.monthly,
      c.product,
      c.status,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clientes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("adminComercial")}
        title={t("gestionClientes")}
        description={t("clientesDesc")}
        icon={<ClientsIcon className="h-5 w-5" />}
        actions={
          <>
            <button
              onClick={handleExportClients}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white cursor-pointer"
            >
              {t("exportarDatos")}
            </button>

            <button
              onClick={handleCreateClient}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black shadow-[0_0_28px_rgba(0,221,235,0.18)] transition hover:bg-cyan-300 cursor-pointer"
            >
              {t("nuevoCliente")}
            </button>
          </>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title={t("totalClientes")}
          value={clients.length}
          description={`+12% ${t("vsPreviousMonth")}`}
          icon={<UsersIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("clientesActivos")}
          value={String(activeClientsCount)}
          description={`${activeClientsCount} ${t("activo")}`}
          icon={<TrendUpIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("facturacionEstimada")}
          value={estimatedBillingStr}
          description={t("estePeriodo")}
          icon={<CreditCardIcon className="h-5 w-5" />}
        />
      </section>

      <Card>
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {availableFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition cursor-pointer ${
                  filter === selectedFilter
                    ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent"
                }`}
              >
                {filter === "Todos" ? t("todos") : filter === "A medida" ? t("aMedida") : filter}
              </button>
            ))}
          </div>

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("buscarNombreId")}
            className="w-full md:w-[320px] rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/30"
          />
        </div>

        <ClientsTable
          clients={filteredClients}
          onEdit={handleEditClient}
          onDelete={beginDelete}
          onReconcile={handleReconcile}
        />

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>{t("mostrandoClientes", { count: filteredClients.length })}</span>

          <div className="flex gap-2">
            <button className="rounded-lg bg-white/5 px-3 py-2">‹</button>
            <button className="rounded-lg bg-white/5 px-3 py-2">›</button>
          </div>
        </div>
      </Card>

      <ClientFormModal
        open={formOpen}
        client={editingClient}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveClient}
      />

      <ProvisioningSummaryModal
        open={!!provisioningResult}
        result={provisioningResult}
        onClose={() => setProvisioningResult(null)}
      />

      <Modal open={!!reconcileClient} title="Revisar vínculo con Tranett" onClose={() => setReconcileClient(null)}>
        {reconcileBusy && <p className="text-sm text-zinc-400">Consultando Tranett…</p>}
        {reconcileError && <p role="alert" className="mb-4 text-sm text-red-300">{reconcileError}</p>}
        {reconcileCandidate && <div className="space-y-4 text-sm text-zinc-300"><p>El vínculo anterior ya no existe. Se encontró un tenant con el mismo CUIT y subdominio:</p><div className="rounded-xl border border-white/10 p-4"><p><strong>Nombre:</strong> {reconcileCandidate.name}</p><p><strong>Subdominio:</strong> {reconcileCandidate.slug}</p><p><strong>CUIT:</strong> {reconcileCandidate.cuit}</p><p className="break-all text-xs text-zinc-500">ID nuevo: {reconcileCandidate.id}</p></div><p>¿Querés vincularlo con {reconcileClient?.name}?</p><div className="flex gap-2"><button type="button" disabled={reconcileBusy} className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-black disabled:opacity-50" onClick={confirmReconcile}>Confirmar vínculo</button><button type="button" className="rounded-xl border border-white/10 px-4 py-2" onClick={() => setReconcileClient(null)}>Cancelar</button></div></div>}
      </Modal>
      <Modal open={!!clientToDelete && clientToDelete.product === "Tranett"} title={deletePhase === "preview" ? "¿Estás seguro que querés eliminar el tenant con esos datos?" : "Recordá hacer un backup de los datos"} onClose={() => { if (!deleteBusy) setClientToDelete(null); }}>
        {deleteBusy && <p className="mb-3 text-sm text-zinc-400">Procesando…</p>}
        {deleteError && <p role="alert" className="mb-3 text-sm text-red-300">{deleteError}</p>}
        {deletePhase === "preview" && deletePreview && <div className="space-y-4 text-sm text-zinc-300"><p>Se eliminarán los registros y archivos de <strong>{deletePreview.tenant.name}</strong> ({deletePreview.tenant.slug}).</p><ul className="space-y-1 rounded-xl border border-white/10 p-4">{Object.entries(deletePreview.tables).map(([table, count]) => <li key={table}>{table}: {count}</li>)}<li>Archivos: {deletePreview.files}</li></ul><div className="flex gap-2"><button type="button" disabled={deleteBusy} className="rounded-xl bg-red-400 px-4 py-2 font-semibold text-black disabled:opacity-50" onClick={() => setDeletePhase("backup")}>Sí, continuar</button><button type="button" className="rounded-xl border border-white/10 px-4 py-2" onClick={() => setClientToDelete(null)}>Cancelar</button></div></div>}
        {deletePhase === "preview" && deleteError && clientToDelete && <div className="flex flex-wrap gap-4"><button type="button" className="text-sm text-cyan-300 underline" onClick={() => { const client = clientToDelete; setClientToDelete(null); void handleReconcile(client); }}>Revisar vínculo con Tranett</button><button type="button" disabled={deleteBusy} className="text-sm text-zinc-300 underline" onClick={unlinkMissingTenant}>Eliminar solo del panel</button></div>}
        {deletePhase === "backup" && deleteError && clientToDelete && <button type="button" disabled={deleteBusy} className="mb-3 text-sm text-cyan-300 underline" onClick={() => { if (clientToDelete) void beginDelete(clientToDelete); }}>Volver a revisar los datos</button>}
        {deletePhase === "backup" && deletePreview && <div className="space-y-4 text-sm text-zinc-300"><p>El respaldo ZIP incluye los datos de la base y los archivos del tenant. Detené la actividad del tenant mientras realizás el respaldo y la eliminación. Los cambios posteriores invalidan esta revisión.</p><button type="button" disabled={deleteBusy} className="rounded-xl border border-cyan-400/30 px-4 py-2 text-cyan-300 disabled:opacity-50" onClick={downloadTenantBackup}>{backupDownloaded ? "Descargar backup otra vez" : "Descargar backup"}</button><div className="flex flex-wrap gap-2"><button type="button" disabled={deleteBusy} className="rounded-xl bg-red-400 px-4 py-2 font-semibold text-black disabled:opacity-50" onClick={confirmTenantDelete}>Eliminar definitivamente</button><button type="button" disabled={deleteBusy} className="rounded-xl border border-white/10 px-4 py-2" onClick={() => setClientToDelete(null)}>Cancelar</button></div></div>}
      </Modal>
      <ConfirmDialog
        open={!!clientToDelete && clientToDelete.product !== "Tranett"}
        title={t("eliminarCliente")}
        description={deleteError || t("eliminarClienteDesc", { name: clientToDelete?.name ?? "" })}
        confirmLabel={t("eliminarCliente")}
        variant="danger"
        onClose={() => { setClientToDelete(null); setDeleteError(""); }}
        onConfirm={handleDeleteClient}
      />
    </div>
  );
}