import type { ClientProduct, ClientStatus } from "@/types/client";

export function ProductBadge({ product }: { product: ClientProduct }) {
  const styles: Record<ClientProduct, string> = {
    Tranett: "border-blue-400/40 bg-blue-400/10 text-blue-300",
    Foonett: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
    "A medida": "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  };

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${styles[product]}`}
    >
      {product}
    </span>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const isActive = status === "Activo";

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
        isActive
          ? "bg-emerald-400/10 text-emerald-400"
          : "bg-zinc-500/10 text-zinc-500"
      }`}
    >
      {status}
    </span>
  );
}