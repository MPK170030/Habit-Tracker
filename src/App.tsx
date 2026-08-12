import { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { getLevelInfo, HABIT_EMOJIS } from './types';
import { GokuAvatar } from './components/GokuAvatar';
import { LevelUpModal } from './components/LevelUpModal';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';

// ─── XP Progress Bar ──────────────────────────────────────────────────────────

function XPBar({
  percent, progressXp, requiredXp, nextTitle,
}: {
  percent: number; progressXp: number; requiredXp: number; nextTitle?: string;
}) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{progressXp.toLocaleString()} XP</span>
        <span>{nextTitle ? `${requiredXp.toLocaleString()} → ${nextTitle}` : 'MAX LEVEL ✦'}</span>
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

// ─── Warrior Card ─────────────────────────────────────────────────────────────

function WarriorCard({
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
    <div className="mx-4 mt-4 mb-2 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-2xl">
      <div className="flex items-center gap-4">
        <div
          className="relative flex-shrink-0"
          style={{ width: 100, height: 140, filter: `drop-shadow(0 0 14px ${current.color}55)` }}
        >
          <GokuAvatar level={current.level} />
          <div
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white border-2 border-slate-900 shadow"
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
              className="bg-slate-800 text-white font-bold text-xl w-full rounded-lg px-2 py-1 mb-1 border border-amber-500 outline-none"
            />
          ) : (
            <button
              onClick={() => { setDraft(name); setEditing(true); }}
              className="text-white font-bold text-xl text-left truncate w-full hover:text-amber-400 transition-colors leading-tight mb-0.5"
            >
              {name} <span className="text-base">✏️</span>
            </button>
          )}

          <div className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: current.color }}>
            {current.title}
          </div>

          <XPBar percent={progressPercent} progressXp={progressXp} requiredXp={requiredXp} nextTitle={next?.title} />

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-orange-400 text-sm font-medium">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 text-sm font-bold">{xp.toLocaleString()} XP total</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single Habit Row ─────────────────────────────────────────────────────────

function HabitRow({
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
      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left active:scale-[0.98] ${
        checked
          ? 'bg-emerald-950/40 border-emerald-800/60'
          : 'bg-slate-800/80 border-slate-700 hover:border-amber-600/40 hover:bg-slate-800'
      }`}
    >
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
          checked ? 'bg-emerald-500 border-emerald-500 check-pop' : 'border-slate-600'
        }`}
      >
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <span className="text-2xl flex-shrink-0 leading-none">{habit.emoji}</span>

      <span className={`font-medium text-base flex-1 ${checked ? 'text-slate-500 line-through' : 'text-white'}`}>
        {habit.name}
      </span>

      {pendingRemoval && (
        <span className="flex-shrink-0 text-xs text-slate-500 border border-slate-700 rounded-md px-1.5 py-0.5">
          last day
        </span>
      )}
    </button>
  );
}

// ─── Habit List ───────────────────────────────────────────────────────────────

function HabitList({
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
    <div className="mx-4 my-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-bold text-lg tracking-wide">⚔️ Today's Quests</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={onManage}
          className="text-amber-400 hover:text-amber-300 text-sm font-semibold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-600/60 transition-all"
        >
          + Manage
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-slate-300 font-bold text-lg">No quests yet, warrior!</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">Add daily habits to begin your journey.</p>
          <button onClick={onManage} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
            Add First Quest
          </button>
        </div>
      ) : (
        <>
          {!allDoneToday && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>{done}/{total} quests complete</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {allDoneToday && (
            <div className="quest-complete mb-4 bg-emerald-950/70 border border-emerald-700/60 rounded-xl p-4 text-center">
              <div className="text-3xl mb-1">🏆</div>
              <div className="text-emerald-400 font-bold text-lg">All Quests Complete!</div>
              <div className="text-slate-400 text-sm mt-1">
                {xpEarnedToday
                  ? `XP earned today · 🔥 ${streak} day streak — keep it up!`
                  : 'XP awarded!'}
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

// ─── Manage Habits Panel ──────────────────────────────────────────────────────

function ManagePanel({
  habits, pendingRemovals, onAdd, onEdit, onScheduleRemoval, onCancelRemoval, onClose,
}: {
  habits: Array<{ id: string; name: string; emoji: string }>;
  pendingRemovals: string[];
  onAdd: (name: string, emoji: string) => void;
  onEdit: (id: string, name: string, emoji: string) => void;
  onScheduleRemoval: (id: string) => void;
  onCancelRemoval: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💪');

  // Inline edit state
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [draftName, setDraftName]     = useState('');
  const [draftEmoji, setDraftEmoji]   = useState('💪');

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, emoji);
    setName('');
  }

  function startEdit(h: { id: string; name: string; emoji: string }) {
    setEditingId(h.id);
    setDraftName(h.name);
    setDraftEmoji(h.emoji);
  }

  function saveEdit() {
    const trimmed = draftName.trim();
    if (trimmed && editingId) onEdit(editingId, trimmed, draftEmoji);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] md:max-w-2xl lg:max-w-4xl bg-slate-900 rounded-t-3xl z-50 panel-slide border-t border-slate-700 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        <div className="px-4 pb-8 max-h-[82vh] overflow-y-auto">
          <h2 className="text-white font-bold text-xl mb-4">⚔️ Manage Quests</h2>

          {/* Add new */}
          <div className="bg-slate-800 rounded-2xl p-4 mb-5 border border-slate-700">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Add New Quest</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {HABIT_EMOJIS.map(em => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                    emoji === em
                      ? 'bg-amber-500/20 border-2 border-amber-500 scale-110'
                      : 'bg-slate-700 border-2 border-transparent hover:border-slate-500'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 outline-none border border-slate-600 focus:border-amber-500 transition-colors text-sm"
                placeholder="Quest name…"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                maxLength={40}
              />
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Existing habits */}
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
              Active Quests ({habits.length})
            </p>
            {habits.length === 0 ? (
              <p className="text-slate-600 text-center py-6">No quests yet.</p>
            ) : (
              <div className="space-y-2">
                {habits.map(h => {
                  const isPending = pendingRemovals.includes(h.id);
                  const isEditing = editingId === h.id;

                  if (isEditing) {
                    return (
                      <div key={h.id} className="bg-slate-800 border border-amber-600/50 rounded-xl p-3">
                        {/* Compact emoji picker */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {HABIT_EMOJIS.map(em => (
                            <button
                              key={em}
                              onClick={() => setDraftEmoji(em)}
                              className={`text-lg w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                draftEmoji === em
                                  ? 'bg-amber-500/20 border-2 border-amber-500 scale-110'
                                  : 'bg-slate-700 border-2 border-transparent hover:border-slate-600'
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            className="flex-1 bg-slate-700 text-white rounded-xl px-3 py-2 outline-none border border-amber-500 text-sm"
                            value={draftName}
                            onChange={e => setDraftName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            maxLength={40}
                          />
                          <button
                            onClick={saveEdit}
                            disabled={!draftName.trim()}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-xl text-sm transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={h.id}
                      className={`flex items-center gap-3 rounded-xl p-3 border ${
                        isPending
                          ? 'bg-slate-800/50 border-slate-700/50 opacity-60'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span className="text-2xl leading-none">{h.emoji}</span>
                      <span className={`font-medium flex-1 text-sm ${isPending ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {h.name}
                      </span>
                      {!isPending && (
                        <button
                          onClick={() => startEdit(h)}
                          className="text-slate-400 hover:text-amber-400 hover:bg-slate-700 w-8 h-8 rounded-lg flex items-center justify-center transition-all text-base flex-shrink-0"
                          title="Edit quest"
                        >
                          ✏️
                        </button>
                      )}
                      {isPending ? (
                        <button
                          onClick={() => onCancelRemoval(h.id)}
                          className="text-xs text-amber-400 hover:text-amber-300 border border-amber-800/60 hover:border-amber-600 rounded-lg px-2 py-1 transition-all flex-shrink-0"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() => onScheduleRemoval(h.id)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-950/40 w-8 h-8 rounded-lg flex items-center justify-center transition-all text-lg font-bold flex-shrink-0"
                          title="Remove from tomorrow"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {pendingRemovals.length > 0 && (
              <p className="text-slate-600 text-xs mt-3 text-center">
                Strikethrough quests will be removed at the start of tomorrow.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #080812 0%, #0d0d1f 100%)' }}
    >
      <div className="text-amber-400 text-4xl animate-pulse">⚔️</div>
    </div>
  );
}

// ─── Main App (authenticated) ─────────────────────────────────────────────────

function MainApp() {
  const { logout } = useAuth();
  const {
    loading, state, todayCompletions, allDoneToday, xpEarnedToday,
    addHabit, editHabit, scheduleRemoval, cancelRemoval, updateWarriorName, toggleHabit,
  } = useAppState();

  const [showPanel, setShowPanel] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ prevLevel: number; newLevel: number } | null>(null);

  async function handleToggle(habitId: string) {
    const result = await toggleHabit(habitId);
    if (result.leveledUp) setLevelUpData({ prevLevel: result.prevLevel, newLevel: result.newLevel });
  }

  if (loading) return <LoadingScreen />;

  const { current } = getLevelInfo(state.xp);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #080812 0%, #0d0d1f 100%)' }}>
      <div className="sticky top-0 z-30 border-b border-slate-800/60" style={{ background: 'rgba(8,8,18,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-[480px] md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-amber-400 font-black text-lg tracking-wider uppercase">⚔️ Warrior Habits</h1>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Lv.{current.level}</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${current.color}22`, color: current.color, border: `1px solid ${current.color}44` }}
            >
              {current.title}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              className="text-slate-600 hover:text-slate-300 text-sm ml-1 transition-colors leading-none"
            >
              ↩
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] md:max-w-2xl lg:max-w-4xl mx-auto pb-10">
        <WarriorCard
          name={state.warriorName}
          xp={state.xp}
          streak={state.streak}
          onNameEdit={updateWarriorName}
        />
        <HabitList
          habits={state.habits}
          pendingRemovals={state.pendingRemovals}
          completedIds={todayCompletions}
          allDoneToday={allDoneToday}
          xpEarnedToday={xpEarnedToday}
          streak={state.streak}
          onToggle={handleToggle}
          onManage={() => setShowPanel(true)}
        />
      </div>

      {showPanel && (
        <ManagePanel
          habits={state.habits}
          pendingRemovals={state.pendingRemovals}
          onAdd={addHabit}
          onEdit={editHabit}
          onScheduleRemoval={scheduleRemoval}
          onCancelRemoval={cancelRemoval}
          onClose={() => setShowPanel(false)}
        />
      )}

      {levelUpData && (
        <LevelUpModal {...levelUpData} onClose={() => setLevelUpData(null)} />
      )}
    </div>
  );
}

// ─── Root App (auth gate) ─────────────────────────────────────────────────────

export default function App() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <AuthPage />;
  return <MainApp />;
}
