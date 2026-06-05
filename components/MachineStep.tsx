import { useEffect, useState } from "react";
import type { Config } from "@/app/page";

const machines = [
  { id: "wordpress", name: "WordPress", description: "CMS prêt à l'emploi avec base de données MySQL.", icon: "🌐", tag: "Web" },
  { id: "node", name: "Server Node", description: "Environnement Node.js pour vos apps JavaScript.", icon: "⚙️", tag: "Backend" },
  { id: "multisite", name: "Server Multisite", description: "Serveur Nginx configuré pour héberger plusieurs sites.", icon: "🗂️", tag: "Hosting" },
  { id: "debian", name: "VPS Debian", description: "Machine Debian brute, configurez-la comme vous voulez.", icon: "🐧", tag: "Système" },
];

const labels: Record<string, string> = {
  wordpress: "WordPress",
  node: "Server Node",
  multisite: "Server Multisite",
  debian: "VPS Debian",
};

type RunningMachine = {
  id: string;
  machineType: string;
  targetNode: string;
  cpu: number;
  ram: number;
  disk: number;
  access: string;
};

type Props = {
  config: Config;
  setConfig: (c: Partial<Config>) => void;
  onNext: () => void;
};

export default function MachineStep({ config, setConfig, onNext }: Props) {
  const [running, setRunning] = useState<RunningMachine[]>([]);

  useEffect(() => {
    fetch("/api/provision")
      .then((r) => r.json())
      .then((d) => setRunning(d.machines ?? []))
      .catch(() => {});
  }, []);
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choisissez votre machine</h2>
        <p className="mt-2 text-white/40 text-sm">Sélectionnez le type de container à déployer.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {machines.map((m) => {
          const isSelected = config.machineType === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setConfig({ machineType: m.id as Config["machineType"] })}
              className={`text-left p-5 rounded-2xl border transition-all duration-200 outline-none cursor-pointer
                ${isSelected
                  ? "bg-white text-[#0f1117] border-white shadow-lg scale-[1.02]"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{m.icon}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isSelected ? "bg-black/10 text-[#0f1117]" : "bg-white/10 text-white/60"}`}>
                  {m.tag}
                </span>
              </div>
              <p className="font-semibold text-base">{m.name}</p>
              <p className={`text-sm mt-1 ${isSelected ? "text-black/60" : "text-white/40"}`}>{m.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!config.machineType}
          className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all
            ${config.machineType ? "bg-white text-[#0f1117] hover:bg-white/90 cursor-pointer" : "bg-white/10 text-white/30 cursor-not-allowed"}`}
        >
          Continuer →
        </button>
      </div>

      {running.length > 0 && (
        <div className="mt-12">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">
            Machines en cours ({running.length})
          </h3>
          <div className="space-y-3">
            {running.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div>
                  <p className="font-semibold text-sm">{labels[m.machineType] ?? m.machineType}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {m.targetNode === "mac" ? "Mac" : "Windows"} · {m.cpu} cœur{m.cpu > 1 ? "s" : ""} · {m.ram} Mo · {m.disk} Go
                  </p>
                </div>
                {m.access.startsWith("http") ? (
                  <a
                    href={m.access}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline underline-offset-2 hover:text-white/80 shrink-0 ml-3"
                  >
                    Ouvrir →
                  </a>
                ) : (
                  <span className="text-xs text-white/40 shrink-0 ml-3">SSH</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
