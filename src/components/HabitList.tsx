import { HabitRow } from './HabitRow';

export function HabitList({
  habits, pendingRemovals, completedIds, allDoneToday, xpEarnedToday, streak, onToggle, onManage,
}: {
  habits: Array<{ id: string; name: string; emoji: string }>;
  pendingRemovals: string[];
  completedIds: string[];
  allDoneToday: boolean;
  xpEarnedToday: boolean;
  streak: number;
  onToggle: (id: string) => void;
  onManage: () => void;
}) {
  const done  = completedIds.filter(id => habits.some(h => h.id === id)).length;
  const total = habits.length;
  const pct   = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="my-2 lg:my-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-2xl lg:text-3xl tracking-wide">🤿 Today's Dive</h2>
          <p className="text-slate-500 text-base mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={onManage}
          className="text-cyan-400 hover:text-cyan-300 text-base lg:text-lg font-semibold bg-slate-800 px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg border border-slate-700 hover:border-cyan-600/60 transition-all"
        >
          + Manage
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🌊</div>
          <p className="text-slate-300 font-bold text-xl">No objectives set, diver.</p>
          <p className="text-slate-500 text-base mt-1 mb-5">Log your objectives to begin your descent.</p>
          <button onClick={onManage} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-colors">
            Set First Objective
          </button>
        </div>
      ) : (
        <>
          {!allDoneToday && (
            <div className="mb-5">
              <div className="flex justify-between text-base text-slate-500 mb-1.5">
                <span>{done}/{total} objectives complete</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {allDoneToday && (
            <div className="quest-complete mb-5 bg-emerald-950/70 border border-emerald-700/60 rounded-xl p-5 text-center">
              <div className="text-4xl mb-1">🏆</div>
              <div className="text-emerald-400 font-bold text-2xl">Dive Complete!</div>
              <div className="text-slate-400 text-lg mt-1">
                {xpEarnedToday
                  ? `Dive logged · 🤿 ${streak}-day streak — keep descending!`
                  : 'All objectives complete!'}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {habits.map(h => (
              <HabitRow
                key={h.id}
                habit={h}
                checked={completedIds.includes(h.id)}
                pendingRemoval={pendingRemovals.includes(h.id)}
                onToggle={() => onToggle(h.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
