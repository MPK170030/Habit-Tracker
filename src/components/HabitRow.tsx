export function HabitRow({
  habit, checked, pendingRemoval, onToggle,
}: {
  habit: { id: string; name: string; emoji: string };
  checked: boolean;
  pendingRemoval: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 lg:gap-4 p-4 lg:p-5 rounded-xl border transition-all duration-200 text-left active:scale-[0.98] ${
        checked
          ? 'bg-emerald-950/40 border-emerald-800/60'
          : 'bg-slate-800/80 border-slate-700 hover:border-cyan-600/40 hover:bg-slate-800'
      }`}
    >
      <div
        className={`flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
          checked ? 'bg-emerald-500 border-emerald-500 check-pop' : 'border-slate-600'
        }`}
      >
        {checked && (
          <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <span className="text-2xl lg:text-3xl flex-shrink-0 leading-none">{habit.emoji}</span>

      <span className={`font-medium text-lg lg:text-xl flex-1 ${checked ? 'text-slate-500 line-through' : 'text-white'}`}>
        {habit.name}
      </span>

      {pendingRemoval && (
        <span className="flex-shrink-0 text-sm lg:text-base text-slate-500 border border-slate-700 rounded-md px-1.5 py-0.5">
          last day
        </span>
      )}
    </button>
  );
}
