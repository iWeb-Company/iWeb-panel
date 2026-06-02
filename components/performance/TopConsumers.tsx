import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/LanguageContext";

export function TopConsumers({ consumers }: { consumers: string[] }) {
  const { t, language } = useLanguage();

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white">{t("consumidoresPrincipales")}</h2>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="space-y-3">
          {consumers.map((name) => (
            <div
              key={name}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  <p className="font-semibold text-white">{name}</p>
                </div>

                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-400">
                  PROD
                </span>
              </div>

              <p className="text-xs text-zinc-500">
                CPU: 2.4% · {language === "ES" ? "Memoria" : "Memory"}: 450 MB
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Request: 342 req/s
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}   