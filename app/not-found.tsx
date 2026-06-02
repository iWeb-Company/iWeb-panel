import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050707] text-white">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
          Error 404
        </p>

        <h1 className="mt-4 text-4xl font-semibold">
          Página no encontrada
        </h1>

        <p className="mt-3 text-sm text-zinc-500">
          La ruta que intentaste abrir no existe dentro del panel.
        </p>

        <Link
          href="/dashboard/analiticas"
          className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
        >
          Volver al panel
        </Link>
      </div>
    </main>
  );
}