export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getClientDate(req: { headers: Record<string, string | string[] | undefined> }): string {
  const header = req.headers['x-local-date'];
  if (typeof header === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(header)) {
    return header;
  }
  return getToday();
}

export function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getCutoffDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// XP thresholds per level — must mirror LEVELS[].minXp in src/types.ts
const LEVEL_THRESHOLDS = [0, 150, 400, 800, 1500, 2500, 4000];

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}
