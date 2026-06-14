"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  AnalyticsIcon,
  ClientsIcon,
  LogoutIcon,
  PerformanceIcon,
  ProjectsIcon,
  MarketingIcon,
} from "@/components/icons/SidebarIcons";
import { useLanguage } from "@/lib/LanguageContext";

const navItems = [
  {
    translationKey: "analiticas",
    href: "/dashboard/analiticas",
    icon: AnalyticsIcon,
  },
  {
    translationKey: "clientes",
    href: "/dashboard/clientes",
    icon: ClientsIcon,
  },
  {
    translationKey: "proyectos",
    href: "/dashboard/proyectos",
    icon: ProjectsIcon,
  },
  {
    translationKey: "rendimiento",
    href: "/dashboard/rendimiento",
    icon: PerformanceIcon,
  },
  {
    translationKey: "marketing",
    href: "/dashboard/marketing",
    icon: MarketingIcon,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Error en logout:", err);
    }
    localStorage.removeItem("iweb_panel_auth");
    localStorage.removeItem("iweb_panel_remember");
    localStorage.removeItem("iweb_panel_username");
    router.push("/login");
  }
  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-[280px] border-r border-white/10 bg-[#050808] px-5 py-6">
      <div className="mb-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-5">
  <div className="flex items-center gap-4">
    <div className="relative h-10 w-20">
      <Image
        src="/logos/iweb-logo.png"
        alt="iWeb"
        fill
        className="object-contain"
        priority
      />
    </div>

    <div>
      <p className="text-lg font-black tracking-tight text-white">
        {t("panelDeControl")}
      </p>
      <p className="text-xs text-zinc-500">
        {t("controlInterno")}
      </p>
    </div>
  </div>
</div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition ${
                isActive
                  ? "border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200 shadow-[0_0_24px_rgba(0,221,235,0.08)]"
                  : "border border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-cyan-300" />
              )}

              <span
  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
    isActive
      ? "bg-cyan-400/15 text-cyan-200"
      : "bg-white/[0.04] text-zinc-500 group-hover:text-white"
  }`}
>
  <item.icon className="h-5 w-5" />
</span>

              <span className="font-medium">{t(item.translationKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-5 right-5">
        <button 
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-zinc-500 transition hover:bg-white/[0.06] hover:text-white cursor-pointer">
  <LogoutIcon className="h-5 w-5" />
  <span>{t("cerrarSesion")}</span>
</button>
      </div>
    </aside>
  );
}