import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getLevelInfo } from '../types';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

type HabitEntry = { id: string; name: string; emoji: string; isPendingRemoval: boolean };

export interface AppStateVM {
  habits: { id: string; name: string; emoji: string }[];
  pendingRemovals: string[];
  xp: number;
  streak: number;
  warriorName: string;
}

export function useAppState() {
  const today = getToday();

  const [loading, setLoading]               = useState(true);
  const [xp, setXp]                         = useState(0);
  const [streak, setStreak]                 = useState(0);
  const [warriorName, setWarriorName]       = useState('Goku');
  const [habits, setHabits]                 = useState<HabitEntry[]>([]);
  const [dailyCompletions, setDailyCompletions] = useState<Record<string, string[]>>({});
  const [xpEarnedDates, setXpEarnedDates]   = useState<string[]>([]);

  async function loadState() {
    const data = await api.user.state();
    setXp(data.xp);
    setStreak(data.streak);
    setWarriorName(data.warriorName);
    setHabits(data.habits.map(h => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      isPendingRemoval: h.isPendingRemoval,
    })));
    setDailyCompletions(data.dailyCompletions);
    setXpEarnedDates(data.xpEarnedDates);
  }

  useEffect(() => {
    Promise.all([api.progress.dayStart(), loadState()])
      .finally(() => setLoading(false));
  }, []);

  const todayCompletions: string[] = dailyCompletions[today] ?? [];
  const xpEarnedToday = xpEarnedDates.includes(today);
  const activeHabits  = habits.filter(h => !h.isPendingRemoval);
  const allDoneToday  = activeHabits.length > 0 && activeHabits.every(h => todayCompletions.includes(h.id));

  const state: AppStateVM = {
    habits:          habits.map(({ id, name, emoji }) => ({ id, name, emoji })),
    pendingRemovals: habits.filter(h => h.isPendingRemoval).map(h => h.id),
    xp,
    streak,
    warriorName,
  };

  async function addHabit(name: string, emoji: string) {
    const tempId = `temp-${crypto.randomUUID()}`;
    setHabits(prev => [...prev, { id: tempId, name, emoji, isPendingRemoval: false }]);
    try {
      const h = await api.habits.add(name, emoji);
      setHabits(prev => prev.map(x =>
        x.id === tempId
          ? { id: h.id, name: h.name, emoji: h.emoji, isPendingRemoval: h.isPendingRemoval }
          : x
      ));
    } catch {
      setHabits(prev => prev.filter(x => x.id !== tempId));
    }
  }

  async function editHabit(id: string, name: string, emoji: string) {
    const original = habits.find(h => h.id === id);
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name, emoji } : h));
    try {
      await api.habits.edit(id, name, emoji);
    } catch {
      if (original) setHabits(prev => prev.map(h => h.id === id ? original : h));
    }
  }

  async function scheduleRemoval(id: string) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, isPendingRemoval: true } : h));
    try {
      await api.habits.scheduleRemoval(id);
    } catch {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, isPendingRemoval: false } : h));
    }
  }

  async function cancelRemoval(id: string) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, isPendingRemoval: false } : h));
    try {
      await api.habits.cancelRemoval(id);
    } catch {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, isPendingRemoval: true } : h));
    }
  }

  async function toggleHabit(habitId: string): Promise<{
    leveledUp: boolean;
    prevLevel: number;
    newLevel: number;
    xpGained: number;
  }> {
    const wasChecked = (dailyCompletions[today] ?? []).includes(habitId);
    const prevXp     = xp;
    const prevLevel  = getLevelInfo(prevXp).current.level;

    setDailyCompletions(prev => ({
      ...prev,
      [today]: wasChecked
        ? (prev[today] ?? []).filter(id => id !== habitId)
        : [...(prev[today] ?? []), habitId],
    }));

    try {
      const result = await api.progress.toggle(habitId);

      if (result.xpGained > 0) {
        const newXp    = prevXp + result.xpGained;
        const newLevel = getLevelInfo(newXp).current.level;
        setXp(newXp);
        setXpEarnedDates(prev => prev.includes(today) ? prev : [...prev, today]);
        loadState().catch(() => {}); // background sync for streak + accurate server state
        return { leveledUp: result.leveledUp, prevLevel, newLevel, xpGained: result.xpGained };
      }

      return { leveledUp: false, prevLevel, newLevel: prevLevel, xpGained: 0 };
    } catch {
      setDailyCompletions(prev => ({
        ...prev,
        [today]: wasChecked
          ? [...(prev[today] ?? []), habitId]
          : (prev[today] ?? []).filter(id => id !== habitId),
      }));
      return { leveledUp: false, prevLevel, newLevel: prevLevel, xpGained: 0 };
    }
  }

  async function updateWarriorName(name: string) {
    const prev = warriorName;
    setWarriorName(name);
    try {
      await api.user.updateWarriorName(name);
    } catch {
      setWarriorName(prev);
    }
  }

  return {
    loading,
    state,
    today,
    todayCompletions,
    allDoneToday,
    xpEarnedToday,
    addHabit,
    scheduleRemoval,
    cancelRemoval,
    editHabit,
    toggleHabit,
    updateWarriorName,
  };
}
