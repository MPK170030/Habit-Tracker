export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
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
