"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import MachineStep from "@/components/MachineStep";
import ConfigStep from "@/components/ConfigStep";
import ReviewStep from "@/components/ReviewStep";

export type Config = {
  machineType: "wordpress" | "node" | "multisite" | "debian";
  targetNode: "mac" | "windows";
  cpu: 0.5 | 1 | 2;
  ram: number;
  disk: number;
};

const STEPS = ["Machine", "Ressources", "Lancement"];

export default function Home() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Config>({
    machineType: "wordpress",
    targetNode: "mac",
    cpu: 1,
    ram: 1024,
    disk: 10,
  });

  const update = (partial: Partial<Config>) =>
    setConfig((prev) => ({ ...prev, ...partial }));

  return (
    <main className="min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase bg-white/10 rounded-full">
            Provisioning local
          </span>
        </div>

        <StepIndicator current={step} steps={STEPS} />

        {step === 1 && (
          <MachineStep
            config={config}
            setConfig={update}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <ConfigStep
            config={config}
            setConfig={update}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ReviewStep
            config={config}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </main>
  );
}
