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

export function getLevelFromXp(xp: number): number {
  if (xp >= 4000) return 7;
  if (xp >= 2500) return 6;
  if (xp >= 1500) return 5;
  if (xp >= 800)  return 4;
  if (xp >= 400)  return 3;
  if (xp >= 150)  return 2;
  return 1;
}
