"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import type { Project } from "@/types/project";
import { getStoredProjects, setStoredProjects } from "@/lib/storage";

import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { useLanguage } from "@/lib/LanguageContext";

import {
  CalendarIcon,
  FolderIcon,
  ProjectsIcon,
  TrendUpIcon,
} from "@/components/icons/SidebarIcons";

import {
  projects as initialProjects,
  deliveries as initialDeliveries,
} from "@/data/projects";

export default function ProyectosPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");

  // Load from local storage on mount
  useEffect(() => {
    const stored = getStoredProjects();
    if (stored && stored.length > 0) {
      setProjects(stored);
    } else {
      // Seed with initial projects if empty
      setStoredProjects(initialProjects);
      setProjects(initialProjects);
    }
  }, []);

  // Filter projects by search term and selected status
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.notes && project.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.domain && project.domain.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = false;
      if (selectedFilter === "Todos") {
        matchesFilter = true;
      } else {
        matchesFilter = project.status === selectedFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [projects, searchTerm, selectedFilter]);

  // Dynamic calculations for Stat Cards
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status !== "Completado").length;
    const enDesarrollo = projects.filter((p) => p.status === "En desarrollo").length;
    const completados = projects.filter((p) => p.status === "Completado").length;
    const deudas = projects.filter((p) => p.paymentUpToDate === "NO" || p.debtSince).length;

    return {
      active,
      enDesarrollo,
      completados,
      deudas,
    };
  }, [projects]);

  // Dynamic calculations for General Status (percentage bars)
  const generalStatusStats = useMemo(() => {
    const total = projects.length || 1; // avoid division by zero
    const dev = projects.filter((p) => p.status === "En desarrollo").length;
    const comp = projects.filter((p) => p.status === "Completado").length;
    const pendingOrOther = projects.filter(
      (p) => p.status !== "En desarrollo" && p.status !== "Completado"
    ).length;

    return [
      {
        label: t("En desarrollo"),
        value: Math.round((dev / total) * 100),
      },
      {
        label: t("Completado"),
        value: Math.round((comp / total) * 100),
      },
      {
        label: t("Pendiente"),
        value: Math.round((pendingOrOther / total) * 100),
      },
    ];
  }, [projects, t]);

  function handleCreateProject() {
    setProjectToEdit(null);
    setIsFormOpen(true);
  }

  function handleEditProject(project: Project) {
    setProjectToEdit(project);
    setIsFormOpen(true);
  }

  function handleSaveProject(savedProject: Project) {
    setProjects((current) => {
      const exists = current.some((p) => p.id === savedProject.id);
      let updated: Project[];
      if (exists) {
        updated = current.map((p) => (p.id === savedProject.id ? savedProject : p));
      } else {
        updated = [...current, savedProject];
      }
      setStoredProjects(updated);
      return updated;
    });
    setIsFormOpen(false);
    setProjectToEdit(null);
  }

  function handleDeleteProject() {
    if (!projectToDelete) return;

    setProjects((current) => {
      const updated = current.filter((p) => p.id !== projectToDelete.id);
      setStoredProjects(updated);
      return updated;
    });

    setProjectToDelete(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("seguimientoOperativo")}
        title={t("gestionProyectos")}
        description={t("proyectosDesc")}
        icon={<ProjectsIcon className="h-5 w-5" />}
        actions={
          <>
            <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white cursor-pointer">
              {t("exportarDatos")}
            </button>

            <button
              onClick={handleCreateProject}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black shadow-[0_0_28px_rgba(0,221,235,0.18)] transition hover:bg-cyan-300 cursor-pointer"
            >
              {t("nuevoProyecto")}
            </button>
          </>
        }
      />

      <section className="grid grid-cols-4 gap-5">
        <StatCard
          title={t("proyectosActivos")}
          value={String(stats.active)}
          description={`+${projects.filter((p) => p.status === "En desarrollo").length} en dev`}
          icon={<FolderIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("En desarrollo")}
          value={String(stats.enDesarrollo)}
          description={t("faseActual")}
          icon={<ProjectsIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("Completado")}
          value={String(stats.completados)}
          description={t("faseActual")}
          icon={<TrendUpIcon className="h-5 w-5" />}
        />

        <StatCard
          title={t("vencimientos")}
          value={String(stats.deudas)}
          description={t("urgente")}
          icon={<CalendarIcon className="h-5 w-5" />}
        />
      </section>

      <Card>
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {["Todos", "Completado", "En desarrollo", "Pendiente", "En revisión", "Pausado"].map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition cursor-pointer ${
                    filter === selectedFilter
                      ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent"
                  }`}
                >
                  {t(filter)}
                </button>
              )
            )}
          </div>

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("buscarProyecto")}
            className="w-full sm:w-[320px] rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/30"
          />
        </div>

        <ProjectsTable
          projects={filteredProjects}
          onEdit={handleEditProject}
          onDelete={setProjectToDelete}
        />
      </Card>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h2 className="text-lg font-semibold uppercase tracking-[0.25em] text-zinc-200">
            {t("estadoGeneral")}
          </h2>

          <div className="mt-5 border-t border-white/10 pt-5">
            {generalStatusStats.map((item) => (
              <div key={item.label} className="mb-5 last:mb-0">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-zinc-300">{item.label}</span>
                  <span className="font-semibold text-white">{item.value}%</span>
                </div>

                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-6 h-[150px] overflow-hidden rounded-2xl border border-cyan-400/10 bg-cyan-400/5">
            <Image
              src="/images/project-status-orbit.png"
              alt="Estado general de proyectos"
              fill
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0F] via-transparent to-transparent" />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold uppercase tracking-[0.25em] text-zinc-200">
            {t("proximasEntregas")}
          </h2>

          <div className="mt-5 border-t border-white/10 pt-5">
            {initialDeliveries.map((delivery) => (
              <div
                key={delivery.project}
                className="mb-5 flex items-center gap-4 last:mb-0"
              >
                <div
                  className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border ${
                    delivery.urgent
                      ? "border-red-400/30 bg-red-400/10 text-red-200"
                      : "border-white/10 bg-white/5 text-zinc-300"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase">
                    {delivery.month}
                  </span>
                  <span className="text-2xl font-bold">{delivery.day}</span>
                </div>

                <div>
                  <p className="text-lg font-semibold text-white">
                    {delivery.project}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {delivery.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-6 text-sm font-semibold text-zinc-300 hover:text-cyan-300 cursor-pointer">
            {t("verCalendario")}
          </button>
        </Card>
      </section>

      {/* New / Edit Project Modal */}
      <ProjectFormModal
        open={isFormOpen}
        project={projectToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setProjectToEdit(null);
        }}
        onSave={handleSaveProject}
      />

      <ConfirmDialog
        open={!!projectToDelete}
        title={t("eliminarProyecto")}
        description={t("eliminarProyectoDesc", { name: projectToDelete?.name ?? "" })}
        confirmLabel={t("eliminarProyecto")}
        variant="danger"
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}