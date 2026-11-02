"use client";

import { useState, useEffect } from "react";
import {
  BellIcon,
  UserCircleIcon,
} from "@/components/icons/SidebarIcons";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useLanguage } from "@/lib/LanguageContext";
import { usePathname } from "next/navigation";

const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const section = ({ analiticas: "Analíticas", clientes: "Clientes", proyectos: "Proyectos", pipelines: "Pipelines", planificacion: "Planificación", rendimiento: "Rendimiento", marketing: "Agente Marketing" } as Record<string, string>)[pathname.split("/")[2]] || "Panel de control";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const [profile, setProfile] = useState({ name: "Valentín", role: "UX/UI Designer" });
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const hasUnread = notifications.some((notification) => !notification.isRead);

  useEffect(() => {
    const savedUser = localStorage.getItem("iweb_panel_username") || "";
    const userLower = savedUser.toLowerCase().trim();

    if (userLower.includes("valentin")) {
      setProfile({ name: "Valentín", role: "UX/UI Designer" });
    } else if (userLower.includes("facundo")) {
      setProfile({ name: "Facundo", role: "Software Engineer" });
    } else if (userLower.includes("tomas")) {
      setProfile({ name: "Tomas", role: "Software Engineer" });
    } else if (savedUser) {
      setProfile({ name: savedUser, role: "Control Panel User" });
    } else {
      setProfile({ name: "Administrador", role: "Control Panel" });
    }

    if (savedUser) {
      fetch(`/api/notifications?username=${encodeURIComponent(savedUser)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch((err) => console.error("Error fetching notifications in Topbar:", err));
    }
  }, []);

  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => {
      const next = !prev;
      return next;
    });
  };

  const handleDismissNotification = (id: string) => {
    const savedUser = localStorage.getItem("iweb_panel_username") || "";
    if (savedUser) {
      fetch(`/api/notifications?id=${id}&username=${encodeURIComponent(savedUser)}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        })
        .catch((err) => console.error("Error deleting notification:", err));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#030606]/95 px-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Abrir menú de navegación"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.07] hover:text-white lg:hidden cursor-pointer"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">iWeb / Panel</p>
          <p className="truncate text-sm font-semibold text-zinc-100">{section}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={handleToggleNotifications}
            aria-label="Notificaciones"
            aria-expanded={notificationsOpen}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.07] hover:text-white cursor-pointer"
          >
            <BellIcon className="h-5 w-5" />
            {hasUnread && notifications.length > 0 && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-cyan-400" />
            )}
          </button>

          <NotificationsDropdown
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            onDismiss={handleDismissNotification}
          />
        </div>

        <button
          onClick={toggleLanguage}
          aria-label="Cambiar idioma"
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 sm:px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
        >
          {language}
        </button>

        <div className="relative flex items-center gap-3 pl-1 sm:pl-2">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-label="Ver perfil"
            aria-expanded={profileOpen}
            className="flex items-center gap-3 focus:outline-none cursor-pointer"
            title={profile.name}
          >
            <UserCircleIcon className="h-8 w-8 text-cyan-400 shrink-0" />
          </button>

          <div className="text-right max-sm:hidden">
            <p className="text-sm font-semibold text-white">{profile.name}</p>
            <p className="text-xs text-zinc-500">{profile.role}</p>
          </div>

          {profileOpen && (
            <div className="absolute right-0 top-11 z-50 rounded-2xl border border-white/10 bg-[#0B0F0F] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.7)] min-w-[170px] text-right">
              <p className="text-sm font-semibold text-white">{profile.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{profile.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}