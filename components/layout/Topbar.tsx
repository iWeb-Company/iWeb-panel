"use client";

import { useState, useEffect } from "react";
import {
  BellIcon,
  SearchIcon,
  SlidersIcon,
  UserCircleIcon,
} from "@/components/icons/SidebarIcons";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useLanguage } from "@/lib/LanguageContext";

export function Topbar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const [profile, setProfile] = useState({ name: "Valentín", role: "UX/UI Designer" });
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(true);

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
            const hasUnreadNotifications = data.some((n) => !n.isRead);
            setHasUnread(hasUnreadNotifications);
          }
        })
        .catch((err) => console.error("Error fetching notifications in Topbar:", err));
    }
  }, []);

  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasUnread(false);
      }
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
    <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-white/10 bg-[#030606] px-8">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600" />

        <input
          placeholder={t("buscarDatos")}
          className="h-11 w-[390px] rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/30 focus:bg-white/[0.06]"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.07] hover:text-white"
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

        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.07] hover:text-white">
          <SlidersIcon className="h-5 w-5" />
        </button>

        <button
          onClick={toggleLanguage}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
        >
          {language}
        </button>

        <div className="flex items-center gap-3 pl-2">
          <UserCircleIcon className="h-8 w-8 text-cyan-400" />

          <div className="text-right">
            <p className="text-sm font-semibold text-white">{profile.name}</p>
            <p className="text-xs text-zinc-500">{profile.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}