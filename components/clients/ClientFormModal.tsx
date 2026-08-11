"use client";

import { useEffect, useState } from "react";
import type { Client, ProvisioningResult } from "@/types/client";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/lib/LanguageContext";

type ClientFormModalProps = {
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSave: (client: Client, provisioning?: ProvisioningResult) => void;
};

export function ClientFormModal({
  open,
  client,
  onClose,
  onSave,
}: ClientFormModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(client?.name ?? "");
  const [responsible, setResponsible] = useState(client?.responsible ?? "");
  const [monthly, setMonthly] = useState(client?.monthly ?? "$0");
  const [product, setProduct] = useState<Client["product"]>(
    client?.product ?? "Tranett"
  );
  const [status, setStatus] = useState<Client["status"]>(
    client?.status ?? "Activo"
  );

  // SaaS Tenant Specific Fields
  const [slug, setSlug] = useState(client?.slug ?? "");
  const [cuit, setCuit] = useState(client?.cuit?.toString() ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [adminUsername, setAdminUsername] = useState(client?.admin_username ?? "");
  const [adminPassword, setAdminPassword] = useState("");
  const [logoXlFile, setLogoXlFile] = useState<File | null>(null);
  const [logoSFile, setLogoSFile] = useState<File | null>(null);
  const [logoXlPreview, setLogoXlPreview] = useState<string | null>(client?.logo_xl ?? null);
  const [logoSPreview, setLogoSPreview] = useState<string | null>(client?.logo_s ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>("");

  useEffect(() => {
    setName(client?.name ?? "");
    setResponsible(client?.responsible ?? "");
    setMonthly(client?.monthly ?? "$0");
    setProduct(client?.product ?? "Tranett");
    setStatus(client?.status ?? "Activo");
    setSlug(client?.slug ?? "");
    setCuit(client?.cuit?.toString() ?? "");
    setEmail(client?.email ?? "");
    setAdminUsername(client?.admin_username ?? "");
    setAdminPassword("");
    setLogoXlFile(null);
    setLogoSFile(null);
    setLogoXlPreview(client?.logo_xl ?? null);
    setLogoSPreview(client?.logo_s ?? null);
    setIsSubmitting(false);
    setSubmitStep("");
  }, [client, open]);

  // Auto-generate slug when name changes (if not editing an existing client)
  function handleNameChange(val: string) {
    setName(val);
    if (!client) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      setSlug(generated);
      if (!adminUsername && generated) {
        setAdminUsername(`admin@${generated}.com`);
      }
    }
  }

  function generateSecurePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pass);
  }

  function handleLogoXlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoXlFile(file);
      setLogoXlPreview(URL.createObjectURL(file));
    }
  }

  function handleLogoSChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoSFile(file);
      setLogoSPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStep("Aprovisionando recursos en servidor...");

    const isEdit = !!client;

    try {
      if (product === "Tranett" && !isEdit) {
        // Multipart SaaS Provisioning
        const formData = new FormData();
        formData.append("name", name);
        formData.append("responsible", responsible);
        formData.append("monthly", monthly);
        formData.append("product", product);
        formData.append("status", status);
        formData.append("slug", slug || name.toLowerCase().replace(/\s+/g, "_"));
        formData.append("cuit", cuit);
        formData.append("email", email);
        formData.append("admin_username", adminUsername || email || `admin@${slug}.com`);
        formData.append("admin_password", adminPassword || `Tn.${Math.random().toString(36).substring(2, 8)}!2026`);

        if (logoXlFile) formData.append("logo_xl", logoXlFile);
        if (logoSFile) formData.append("logo_s", logoSFile);

        setSubmitStep("Creando base de datos y directorios de tenant...");
        const res = await fetch("/api/clients", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al aprovisionar cliente");
        }

        onSave(data.client, data.provisioning);
      } else {
        // Standard JSON update/save
        const payload: Client = {
          id: client?.id ?? `CL-${Date.now()}`,
          name,
          responsible,
          monthly,
          product,
          status,
          slug: slug || name.toLowerCase().replace(/\s+/g, "_"),
          cuit,
          email,
          admin_username: adminUsername,
          login_url: `https://${slug || name.toLowerCase().replace(/\s+/g, "_")}.tranett.com/login`,
        };

        const res = await fetch("/api/clients", {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al guardar");

        onSave(data.client);
      }

      onClose();
    } catch (err: any) {
      console.error("Error creating/updating client:", err);
      alert(err.message || "Ocurrió un error al procesar el cliente.");
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  }

  const effectiveSlug = slug || name.toLowerCase().trim().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "") || "empresa";

  return (
    <Modal
      open={open}
      title={client ? t("editarCliente") : (product === "Tranett" ? "🚀 Nuevo Tenant SaaS (TravelNett)" : t("nuevoCliente"))}
      description={
        client
          ? t("datosComerciales")
          : product === "Tranett"
          ? "Aprovisiona automáticamente subdominio, base de datos, usuario administrador y carpetas en 1 paso."
          : t("datosComerciales")
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Producto & Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              {t("producto")}
            </label>
            <select
              value={product}
              onChange={(event) =>
                setProduct(event.target.value as Client["product"])
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm outline-none focus:border-cyan-400/50"
            >
              <option value="Tranett">Tranett (TravelNett SaaS)</option>
              <option value="Foonett">Foonett</option>
              <option value="A medida">{t("aMedida")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              {t("estado")}
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Client["status"])
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm outline-none focus:border-cyan-400/50"
            >
              <option value="Activo">{t("activo")}</option>
              <option value="Inactivo">{t("inactivo")}</option>
            </select>
          </div>
        </div>

        {/* Datos Comerciales Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              Nombre de la Empresa *
            </label>
            <input
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="ej: Ruta 86 Turismo"
              required
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm outline-none focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              {t("responsable")}
            </label>
            <input
              value={responsible}
              onChange={(event) => setResponsible(event.target.value)}
              placeholder="ej: Valentín"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              {t("mensualidad")}
            </label>
            <input
              value={monthly}
              onChange={(event) => setMonthly(event.target.value)}
              placeholder="ARS 250.000"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm outline-none focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              CUIT de la Empresa
            </label>
            <input
              value={cuit}
              onChange={(event) => setCuit(event.target.value)}
              placeholder="30-71584930-9"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>

        {/* Sección de Aprovisionamiento SaaS (Tranett) */}
        {product === "Tranett" && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-cyan-300">
                ⚙️ Configuración de Subdominio y Acceso SaaS
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Wildcard DNS Ready</span>
            </div>

            {/* Subdominio y URL Live Preview */}
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                Subdominio Asignado
              </label>
              <div className="flex rounded-xl border border-white/10 bg-black/50 overflow-hidden focus-within:border-cyan-400/50">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="ruta86"
                  className="h-11 flex-1 bg-transparent px-3.5 text-white text-sm font-mono outline-none"
                />
                <span className="flex items-center bg-white/5 px-3 text-xs text-zinc-400 font-mono border-l border-white/10">
                  .tranett.com
                </span>
              </div>
              <p className="mt-1 text-[11px] text-cyan-400/80 font-mono">
                URL de Login: https://{effectiveSlug}.tranett.com/login
              </p>
            </div>

            {/* Usuario Administrador Inicial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                  Usuario Admin (Email o Username)
                </label>
                <input
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder={`admin@${effectiveSlug}.com`}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                    Contraseña Inicial
                  </label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    🎲 Generar
                  </button>
                </div>
                <input
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Dejar en blanco para auto-generar"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-white text-sm font-mono outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>

            {/* Subida de Logos */}
            {!client && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                    Logo XL / Horizontal
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoXlChange}
                    className="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20 cursor-pointer"
                  />
                  {logoXlPreview && (
                    <img
                      src={logoXlPreview}
                      alt="Logo XL"
                      className="mt-2 h-10 object-contain rounded border border-white/10 bg-black/40 p-1"
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                    Logo S / Icono
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSChange}
                    className="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20 cursor-pointer"
                  />
                  {logoSPreview && (
                    <img
                      src={logoSPreview}
                      alt="Logo S"
                      className="mt-2 h-10 w-10 object-contain rounded border border-white/10 bg-black/40 p-1"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado de Envío */}
        {isSubmitting && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs animate-pulse">
            <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <span>{submitStep || "Procesando aprovisionamiento del cliente..."}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.08] transition cursor-pointer"
          >
            {t("cancelar")}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-cyan-400 hover:bg-cyan-300 px-6 py-2.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(0,221,235,0.25)] transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? "Aprovisionando..."
              : client
              ? t("guardarCliente")
              : product === "Tranett"
              ? "🚀 Aprovisionar Cliente SaaS"
              : t("guardarCliente")}
          </button>
        </div>
      </form>
    </Modal>
  );
}