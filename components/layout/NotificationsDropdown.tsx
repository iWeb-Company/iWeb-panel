"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export function NotificationsDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, language } = useLanguage();

  const notifications = [
    {
      id: "n1",
      type: "warning",
      title: language === "ES" ? "Tranett tiene alto consumo de CPU" : "Tranett has high CPU usage",
      description: language === "ES" ? "El proyecto está usando 89.2% de CPU." : "The project is using 89.2% of CPU.",
      href: "/dashboard/rendimiento",
      action: language === "ES" ? "Ir a rendimiento" : "Go to performance",
    },
    {
      id: "n2",
      type: "info",
      title: language === "ES" ? "Vitalis tiene una entrega cercana" : "Vitalis has an upcoming delivery",
      description: language === "ES" ? "La entrega final MVP está programada para el 05/06/2026." : "The final MVP delivery is scheduled for 06/05/2026.",
      href: "/dashboard/proyectos",
      action: language === "ES" ? "Ir a proyectos" : "Go to projects",
    },
    {
      id: "n3",
      type: "danger",
      title: language === "ES" ? "Contenedor detenido" : "Container stopped",
      description: language === "ES" ? "Vitalis backend figura como Exited." : "Vitalis backend is listed as Exited.",
      href: "/dashboard/rendimiento",
      action: language === "ES" ? "Revisar contenedor" : "Review container",
    },
  ];

  if (!open) return null;

  return (
    <div className="absolute right-0 top-14 z-50 w-[420px] rounded-[22px] border border-white/10 bg-[#0B0F0F] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.5)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400">
            {t("notificaciones")}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {t("centroAlertas")}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-white cursor-pointer"
        >
          {t("cerrar")}
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex gap-3">
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  notification.type === "danger"
                    ? "bg-red-400"
                    : notification.type === "warning"
                      ? "bg-yellow-300"
                      : "bg-cyan-300"
                }`}
              />

              <div className="flex-1">
                <p className="font-semibold text-white">
                  {notification.title}
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  {notification.description}
                </p>

                <Link
                  href={notification.href}
                  onClick={onClose}
                  className="mt-3 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  {notification.action} →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}