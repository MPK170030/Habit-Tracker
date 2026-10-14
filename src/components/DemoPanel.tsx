import { useState } from 'react';

interface Props {
  onSimulate: () => Promise<void>;
  leveledUpViaSimulation: boolean;
}

export function DemoPanel({ onSimulate, leveledUpViaSimulation }: Props) {
  const [simulating, setSimulating] = useState(false);

  async function handleSimulate() {
    setSimulating(true);
    try {
      await onSimulate();
    } finally {
      setSimulating(false);
    }
  }

  const disabled = leveledUpViaSimulation || simulating;

  return (
    <div className="mb-5 rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-black tracking-widest uppercase text-cyan-500 bg-cyan-500/10 border border-cyan-500/30 rounded-md px-2 py-0.5">
          Demo
        </span>
        <span className="text-slate-500 text-sm">Shared account · resets periodically</span>
      </div>

      <div className="space-y-1 mb-4 text-sm text-slate-400">
        <p>① Check off all habits to earn XP and see your streak climb.</p>
        <p>② Hit <span className="text-cyan-400 font-medium">Simulate Next Day</span> to advance a day and earn XP again.</p>
        <p>③ Complete habits once more — you're 100 XP from a level-up.</p>
      </div>

      <div className="flex items-start justify-between gap-4 pt-3 border-t border-cyan-900/30">
        <p className="text-xs text-slate-600 leading-relaxed max-w-[55%]">
          Real account: private data, genuine streak, unlimited habits.{' '}
          <span className="text-slate-500">Sign up to keep your progress.</span>
        </p>

        <button
          onClick={handleSimulate}
          disabled={disabled}
          className={`flex-shrink-0 text-sm font-bold px-4 py-2 rounded-lg border transition-all ${
            leveledUpViaSimulation
              ? 'border-slate-700 text-slate-600 cursor-not-allowed'
              : disabled
              ? 'border-slate-700 text-slate-500 cursor-not-allowed'
              : 'border-cyan-700 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500 active:scale-95'
          }`}
        >
          {simulating
            ? 'Resetting…'
            : leveledUpViaSimulation
            ? '✓ Level-up reached'
            : '⏩ Simulate Next Day'}
        </button>
      </div>
    </div>
  );
}
