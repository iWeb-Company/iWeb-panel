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

  function toggleProject(projectId: string) {
    setOpenProjectId((current) => (current === projectId ? null : projectId));
  }

  function handleConfirmRestart() {
    alert(
      language === "ES"
        ? `Contenedor reiniciado: ${containerToRestart?.name}`
        : `Container restarted: ${containerToRestart?.name}`
    );
    setContainerToRestart(null);
  }

  function handleConfirmStop() {
    alert(
      language === "ES"
        ? `Contenedor detenido: ${containerToStop?.name}`
        : `Container stopped: ${containerToStop?.name}`
    );
    setContainerToStop(null);
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
                              onClick={() => alert(`${t("verLogs")}: ${container.name}`)}
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
    </>
  );
}