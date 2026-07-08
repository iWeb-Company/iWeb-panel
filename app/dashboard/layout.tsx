"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#030606] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,221,235,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(24,24,27,0.65),transparent_28%)] transform-gpu will-change-transform" />

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <section className="relative z-10 lg:pl-[280px] transition-all duration-300">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <div className="mx-auto max-w-[1520px] px-4 sm:px-8 py-8">
            {children}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}