"use client";

import { Fragment, useState } from "react";
import type { TechnicalContainer, TechnicalProject } from "@/types/performance";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  LogsIcon,
  ResourcesIcon,
  RestartIcon,
  StopIcon,
} from "@/components/icons/SidebarIcons";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { TechnicalStatusBadge } from "./TechnicalStatusBadge";
import { useLanguage } from "@/lib/LanguageContext";

export function TechnicalProjectsTable({
  projects,
}: {
  projects: TechnicalProject[];
}) {
  const { t, language } = useLanguage();
  const [openProjectId, setOpenProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );

  const [containerToRestart, setContainerToRestart] =
    useState<TechnicalContainer | null>(null);

  const [containerToStop, setContainerToStop] =
    useState<TechnicalContainer | null>(null);

  const [activeLogsContainer, setActiveLogsContainer] =
    useState<TechnicalContainer | null>(null);
  const [logsContent, setLogsContent] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(false);

  function toggleProject(projectId: string) {
    setOpenProjectId((current) => (current === projectId ? null : projectId));
  }

  function fetchLogs(containerId: string) {
    setLoadingLogs(true);
    setLogsContent("");
    fetch(`/api/docker/containers/logs?id=${containerId}`)
      .then((res) => res.json())
      .then((data) => {
        setLogsContent(data.logs || "No logs available.");
      })
      .catch((err) => {
        setLogsContent(`Error retrieving logs: ${err.message}`);
      })
      .finally(() => {
        setLoadingLogs(false);
      });
  }

  function handleConfirmRestart() {
    if (!containerToRestart) return;

    fetch("/api/docker/containers/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: containerToRestart.id, action: "restart" }),
    })
      .then((res) => res.json())
      .then(() => {
        alert(
          language === "ES"
            ? `Contenedor reiniciado: ${containerToRestart?.name}`
            : `Container restarted: ${containerToRestart?.name}`
        );
      })
      .catch((err) => {
        console.error("Error restarting container:", err);
        alert(`Error: ${err.message}`);
      })
      .finally(() => {
        setContainerToRestart(null);
      });
  }

  function handleConfirmStop() {
    if (!containerToStop) return;

    fetch("/api/docker/containers/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: containerToStop.id, action: "stop" }),
    })
      .then((res) => res.json())
      .then(() => {
        alert(
          language === "ES"
            ? `Contenedor detenido: ${containerToStop?.name}`
            : `Container stopped: ${containerToStop?.name}`
        );
      })
      .catch((err) => {
        console.error("Error stopping container:", err);
        alert(`Error: ${err.message}`);
      })
      .finally(() => {
        setContainerToStop(null);
      });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-zinc-500">
            <tr>
              <th className="px-5 py-4">{t("proyectoInstancia")}</th>
              <th className="px-5 py-4">{t("estado")}</th>
              <th className="px-5 py-4">{t("cpu")}</th>
              <th className="px-5 py-4">{t("memory")}</th>
              <th className="px-5 py-4">{t("requests")}</th>
              <th className="px-5 py-4 text-right">{t("acciones")}</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => {
              const isOpen = openProjectId === project.id;

              return (
                <Fragment key={project.id}>
                  <tr
                    onClick={() => toggleProject(project.id)}
                    className="cursor-pointer border-t border-white/5 transition hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-5">
                      <p className="font-semibold text-white">{project.name}</p>
                      <p className="text-xs text-zinc-500">{project.type}</p>
                    </td>

                    <td className="px-5 py-5">
                      <TechnicalStatusBadge status={project.status} />
                    </td>

                    <td
                      className={`px-5 py-5 ${
                        project.cpu.startsWith("89")
                          ? "text-yellow-300"
                          : "text-zinc-300"
                      }`}
                    >
                      {project.cpu}
                    </td>

                    <td className="px-5 py-5 text-zinc-300">
                      {project.memory}
                    </td>

                    <td className="px-5 py-5 text-zinc-300">
                      {project.requests}
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex justify-end">
                        <span className="inline-flex items-center gap-2 text-zinc-400">
                          <span className="leading-none">{t("verTodo")}</span>

                          {isOpen ? (
                            <ChevronUpIcon className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {isOpen &&
                    project.containers.map((container) => (
                      <tr
                        key={container.id}
                        className="border-t border-white/5 bg-cyan-400/[0.04]"
                      >
                        <td className="px-5 py-4 pl-10">
                          <p className="font-medium text-zinc-200">
                            {container.name}
                          </p>

                          <p className="text-xs text-zinc-600">
                            {container.hash}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {container.image}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <TechnicalStatusBadge status={container.status} />
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {container.cpu}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {container.memory}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {container.requests}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <IconActionButton
                              label={t("verLogs")}
                              onClick={() => {
                                setActiveLogsContainer(container);
                                fetchLogs(container.id);
                              }}
                              icon={<LogsIcon className="h-4 w-4" />}
                            />

                            <IconActionButton
                              label={t("verRecursos")}
                              onClick={() => alert(`${t("verRecursos")}: ${container.name}`)}
                              icon={<ResourcesIcon className="h-4 w-4" />}
                            />

                            <IconActionButton
                              label={t("reiniciarContenedor")}
                              variant="warning"
                              onClick={() => setContainerToRestart(container)}
                              icon={<RestartIcon className="h-4 w-4" />}
                            />

                            <IconActionButton
                              label={t("detenerContenedor")}
                              variant="danger"
                              onClick={() => setContainerToStop(container)}
                              icon={<StopIcon className="h-4 w-4" />}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!containerToRestart}
        title={t("restartContainer")}
        description={t("reiniciarContenedorDesc", {
          name: containerToRestart?.name ?? "",
        })}
        confirmLabel={t("reiniciar")}
        variant="warning"
        onClose={() => setContainerToRestart(null)}
        onConfirm={handleConfirmRestart}
      />

      <ConfirmDialog
        open={!!containerToStop}
        title={t("stopContainer")}
        description={t("detenerContenedorDesc", {
          name: containerToStop?.name ?? "",
        })}
        confirmLabel={t("detener")}
        variant="danger"
        onClose={() => setContainerToStop(null)}
        onConfirm={handleConfirmStop}
      />

      <Modal
        title={activeLogsContainer ? `Logs: ${activeLogsContainer.name}` : ""}
        description={activeLogsContainer ? `${activeLogsContainer.image} · ${activeLogsContainer.id.substring(0, 12)}` : ""}
        open={!!activeLogsContainer}
        onClose={() => setActiveLogsContainer(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs text-zinc-500">
            <span>Últimas 100 líneas de logs</span>
            <button
              onClick={() => activeLogsContainer && fetchLogs(activeLogsContainer.id)}
              disabled={loadingLogs}
              className="px-3 py-1 rounded bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-50 transition cursor-pointer"
            >
              {loadingLogs ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div className="relative font-mono text-[11px] leading-5 bg-black text-emerald-400 p-4 rounded-2xl h-[380px] overflow-y-auto whitespace-pre-wrap border border-white/5 shadow-inner">
            {loadingLogs ? (
              <div className="flex h-full items-center justify-center text-zinc-500 font-sans">
                <span className="animate-pulse">Cargando logs del contenedor...</span>
              </div>
            ) : (
              logsContent
            )}
          </div>

          <div className="flex justify-end mt-2">
            <button
              onClick={() => setActiveLogsContainer(null)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.07] hover:text-white cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}