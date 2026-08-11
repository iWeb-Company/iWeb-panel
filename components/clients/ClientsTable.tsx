import type { Client } from "@/types/client";
import { ProductBadge, ClientStatusBadge } from "./ClientBadges";
import { EditIcon, TrashIcon } from "@/components/icons/SidebarIcons";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { useLanguage } from "@/lib/LanguageContext";

export function ClientsTable({
  clients,
  onEdit,
  onDelete,
  onShowProvisioning,
}: {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onShowProvisioning?: (client: Client) => void;
}) {
  const { t, language } = useLanguage();
  
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 w-full bg-black/20">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-zinc-500">
          <tr>
            <th className="px-5 py-4">{t("cliente")}</th>
            <th className="px-5 py-4">Subdominio / Acceso</th>
            <th className="px-5 py-4">{t("responsable")}</th>
            <th className="px-5 py-4">{t("mensualidad")}</th>
            <th className="px-5 py-4">{t("producto")}</th>
            <th className="px-5 py-4">{t("estado")}</th>
            <th className="px-5 py-4 text-right">{t("acciones")}</th>
          </tr>
        </thead>

        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                <p className="text-base font-semibold">{t("sinClientes")}</p>
                <p className="text-xs text-zinc-600 mt-1">{t("crearUno")}</p>
              </td>
            </tr>
          ) : (
            clients.map((client) => {
              const clientSlug = client.slug || (client.product === "Tranett" ? client.name.toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "") : null);
              const loginUrl = client.login_url || (clientSlug ? `https://${clientSlug}.tranett.com/login` : null);

              return (
                <tr
                  key={client.id}
                  className="border-t border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-5">
                    <p className="font-semibold text-white">{client.name}</p>
                    <p className="text-xs text-zinc-500">
                      ID: {client.id} {client.cuit ? `• CUIT: ${client.cuit}` : ""}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    {loginUrl ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={loginUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-400/20 text-xs font-mono transition"
                          title="Abrir URL del tenant"
                        >
                          <span>{clientSlug}.tranett.com</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 font-mono">—</span>
                    )}
                  </td>

                  <td className="px-5 py-5 text-zinc-400">
                    {client.responsible || "—"}
                  </td>

                  <td className="px-5 py-5 font-medium text-white">
                    {client.monthly}
                  </td>

                  <td className="px-5 py-5">
                    <ProductBadge product={client.product} />
                  </td>

                  <td className="px-5 py-5">
                    <ClientStatusBadge status={client.status} />
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <IconActionButton
                        label={t("editarCliente")}
                        onClick={() => onEdit(client)}
                        icon={<EditIcon className="h-4 w-4" />}
                      />

                      <IconActionButton
                        label={t("eliminarCliente")}
                        variant="danger"
                        onClick={() => onDelete(client)}
                        icon={<TrashIcon className="h-4 w-4" />}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}