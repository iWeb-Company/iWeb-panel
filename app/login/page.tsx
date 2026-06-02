"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error === "Usuario o contraseña incorrectos." ? t("errorLogin") : (data.error || t("errorLogin")));
        setIsLoading(false);
        return;
      }

      localStorage.setItem("iweb_panel_auth", "true");
      localStorage.setItem("iweb_panel_username", username);

      if (remember) {
        localStorage.setItem("iweb_panel_remember", "true");
      }

      router.push("/dashboard/analiticas");
    } catch (err) {
      setError(t("errorNetwork"));
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030606] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(0,221,235,0.12),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(0,120,255,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(0,221,235,0.06),transparent_35%,rgba(0,0,0,0.35))]" />

      <section className="relative z-10 flex w-full max-w-[760px] flex-col items-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6 h-16 w-36">
            <Image
              src="/logos/iweb-logo.png"
              alt="iWeb"
              fill
              priority
              className="object-contain"
            />
          </div>

          <h1 className="text-4xl font-semibold tracking-[0.12em] text-cyan-400">
            {t("panelDeControl")}
          </h1>

          <p className="mt-5 text-sm font-medium uppercase tracking-[0.35em] text-zinc-400">
            {t("secureAccessGateway")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[560px] rounded-[24px] border border-cyan-400/15 bg-[#071010] p-10 shadow-[0_32px_100px_rgba(0,0,0,0.45)]"
        >
          <div className="space-y-8">
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.28em] text-zinc-300">
                {t("usuario")}
              </label>

              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-5 text-lg text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-400/40 focus:bg-black/45"
                placeholder={t("usuario")}
              />
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.28em] text-zinc-300">
                {t("contrasena")}
              </label>

              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-5 text-lg text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-400/40 focus:bg-black/45"
                placeholder="••••••••••"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-400">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                  remember
                    ? "border-cyan-400 bg-cyan-400 text-black"
                    : "border-white/20 bg-black/20"
                }`}
              >
                {remember ? "✓" : ""}
              </span>

              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="hidden"
              />

              {t("recordarAcceso")}
            </label>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-16 w-full rounded-xl bg-cyan-400 text-lg font-semibold text-black shadow-[0_0_40px_rgba(0,221,235,0.22)] transition hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t("ingresando") : t("ingresar")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}