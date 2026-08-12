export interface Habit {
  id: string;
  name: string;
  emoji: string;
}

export interface AppState {
  habits: Habit[];
  xp: number;
  streak: number;
  lastCompletedDate: string | null;
  dailyCompletions: Record<string, string[]>;
  xpEarnedDates: string[];
  warriorName: string;
  pendingRemovals: string[]; // habit IDs to remove at next day start
  lastActiveDate: string | null;
}

export const LEVELS = [
  { level: 1, title: 'Base Form',        minXp: 0,    color: '#ea580c' },
  { level: 2, title: 'Ultra Instinct',   minXp: 150,  color: '#94a3b8' },
  { level: 3, title: 'Super Saiyan',     minXp: 400,  color: '#eab308' },
  { level: 4, title: 'Super Saiyan 2',   minXp: 800,  color: '#facc15' },
  { level: 5, title: 'Super Saiyan 3',   minXp: 1500, color: '#ca8a04' },
  { level: 6, title: 'Super Saiyan God', minXp: 2500, color: '#e11d48' },
  { level: 7, title: 'Super Saiyan Blue', minXp: 4000, color: '#2563eb' },
] as const;

export type LevelEntry = typeof LEVELS[number];

export function getLevelInfo(xp: number) {
  let currentIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) currentIdx = i;
    else break;
  }
  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1] ?? null;
  const progressXp = xp - current.minXp;
  const requiredXp = next ? next.minXp - current.minXp : 1;
  const progressPercent = next ? Math.min((progressXp / requiredXp) * 100, 100) : 100;
  return { current, next, progressPercent, progressXp, requiredXp };
}

export const HABIT_EMOJIS = [
  '💪', '📚', '🧘', '💧', '🍎',
  '😴', '✍️', '🧹', '🏃', '🎯',
  '🎸', '🌿', '🧠', '🏋️', '🚴',
];
