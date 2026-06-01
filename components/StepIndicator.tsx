type Props = {
  current: number;
  steps: string[];
};

export default function StepIndicator({ current, steps }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${active ? "bg-white text-[#0f1117]" : done ? "bg-white/30 text-white" : "bg-white/10 text-white/30"}
                `}
              >
                {done ? "✓" : idx}
              </div>
              <span
                className={`text-xs ${active ? "text-white/80" : "text-white/30"}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-px mx-2 mb-5 ${done ? "bg-white/30" : "bg-white/10"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
