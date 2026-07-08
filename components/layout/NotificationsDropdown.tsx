"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

interface NotificationItem {
  id: string;
  type: string;
  titleES: string;
  titleEN: string;
  descriptionES: string;
  descriptionEN: string;
  href: string;
  actionES: string;
  actionEN: string;
}

export function NotificationsDropdown({
  open,
  onClose,
  notifications,
  onDismiss,
}: {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}) {
  const { t, language } = useLanguage();

  if (!open) return null;

  return (
    <div 
      className="fixed right-4 top-[86px] sm:absolute sm:right-0 sm:top-14 z-[999] w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] rounded-[22px] border border-white/10 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.85)]"
      style={{ backgroundColor: "#0B0F0F", opacity: 1 }}
    >
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

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
            <span className="text-2xl">🎉</span>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              {language === "ES" ? "No tenés alertas pendientes" : "No pending alerts"}
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const title = language === "ES" ? notification.titleES : notification.titleEN;
            const description = language === "ES" ? notification.descriptionES : notification.descriptionEN;
            const action = language === "ES" ? notification.actionES : notification.actionEN;

            return (
              <div
                key={notification.id}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 pr-8"
              >
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white cursor-pointer text-xs transition"
                  title={language === "ES" ? "Descartar" : "Dismiss"}
                >
                  ×
                </button>
                
                <div className="flex gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      notification.type === "danger"
                        ? "bg-red-400"
                        : notification.type === "warning"
                          ? "bg-yellow-300"
                          : "bg-cyan-300"
                    }`}
                  />

                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm pr-2 leading-tight">
                      {title}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {description}
                    </p>

                    <Link
                      href={notification.href}
                      onClick={onClose}
                      className="mt-3 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      {action} →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}