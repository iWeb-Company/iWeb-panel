"use client";

import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  AnalyticsIcon,
  ShieldCheckIcon,
  TrendUpIcon,
  UsersIcon,
  FolderIcon,
  RetentionIcon,
} from "@/components/icons/SidebarIcons";
import { useLanguage } from "@/lib/LanguageContext";
import { getStoredClients, getStoredProjects } from "@/lib/storage";
import type { Client } from "@/types/client";
import type { Project } from "@/types/project";

type Currency = "ARS" | "USD";

export default function AnaliticasPage() {
  const [currency, setCurrency] = useState<Currency>("ARS");
  const [viewMode, setViewMode] = useState<"mensual" | "anual">("anual");
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const { t } = useLanguage();

  useEffect(() => {
    setClients(getStoredClients());
    setProjects(getStoredProjects());
  }, []);

  const totalBilling = useMemo(() => {
    return clients.reduce((sum, client) => {
      if (client.status !== "Activo") return sum;
      const cleanVal = client.monthly.replace(/[^0-9]/g, "");
      return sum + (parseFloat(cleanVal) || 0);
    }, 0);
  }, [clients]);

  const revenue = useMemo(() => {
    if (currency === "ARS") {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(totalBilling);
    } else {
      // conversion rate 1000 ARS = 1 USD
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Math.round(totalBilling / 1000));
    }
  }, [totalBilling, currency]);

  const chartData = useMemo(() => {
    if (totalBilling === 0) {
      return viewMode === "mensual" ? [0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    if (viewMode === "mensual") {
      // 4 weeks of monthly view scaling with billing
      return [
        Math.min(250, Math.round(totalBilling * 0.0001)),
        Math.min(250, Math.round(totalBilling * 0.00015)),
        Math.min(250, Math.round(totalBilling * 0.00012)),
        Math.min(250, Math.round(totalBilling * 0.00018)),
      ];
    } else {
      // 12 months of annual view scaling
      const base = Math.min(150, Math.round(totalBilling * 0.0001));
      return [
        Math.round(base * 0.2),
        Math.round(base * 0.3),
        Math.round(base * 0.25),
        Math.round(base * 0.4),
        Math.round(base * 0.35),
        Math.round(base * 0.5),
        Math.round(base * 0.55),
        Math.round(base * 0.7),
        Math.round(base * 0.75),
        Math.round(base * 0.85),
        Math.round(base * 0.8),
        base
      ];
    }
  }, [viewMode, totalBilling]);

  const activeClientsCount = useMemo(() => {
    return clients.filter((c) => c.status === "Activo").length;
  }, [clients]);

  const activeProjectsCount = useMemo(() => {
    return projects.filter((p) => p.status !== "Completado").length;
  }, [projects]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("panelInterno")}
        title={t("analiticas")}
        description={t("descGeneralOps")}
        icon={<AnalyticsIcon className="h-5 w-5" />}
      />

      <section className="grid grid-cols-[1.65fr_1fr] items-stretch gap-5">
        <Card className="flex min-h-[360px] flex-col justify-between overflow-hidden bg-[#1D2A2B]/80 p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                {t("ingresosEstimados")}
              </p>

              <div className="mt-5 flex items-end gap-4">
                <h2 className="text-6xl font-bold tracking-tight text-white">
                  {revenue}
                </h2>

                <span className="mb-3 text-sm uppercase tracking-widest text-zinc-500">
                  {currency}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/45 p-1">
              <button
                onClick={() => setCurrency("ARS")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  currency === "ARS"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🇦🇷 ARS
              </button>

              <button
                onClick={() => setCurrency("USD")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  currency === "USD"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                USD
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex -space-x-3">
              <div className="h-11 w-11 rounded-full border-2 border-[#1D2A2B] bg-zinc-700" />
              <div className="h-11 w-11 rounded-full border-2 border-[#1D2A2B] bg-zinc-600" />
              <div className="h-11 w-11 rounded-full border-2 border-[#1D2A2B] bg-zinc-500" />
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#1D2A2B] bg-black text-xs font-semibold text-white">
                +{activeClientsCount > 3 ? activeClientsCount - 3 : 0}
              </div>
            </div>

            <p className="max-w-md text-sm italic leading-6 text-zinc-400">
              {t("proyeccionContratos", { contracts: activeClientsCount, newAcq: activeClientsCount > 0 ? 1 : 0 })}
            </p>
          </div>
        </Card>

        <div className="grid gap-5">
          <StatCard
            title={t("previsionCrecimiento")}
            value={activeClientsCount > 0 ? "+24.8%" : "+0.0%"}
            description={t("tendenciaPositiva")}
            icon={<TrendUpIcon className="h-5 w-5" />}
          />

          <StatCard
            title={t("evaluacionRiesgos")}
            value={activeClientsCount > 0 ? t("bajo") : "N/A"}
            description={t("operacionEstable")}
            icon={<ShieldCheckIcon className="h-5 w-5" />}
          />
        </div>
      </section>

      <Card className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("crecimientoIngresos")}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {t("rendimientoAcumulado")}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("mensual")}
              className={`rounded-2xl px-4 py-2 text-xs transition cursor-pointer ${
                viewMode === "mensual"
                  ? "bg-cyan-400 font-bold text-black shadow-[0_0_28px_rgba(0,221,235,0.18)]"
                  : "bg-white/[0.08] text-zinc-300 hover:bg-white/[0.12]"
              }`}
            >
              {t("vistaMensual")}
            </button>

            <button
              onClick={() => setViewMode("anual")}
              className={`rounded-2xl px-4 py-2 text-xs transition cursor-pointer ${
                viewMode === "anual"
                  ? "bg-cyan-400 font-bold text-black shadow-[0_0_28px_rgba(0,221,235,0.18)]"
                  : "bg-white/[0.08] text-zinc-300 hover:bg-white/[0.12]"
              }`}
            >
              {t("vistaAnual")}
            </button>
          </div>
        </div>

        <div className="flex h-[280px] items-end gap-3 border-b border-l border-white/10 p-4">
          {chartData.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t bg-cyan-400/50 transition-all duration-500"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </Card>

      <section className="grid grid-cols-4 gap-5">
        <StatCard
          title={t("clientesActivos")}
          value={String(activeClientsCount)}
          description={activeClientsCount > 0 ? "+12%" : "0%"}
          icon={<UsersIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("proyectosActivos")}
          value={String(activeProjectsCount)}
          description={activeProjectsCount > 0 ? t("estable") : "-"}
          icon={<FolderIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("crecimientoMensual")}
          value={activeClientsCount > 0 ? "18.4%" : "0.0%"}
          description={activeClientsCount > 0 ? "+4%" : "0%"}
          icon={<TrendUpIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("tasaRetencion")}
          value={activeClientsCount > 0 ? "99.2%" : "-"}
          description={activeClientsCount > 0 ? t("alta") : "-"}
          icon={<RetentionIcon className="h-5 w-5" />}
        />
      </section>
    </div>
  );
}