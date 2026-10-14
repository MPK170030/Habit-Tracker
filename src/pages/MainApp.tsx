import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { getLevelInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DiverCard } from '../components/DiverCard';
import { HabitList } from '../components/HabitList';
import { ManagePanel } from '../components/ManagePanel';
import { LoadingScreen } from '../components/LoadingScreen';
import { LevelUpModal } from '../components/LevelUpModal';
import { DemoPanel } from '../components/DemoPanel';

export function MainApp() {
  const { user, logout } = useAuth();
  const {
    loading, state, todayCompletions, allDoneToday, xpEarnedToday,
    addHabit, editHabit, scheduleRemoval, cancelRemoval, updateDiverName, toggleHabit,
    simulateDay,
  } = useAppState();

  const [showPanel, setShowPanel]                     = useState(false);
  const [levelUpData, setLevelUpData]                 = useState<{ prevLevel: number; newLevel: number } | null>(null);
  const [simUsed, setSimUsed]                         = useState(false);
  const [leveledUpViaSimulation, setLeveledUpViaSim]  = useState(false);

  const isDemo = user?.email === 'demo@warrior.dev';

  async function handleToggle(habitId: string) {
    const result = await toggleHabit(habitId);
    if (result.leveledUp) {
      setLevelUpData({ prevLevel: result.prevLevel, newLevel: result.newLevel });
      if (simUsed) setLeveledUpViaSim(true);
    }
  }

  async function handleSimulate() {
    await simulateDay();
    setSimUsed(true);
  }

  if (loading) return <LoadingScreen />;

  const { current } = getLevelInfo(state.xp);

  return (
    <div className="min-h-screen relative" style={{ zIndex: 1 }}>
      <div className="sticky top-0 z-30 border-b border-slate-800/60" style={{ background: 'rgba(8,8,18,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="w-full px-6 lg:px-14 py-5 lg:py-6 flex items-center justify-between">
          <h1 className="text-cyan-400 font-black text-3xl tracking-wider uppercase">🌊 Fathom</h1>
          <div className="flex items-center gap-4 lg:gap-5">
            <span className="text-slate-500 text-xl">Lv.{current.level}</span>
            <span
              className="text-xl font-bold px-4 py-2 rounded-full"
              style={{ background: `${current.color}22`, color: current.color, border: `1px solid ${current.color}44` }}
            >
              {current.title}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              className="text-slate-600 hover:text-slate-300 text-2xl ml-1 transition-colors leading-none"
            >
              ↩
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 lg:px-10 pb-10">
        <div className="lg:grid lg:grid-cols-[40%_60%] lg:gap-0 lg:items-start lg:pt-6 lg:h-[calc(100vh-73px)]">
          <div className="lg:sticky lg:top-[73px] lg:pr-8 lg:mr-4 lg:bg-slate-950/60 lg:backdrop-blur-md lg:rounded-2xl lg:p-6">
            <DiverCard
              name={state.diverName}
              xp={state.xp}
              streak={state.streak}
              onNameEdit={updateDiverName}
            />
          </div>
          <div className="lg:pt-4 lg:pl-8 lg:border-l lg:border-slate-800/40 lg:bg-slate-950/50 lg:backdrop-blur-md lg:rounded-2xl lg:p-6">
            {isDemo && (
              <DemoPanel
                onSimulate={handleSimulate}
                leveledUpViaSimulation={leveledUpViaSimulation}
              />
            )}
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
        </div>
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
