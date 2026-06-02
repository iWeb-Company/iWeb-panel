"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("iweb_panel_auth") === "true";

    if (isAuthenticated) {
      router.replace("/dashboard/analiticas");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030606] text-zinc-500">
      Cargando...
    </main>
  );
}