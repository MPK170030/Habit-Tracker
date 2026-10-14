export function XPBar({
  percent, progressXp, requiredXp, nextTitle,
}: {
  percent: number; progressXp: number; requiredXp: number; nextTitle?: string;
}) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm lg:text-base text-slate-400 mb-1">
        <span>{progressXp.toLocaleString()} XP</span>
        <span>{nextTitle ? `${requiredXp.toLocaleString()} → ${nextTitle}` : 'MAX DEPTH ✦'}</span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div
          className="h-full rounded-full xp-bar-fill transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
