import { useState } from "react";
import type { Config } from "@/app/page";

const machineLabels: Record<Config["machineType"], string> = {
  wordpress: "WordPress",
  node: "Server Node",
  multisite: "Server Multisite",
  debian: "VPS Debian",
};

type Props = {
  config: Config;
  onBack: () => void;
};

export default function ReviewStep({ config, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ link: string; pass: string } | null>(null);

  const handleProvision = async () => {
    setLoading(true);
    
    //Faux timeout pour faire genre d'attendre t'a capté et tout
    // setTimeout(() => {
    //   setResult({ link: "http://192.168.1.25:8080", pass: "K9s_Secure_Pwd" });
    //   setLoading(false);
    // }, 3000);µ
    
    try {
      const res = await fetch("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setResult({ link: data.link ?? "N/A", pass: data.pass ?? "N/A" });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    { label: "Machine", value: machineLabels[config.machineType] },
    { label: "Node", value: config.targetNode === "mac" ? "🍎 Mac (ARM64)" : "🪟 Windows (x86)" },
    { label: "CPU", value: `${config.cpu} cœur${config.cpu > 1 ? "s" : ""}` },
    { label: "RAM", value: `${config.ram} Mo` },
    { label: "Stockage", value: `${config.disk} Go` },
  ];

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Récapitulatif</h2>
        <p className="mt-2 text-white/40 text-sm">Vérifiez votre configuration avant de lancer.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex justify-between items-center px-5 py-4 ${i < rows.length - 1 ? "border-b border-white/10" : ""}`}
          >
            <span className="text-white/40 text-sm">{row.label}</span>
            <span className="text-white font-semibold text-sm">{row.value}</span>
          </div>
        ))}
      </div>

      {!result && (
        <div className="flex justify-between items-center">
          <button onClick={onBack} disabled={loading} className="px-6 py-3 rounded-xl text-sm text-white/40 hover:text-white transition cursor-pointer disabled:cursor-not-allowed">
            ← Retour
          </button>
          <button
            onClick={handleProvision}
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all
              ${loading ? "bg-white/20 text-white/40 cursor-not-allowed" : "bg-white text-[#0f1117] hover:bg-white/90 cursor-pointer"}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Provisioning…
              </span>
            ) : "🚀 Lancer le Provider"}
          </button>
        </div>
      )}

      {result && (
        <div className="p-5 bg-white/5 border border-white/20 rounded-2xl">
          <p className="text-white font-bold mb-4">✅ Machine déployée avec succès !</p>
          <div className="space-y-3">
            <div>
              <p className="text-white/40 text-xs mb-1">Lien d'accès</p>
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline underline-offset-2 text-sm hover:text-white/80"
              >
                {result.link}
              </a>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Mot de passe</p>
              <code className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-sm font-mono">
                {result.pass}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
