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
  diverName: string;
  pendingRemovals: string[];
  lastActiveDate: string | null;
}

export const LEVELS = [
  { level: 1, title: 'Shore Diver',   zone: 'Sunlit Zone',    depth: '0–200m',       minXp: 0,    color: '#22d3ee' },
  { level: 2, title: 'Open Water',    zone: 'Twilight Zone',  depth: '200–1,000m',   minXp: 150,  color: '#38bdf8' },
  { level: 3, title: 'Deep Diver',    zone: 'Midnight Zone',  depth: '1,000–4,000m', minXp: 400,  color: '#60a5fa' },
  { level: 4, title: 'Abyssal Scout', zone: 'Abyssal Zone',   depth: '4,000–6,000m', minXp: 800,  color: '#818cf8' },
  { level: 5, title: 'Hadal Pioneer', zone: 'Hadal Zone',     depth: '6,000–8,000m', minXp: 1500, color: '#a78bfa' },
  { level: 6, title: 'Trench Diver',  zone: 'Mariana Trench', depth: '8,000–11,000m',minXp: 2500, color: '#c084fc' },
  { level: 7, title: 'Abyss Master',  zone: 'The Deep',       depth: '11,000m+',     minXp: 4000, color: '#f472b6' },
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
  '😴', '✍️', '🏃', '🧠', '🌿',
];
