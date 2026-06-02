import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/LanguageContext";

const chartValues = [
  92, 118, 84, 135, 101, 168, 142, 196, 165, 228, 190, 260,
  232, 286, 248, 310, 276, 340, 292, 365, 318, 390, 350, 420,
];

const timeLabels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];

export function PerformanceHistory() {
  const { t, language } = useLanguage();

  return (
    <Card className="col-span-2 flex min-h-[520px] flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t("historicoRendimiento")}
          </h2>

          <p className="text-sm text-zinc-500">
            {t("historicoDesc")}
          </p>
        </div>

        <div className="flex rounded-lg bg-white/5 p-1">
          {["1H", "24H", "7D", "30D"].map((item) => (
            <button
              key={item}
              className={`rounded-md px-3 py-2 text-xs font-medium ${
                item === "24H" ? "bg-black text-cyan-300" : "text-zinc-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 items-end gap-2 border-b border-l border-white/10 px-4 pb-8 pt-8">
        <div className="absolute inset-x-4 top-8 h-px bg-white/5" />
        <div className="absolute inset-x-4 top-[30%] h-px bg-white/5" />
        <div className="absolute inset-x-4 top-[52%] h-px bg-white/5" />
        <div className="absolute inset-x-4 top-[74%] h-px bg-white/5" />

        {chartValues.map((height, index) => (
          <div
            key={index}
            className="relative z-10 flex-1 rounded-t bg-gradient-to-t from-cyan-400/30 to-cyan-300/70"
            style={{ height: `${Math.min(height / 4.4, 95)}%` }}
          />
        ))}

        <div className="pointer-events-none absolute inset-x-4 bottom-8 h-[42%] bg-[radial-gradient(ellipse_at_bottom,rgba(0,221,235,0.15)_0%,transparent_70%)]" />
      </div>

      <div className="mt-4 flex justify-between px-4 text-xs text-zinc-600">
        {timeLabels.map((time) => (
          <span key={time}>{time}</span>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-6 text-xs text-zinc-500">
        <span className="text-cyan-300">● CPU</span>
        <span className="text-violet-300">● {language === "ES" ? "Memoria" : "Memory"}</span>
        <span className="text-zinc-400">○ Requests</span>
      </div>
    </Card>
  );
}