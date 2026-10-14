import { useState, lazy, Suspense } from 'react';
import { getLevelInfo } from '../types';
import { XPBar } from './XPBar';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';

const OceanAvatar = lazy(() => import('./OceanAvatar'));

export function DiverCard({
  name, xp, streak, onNameEdit,
}: {
  name: string; xp: number; streak: number; onNameEdit: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const { current, next, progressPercent, progressXp, requiredXp } = getLevelInfo(xp);

  function save() {
    onNameEdit(draft.trim() || name);
    setEditing(false);
  }

  return (
    <div className="mt-4 mb-2 lg:mt-0 lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:shadow-none lg:p-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-800 shadow-2xl">
      <div className="flex items-center gap-4 lg:gap-6">
        <div
          className="relative flex-shrink-0 w-[100px] h-[140px] lg:w-[140px] lg:h-[185px]"
          style={{ filter: `drop-shadow(0 0 14px ${current.color}55)` }}
        >
          <CanvasErrorBoundary fallback={
            <div className="w-full h-full flex items-center justify-center text-5xl lg:text-6xl">🤿</div>
          }>
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center text-5xl lg:text-6xl">🤿</div>
            }>
              <OceanAvatar level={current.level} />
            </Suspense>
          </CanvasErrorBoundary>
          <div
            className="absolute -bottom-1 -right-1 w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-sm lg:text-base font-black text-white border-2 border-slate-900 shadow"
            style={{ background: current.color }}
          >
            {current.level}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus maxLength={20} value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
              className="bg-slate-800 text-white font-bold text-2xl lg:text-3xl w-full rounded-lg px-2 py-1 mb-1 border border-cyan-500 outline-none"
            />
          ) : (
            <button
              onClick={() => { setDraft(name); setEditing(true); }}
              className="text-white font-bold text-2xl lg:text-3xl text-left truncate w-full hover:text-cyan-400 transition-colors leading-tight mb-0.5"
            >
              {name} <span className="text-lg">✏️</span>
            </button>
          )}

          <div className="text-sm lg:text-base font-black tracking-widest uppercase mb-3" style={{ color: current.color }}>
            {current.title}
          </div>

          <XPBar percent={progressPercent} progressXp={progressXp} requiredXp={requiredXp} nextTitle={next?.title} />

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-cyan-400 text-base lg:text-lg font-medium">🤿 {streak} dive{streak !== 1 ? 's' : ''}</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 text-base lg:text-lg font-bold">{xp.toLocaleString()} XP total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
