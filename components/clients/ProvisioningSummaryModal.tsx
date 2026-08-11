"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { ProvisioningResult } from "@/types/client";

interface ProvisioningSummaryModalProps {
  open: boolean;
  result: ProvisioningResult | null;
  onClose: () => void;
}

export function ProvisioningSummaryModal({
  open,
  result,
  onClose,
}: ProvisioningSummaryModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!result) return null;

  const { client, admin_user, login_url, status } = result;

  function copyToClipboard(text: string, setter: (val: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  function handleCopyAll() {
    const summaryText = `🚀 *¡Bienvenido a TravelNett SaaS!* 🚀
Empresa: ${client.name}
Subdominio: ${client.slug}.tranett.com

🌐 *Enlace de Acceso:*
${login_url}

👤 *Credenciales de Administrador:*
- Usuario: ${admin_user.username}
- Contraseña: ${admin_user.initial_password || "••••••••"}

⚡ Todo tu sistema se encuentra 100% activo y configurado.`;

    copyToClipboard(summaryText, setCopiedAll);
  }

  return (
    <Modal
      open={open}
      title="🚀 Tenant Aprovisionado con Éxito"
      description={`El cliente SaaS "${client.name}" ha sido creado y aprovisionado automáticamente.`}
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* Banner de Estado */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-300">
                Aprovisionamiento 100% Automático Completado
              </h4>
              <p className="text-xs text-emerald-400/80">
                Subdominio DNS, almacenamiento aislado y credenciales listos para producción.
              </p>
            </div>
          </div>
        </div>

        {/* URL de Acceso */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider font-semibold text-cyan-400">URL del Tenant</span>
            <span className="text-[10px] bg-cyan-400/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/20">
              DNS Wildcard Activo
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 bg-black/50 p-3 rounded-xl border border-white/5">
            <span className="text-sm font-mono text-white truncate">{login_url}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(login_url, setCopiedUrl)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/30 transition cursor-pointer"
              >
                {copiedUrl ? "✓ Copiado" : "Copiar"}
              </button>
              <a
                href={login_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                ↗ Abrir
              </a>
            </div>
          </div>
        </div>

        {/* Credenciales de Acceso */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="uppercase tracking-wider font-semibold text-amber-400">Administrador Inicial</span>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  `Usuario: ${admin_user.username}\nContraseña: ${admin_user.initial_password}`,
                  setCopiedCreds
                )
              }
              className="text-xs text-zinc-400 hover:text-white transition cursor-pointer"
            >
              {copiedCreds ? "✓ Credenciales copiadas" : "Copiar usuario y clave"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-black/50 p-3 rounded-xl border border-white/5">
              <span className="block text-[11px] uppercase tracking-wider text-zinc-500">Usuario</span>
              <span className="font-mono text-white font-medium">{admin_user.username}</span>
            </div>
            <div className="bg-black/50 p-3 rounded-xl border border-white/5">
              <span className="block text-[11px] uppercase tracking-wider text-zinc-500">Contraseña</span>
              <span className="font-mono text-amber-300 font-bold">
                {admin_user.initial_password || "••••••••"}
              </span>
            </div>
          </div>
        </div>

        {/* Checklist Técnico */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <span className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-3">
            Verificación de Recursos
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-zinc-300 block font-medium">Base de Datos</span>
                <span className="text-[10px] text-zinc-500">Cliente y Admin OK</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-zinc-300 block font-medium">Almacenamiento</span>
                <span className="text-[10px] text-zinc-500">5 Directorios OK</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-zinc-300 block font-medium">Subdominio</span>
                <span className="text-[10px] text-zinc-500">*.tranett.com OK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Finales */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
          >
            {copiedAll ? "✓ Resumen Copiado para el Cliente" : "📋 Copiar Ficha de Bienvenida"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/20 px-6 py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
