"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";

interface AnalysisResult {
  score: number;
  problemas: string[];
  oportunidades: string[];
  software_sugerido: string[];
  emailDraft?: string;
}

interface Lead {
  name: string;
  web: string;
  email: string;
  phone: string;
  category: string;
  description: string;
  date: string;
  analysis: AnalysisResult;
}

interface Report {
  date: string;
  fileName: string;
  content: string;
}

interface HealthStatus {
  status: string;
  configuration: {
    gemini: string;
    resend: string;
    cronSchedule: string;
  };
}

export default function MarketingPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"leads" | "reports" | "logs">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<string>("Cargando logs...");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [manualCategory, setManualCategory] = useState<string>("");
  const [analyzingLeadWeb, setAnalyzingLeadWeb] = useState<string | null>(null);

  // Selected details (modal side drawer)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchLeads();
    fetchReports();
    fetchLogs();
    checkRunningState();
    fetchHealth();
  }, []);

  // Daemon running polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        checkRunningState();
        fetchLogs();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Scroll to bottom in logs console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const text = await res.text();
        setLogs(text);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  const checkRunningState = async () => {
    try {
      const res = await fetch("/api/run");
      if (res.ok) {
        const data = await res.json();
        if (isRunning && !data.isRunning) {
          fetchLeads();
          fetchReports();
        }
        setIsRunning(data.isRunning);
      }
    } catch (err) {
      console.error("Error checking run state:", err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error("Error fetching health status:", err);
    }
  };

  const triggerRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    const categoryLog = manualCategory.trim()
      ? `para el rubro "${manualCategory.trim()}"`
      : "con rotación automática";
    setLogs((prev) => prev + `\n[SISTEMA] Iniciando agente en segundo plano ${categoryLog}...\n`);
    setActiveTab("logs");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category: manualCategory.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al iniciar el agente.");
        setIsRunning(false);
      } else {
        setManualCategory("");
      }
    } catch (err) {
      console.error("Error triggering run:", err);
      setIsRunning(false);
    }
  };

  const handleManualAnalyze = async (lead: Lead) => {
    if (analyzingLeadWeb) return;
    setAnalyzingLeadWeb(lead.web);
    try {
      const res = await fetch("/api/leads/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lead),
      });

      if (res.ok) {
        const updatedLead = await res.json();

        // Update local list
        setLeads((prevLeads) =>
          prevLeads.map((l) => (l.web === lead.web ? updatedLead : l))
        );

        // Update drawer selected lead if matching
        setSelectedLead((prev) => (prev && prev.web === lead.web ? updatedLead : prev));

        alert(`¡Auditoría y borrador de propuesta generados con éxito para ${lead.name}!`);
      } else {
        const errorData = await res.json();
        alert(`Error al analizar: ${errorData.message || "Error desconocido"}`);
      }
    } catch (err) {
      console.error("Error in manual analyze:", err);
      alert("Error de red al intentar analizar el lead.");
    } finally {
      setAnalyzingLeadWeb(null);
    }
  };

  // KPI Calculations
  const highPriorityCount = useMemo(
    () => leads.filter((l) => (l.analysis?.score || 0) >= 70).length,
    [leads]
  );
  
  const avgScore = useMemo(
    () =>
      leads.length > 0
        ? Math.round(
            leads.reduce((acc, curr) => acc + (curr.analysis?.score || 0), 0) / leads.length
          )
        : 0,
    [leads]
  );

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        eyebrow={t("marketing")}
        title="Marketing Autónomo"
        description="Generación y auditoría automática de leads e identificación de oportunidades de software."
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M11 5L6 9H2V15H6L11 19V5Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15.5 8.5c1.3 1.3 1.3 2.7 0 4M19 6c2.5 2.5 2.5 6.5 0 9"
            />
          </svg>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {health && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider ${
                    health.configuration.gemini === "configured"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  Gemini
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider ${
                    health.configuration.resend === "configured"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  Resend
                </span>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Rubro manual (vacío = rotativo)..."
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                disabled={isRunning}
                className="w-[200px] rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/30"
              />
              <button
                onClick={triggerRun}
                disabled={isRunning}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-black shadow-[0_0_28px_rgba(0,221,235,0.18)] transition hover:bg-cyan-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? "Buscando..." : manualCategory.trim() ? `Buscar "${manualCategory.trim()}"` : "Ejecutar Rotativo"}
              </button>
            </div>
          </div>
        }
      />

      {/* KPI METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Leads Encontrados"
          value={leads.length}
          description="Almacenados localmente"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Alta Prioridad (Score ≥ 70)"
          value={highPriorityCount}
          description="Oportunidades calientes"
          icon={
            <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          title="Score de Interés Promedio"
          value={`${avgScore}/100`}
          description="Potencial tecnológico"
          icon={
            <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          }
        />
        <StatCard
          title="Reportes Generados"
          value={reports.length}
          description="Enviados por email"
          icon={
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </section>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-5 py-3 text-sm font-semibold transition cursor-pointer border-b-2 ${
            activeTab === "leads"
              ? "border-cyan-400 text-cyan-300 bg-cyan-400/[0.02]"
              : "border-transparent text-zinc-500 hover:text-white"
          }`}
        >
          📋 Leads y Oportunidades ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-5 py-3 text-sm font-semibold transition cursor-pointer border-b-2 ${
            activeTab === "reports"
              ? "border-cyan-400 text-cyan-300 bg-cyan-400/[0.02]"
              : "border-transparent text-zinc-500 hover:text-white"
          }`}
        >
          📊 Reportes Diarios ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-5 py-3 text-sm font-semibold transition cursor-pointer border-b-2 ${
            activeTab === "logs"
              ? "border-cyan-400 text-cyan-300 bg-cyan-400/[0.02]"
              : "border-transparent text-zinc-500 hover:text-white"
          }`}
        >
          ⚙️ Consola de Logs {isRunning && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
        </button>
      </div>

      {/* TAB CONTENT: LEADS */}
      {activeTab === "leads" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="pb-4 pr-4 font-semibold whitespace-nowrap">Empresa</th>
                  <th className="pb-4 pr-4 font-semibold whitespace-nowrap">Categoría</th>
                  <th className="pb-4 pr-4 font-semibold whitespace-nowrap">Sitio Web</th>
                  <th className="pb-4 pr-4 font-semibold whitespace-nowrap">Email</th>
                  <th className="pb-4 pr-4 font-semibold whitespace-nowrap">Fecha de Hallazgo</th>
                  <th className="pb-4 pr-4 font-semibold text-center whitespace-nowrap">Score</th>
                  <th className="pb-4 pr-4 font-semibold text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.length > 0 ? (
                  leads.map((lead, idx) => {
                    const score = lead.analysis?.score || 0;
                    const isHigh = score >= 70;
                    const isMid = score >= 40 && score < 70;

                    return (
                      <tr key={idx} className="group hover:bg-white/[0.01]">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-white whitespace-nowrap">{lead.name}</div>
                          <div className="max-w-[280px] truncate text-xs text-zinc-500">
                            {lead.description}
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-zinc-300 whitespace-nowrap">{lead.category}</td>
                        <td className="py-4 pr-4 whitespace-nowrap">
                          <a
                            href={lead.web}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                          >
                            🔗 {lead.web.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                          </a>
                        </td>
                        <td className="py-4 pr-4 text-zinc-300 whitespace-nowrap">
                          {lead.email ? (
                            lead.email
                          ) : (
                            <span className="italic text-zinc-600">Sin email</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-zinc-500 whitespace-nowrap">{lead.date}</td>
                        <td className="py-4 pr-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                              isHigh
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : isMid
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {score}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08] cursor-pointer"
                            >
                              🔍 {lead.analysis ? "Ver Análisis" : "Detalles"}
                            </button>
                            {!lead.analysis && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManualAnalyze(lead);
                                }}
                                disabled={analyzingLeadWeb === lead.web}
                                className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-cyan-300 cursor-pointer disabled:opacity-50"
                              >
                                {analyzingLeadWeb === lead.web ? "..." : "⚡ Analizar"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      No se han descubierto leads en el sistema local aún. Ejecuta una búsqueda para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: REPORTS */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Reports */}
          <div className="space-y-3">
            {reports.length > 0 ? (
              reports.map((report, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedReport(report)}
                  className={`rounded-2xl border p-4 cursor-pointer transition ${
                    selectedReport?.fileName === report.fileName
                      ? "border-cyan-400/30 bg-cyan-400/[0.04] text-cyan-200"
                      : "border-white/10 bg-[#0B0F0F] hover:border-white/20 text-zinc-400 hover:text-white"
                  }`}
                >
                  <p className="font-bold text-sm">📅 Reporte {report.date}</p>
                  <p className="mt-1 text-xs text-zinc-500 font-mono">{report.fileName}</p>
                </div>
              ))
            ) : (
              <Card>
                <p className="text-center text-zinc-500 py-6">No hay reportes disponibles.</p>
              </Card>
            )}
          </div>

          {/* Report Viewer */}
          <div className="lg:col-span-2">
            <Card className="min-h-[400px] flex flex-col justify-between">
              {selectedReport ? (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <h2 className="text-lg font-bold text-white">Reporte de Oportunidades ({selectedReport.date})</h2>
                    <span className="rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 text-xs font-mono">
                      {selectedReport.fileName}
                    </span>
                  </div>
                  <pre className="max-h-[500px] overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.content}
                  </pre>
                </div>
              ) : (
                <div className="flex h-full min-h-[350px] items-center justify-center text-zinc-500">
                  Selecciona un reporte de la lista para visualizar su contenido Markdown.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOGS */}
      {activeTab === "logs" && (
        <Card>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <span className="text-sm text-zinc-400">
              Consola del Demonio de Logs (últimos sucesos en vivo)
            </span>
            <button
              onClick={fetchLogs}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.08] cursor-pointer"
            >
              🔄 Refrescar Logs
            </button>
          </div>
          <div className="max-h-[500px] overflow-y-auto rounded-xl border border-white/5 bg-black/60 p-4 font-mono text-[11px] text-emerald-400/90 whitespace-pre leading-relaxed select-text shadow-inner">
            {logs}
            <div ref={consoleEndRef} />
          </div>
        </Card>
      )}

      {/* LEAD DETAILS DRAWER MODAL */}
      {selectedLead && (
        <div
          onClick={() => setSelectedLead(null)}
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[600px] h-full bg-[#0B0F0F] border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto shadow-[0_0_80px_rgba(0,0,0,0.5)] select-text"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <h2 className="text-lg font-bold text-white">Análisis Tecnológico iWEB</h2>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Title Info */}
              <h3 className="text-2xl font-bold text-white">{selectedLead.name}</h3>
              <p className="mt-1 text-sm text-cyan-400 font-semibold">
                Sitio Web:{" "}
                <a
                  href={selectedLead.web}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {selectedLead.web}
                </a>
              </p>

              {/* Detailed Content */}
              {!selectedLead.analysis ? (
                <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
                  <p className="font-bold text-white mb-2 flex items-center gap-2">
                    ⚠️ Lead sin analizar
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Este prospecto ha sido descubierto, pero aún no se ha realizado la auditoría de
                    su sitio web ni el análisis de IA.
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Puedes procesarlo ahora mismo para generar su score, problemas, oportunidades y
                    borrador de correo de venta con IA:
                  </p>
                  <button
                    onClick={() => handleManualAnalyze(selectedLead)}
                    disabled={analyzingLeadWeb === selectedLead.web}
                    className="mt-4 w-full rounded-xl bg-cyan-400 py-3 text-xs font-bold text-black transition hover:bg-cyan-300 cursor-pointer disabled:opacity-50"
                  >
                    {analyzingLeadWeb === selectedLead.web
                      ? "⏳ Analizando sitio web con IA..."
                      : "⚡ Generar Propuesta y Auditoría con IA"}
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {/* Score box */}
                  <div className="flex items-center gap-4 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
                    <div
                      className={`text-2xl font-black ${
                        selectedLead.analysis.score >= 70
                          ? "text-rose-400"
                          : selectedLead.analysis.score >= 40
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedLead.analysis.score}/100
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      {selectedLead.analysis.score >= 70
                        ? "Oportunidad Excelente: Presencia digital precaria o procesos altamente manuales detectados."
                        : selectedLead.analysis.score >= 40
                        ? "Oportunidad Interesante: Posee digitalización base, pero requiere mejoras/automatizaciones."
                        : "Madurez digital óptima: Ya posee sistemas avanzados, potencial de ventas bajo."}
                    </div>
                  </div>

                  {/* Operative Problems */}
                  <div>
                    <h4 className="text-sm font-bold text-rose-400 mb-2">
                      ⚠️ Problemas Operativos Detectados
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1.5 leading-relaxed">
                      {selectedLead.analysis.problemas.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 mb-2">
                      ⚡ Oportunidades de Digitalización
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1.5 leading-relaxed">
                      {selectedLead.analysis.oportunidades.map((o, idx) => (
                        <li key={idx}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Software suggestion */}
                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-sm font-bold text-blue-400 mb-2">
                      🛠️ Software Propuesto por iWEB
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-blue-300 font-semibold space-y-1.5 leading-relaxed">
                      {selectedLead.analysis.software_sugerido.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* IA Email Draft */}
                  {selectedLead.analysis.emailDraft && (
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-violet-400">
                          ✉️ Borrador de Email de Venta
                        </h4>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedLead.analysis.emailDraft || "");
                            alert("¡Borrador copiado al portapapeles!");
                          }}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-300 hover:text-white transition cursor-pointer"
                        >
                          📋 Copiar Borrador
                        </button>
                      </div>
                      <pre className="max-h-[200px] overflow-y-auto rounded-lg border border-white/5 bg-black/40 p-3 font-sans text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        {selectedLead.analysis.emailDraft}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 border-t border-white/10 pt-4 flex gap-3">
              {selectedLead.email && (
                <a
                  href={`mailto:${selectedLead.email}?subject=Propuesta de digitalización personalizada - iWEB`}
                  className="flex-1 rounded-xl bg-cyan-400 py-3 text-center text-xs font-bold text-black transition hover:bg-cyan-300 cursor-pointer"
                >
                  ✉️ Enviar Propuesta Directa
                </a>
              )}
              <button
                onClick={() => setSelectedLead(null)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-center text-xs text-zinc-300 transition hover:bg-white/[0.08] cursor-pointer"
              >
                Cerrar Análisis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
