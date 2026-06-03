"use client";

import { useState, useMemo, useEffect } from "react";
import type { Client } from "@/types/client";
import { getStoredClients, setStoredClients } from "@/lib/storage";

import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";

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

  function handleSaveClient(client: Client) {
    const exists = clients.some((item) => item.id === client.id);
    const method = exists ? "PUT" : "POST";

    fetch("/api/clients", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    })
      .then((res) => res.json())
      .then(() => {
        setClients((current) => {
          if (exists) {
            return current.map((item) => (item.id === client.id ? client : item));
          } else {
            return [client, ...current];
          }
        });
      })
      .catch((err) => console.error("Error saving client:", err));
  }

  function handleCreateClient() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function handleEditClient(client: Client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  function handleDeleteClient() {
    if (!clientToDelete) return;

    fetch(`/api/clients?id=${clientToDelete.id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setClients((current) => current.filter((client) => client.id !== clientToDelete.id));
        setClientToDelete(null);
      })
      .catch((err) => console.error("Error deleting client:", err));
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

      <section className="grid grid-cols-3 gap-5">
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
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex gap-2">
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
            className="w-[320px] rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/30"
          />
        </div>

        <ClientsTable
          clients={filteredClients}
          onEdit={handleEditClient}
          onDelete={setClientToDelete}
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

      <ConfirmDialog
        open={!!clientToDelete}
        title={t("eliminarCliente")}
        description={t("eliminarClienteDesc", { name: clientToDelete?.name ?? "" })}
        confirmLabel={t("eliminarCliente")}
        variant="danger"
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteClient}
      />
    </div>
  );
}