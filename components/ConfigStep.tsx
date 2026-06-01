import type { Config } from "@/app/page";

type Props = {
  config: Config;
  setConfig: (c: Partial<Config>) => void;
  onNext: () => void;
  onBack: () => void;
};

const cpuOptions: Config["cpu"][] = [0.5, 1, 2];

export default function ConfigStep({ config, setConfig, onNext, onBack }: Props) {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Node & Ressources</h2>
        <p className="mt-2 text-white/40 text-sm">Choisissez la destination et allouez les ressources.</p>
      </div>

      {/* Node cible */}
      <div className="mb-6">
        <p className="text-sm font-medium text-white/60 mb-3 uppercase tracking-widest text-xs">Node cible</p>
        <div className="flex gap-3">
          {(["mac", "windows"] as const).map((n) => {
            const active = config.targetNode === n;
            return (
              <button
                key={n}
                onClick={() => setConfig({ targetNode: n })}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer
                  ${active ? "bg-white text-[#0f1117] border-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
              >
                {n === "mac" ? "🍎 Mac (ARM64)" : "🪟 Windows (x86)"}
              </button>
            );
          })}
        </div>
      </div>

      {/* CPU */}
      <div className="mb-6">
        <p className="text-sm font-medium text-white/60 mb-3 uppercase tracking-widest text-xs">CPU (cœurs)</p>
        <div className="flex gap-3">
          {cpuOptions.map((c) => {
            const active = config.cpu === c;
            return (
              <button
                key={c}
                onClick={() => setConfig({ cpu: c })}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer
                  ${active ? "bg-white text-[#0f1117] border-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* RAM */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">RAM</p>
          <span className="text-sm font-bold text-white">{config.ram} Mo</span>
        </div>
        <input
          type="range"
          min={512}
          max={8192}
          step={512}
          value={config.ram}
          onChange={(e) => setConfig({ ram: parseInt(e.target.value) })}
          className="w-full accent-white"
        />
        <div className="flex justify-between text-white/20 text-xs mt-1">
          <span>512 Mo</span>
          <span>8 Go</span>
        </div>
      </div>

      {/* Stockage */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Stockage</p>
          <span className="text-sm font-bold text-white">{config.disk} Go</span>
        </div>
        <input
          type="number"
          min={5}
          max={100}
          value={config.disk}
          onChange={(e) => setConfig({ disk: Math.min(100, Math.max(5, parseInt(e.target.value) || 5)) })}
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
        />
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-3 rounded-xl text-sm text-white/40 hover:text-white transition cursor-pointer">
          ← Retour
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-xl font-semibold text-sm bg-white text-[#0f1117] hover:bg-white/90 cursor-pointer transition"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}
