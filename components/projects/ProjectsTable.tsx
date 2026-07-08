"use client";

import type { Project } from "@/types/project";
import { EditIcon, TrashIcon } from "@/components/icons/SidebarIcons";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { PriorityBadge, ProjectStatusBadge } from "./ProjectBadges";
import { useLanguage } from "@/lib/LanguageContext";

export function ProjectsTable({
  projects,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 w-full bg-black/20">
      <table className="w-full text-left text-sm table-auto">
        <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-zinc-500">
          <tr>
            <th className="px-5 py-4">{t("proyecto")}</th>
            <th className="px-5 py-4">{t("responsable")}</th>
            <th className="px-5 py-4">{t("categoria")}</th>
            <th className="px-5 py-4">{t("prioridad")}</th>
            <th className="px-5 py-4">{t("estado")}</th>
            <th className="px-5 py-4">{t("entrega")}</th>
            <th className="px-5 py-4 text-right">{t("acciones")}</th>
          </tr>
        </thead>

        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                <p className="text-base font-semibold">{t("sinProyectos")}</p>
                <p className="text-xs text-zinc-600 mt-1">{t("crearUno")}</p>
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr
                key={project.id}
                className="border-t border-white/5 transition hover:bg-white/[0.03]"
              >
                <td className="px-5 py-5 font-semibold text-white">
                  {project.name}
                </td>

                <td className="px-5 py-5 text-zinc-400">
                  {project.responsible}
                </td>

                <td className="px-5 py-5">
                  <span className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300">
                    {project.category || "-"}
                  </span>
                </td>

                <td className="px-5 py-5">
                  <PriorityBadge priority={project.priority} />
                </td>

                <td className="px-5 py-5">
                  <ProjectStatusBadge status={project.status} />
                </td>

                <td className="px-5 py-5 text-zinc-400 text-xs">
                  {project.endDate || "-"}
                </td>

                <td className="px-5 py-5">
                  <div className="flex justify-end gap-2">
                    <IconActionButton
                      label={t("editarCliente")}
                      variant="warning"
                      onClick={() => onEdit(project)}
                      icon={<EditIcon className="h-4 w-4" />}
                    />

                    <IconActionButton
                      label={t("eliminarCliente")}
                      variant="danger"
                      onClick={() => onDelete(project)}
                      icon={<TrashIcon className="h-4 w-4" />}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}