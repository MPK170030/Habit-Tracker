import { getLevelFromXp, getPreviousDay, getCutoffDate, getClientDate } from '../lib/dates';

describe('getLevelFromXp', () => {
  it('returns level 1 below the first threshold', () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(149)).toBe(1);
  });

  it('returns the correct level at every threshold boundary', () => {
    expect(getLevelFromXp(150)).toBe(2);
    expect(getLevelFromXp(400)).toBe(3);
    expect(getLevelFromXp(800)).toBe(4);
    expect(getLevelFromXp(1500)).toBe(5);
    expect(getLevelFromXp(2500)).toBe(6);
    expect(getLevelFromXp(4000)).toBe(7);
  });

  it('stays at the lower level one XP before each threshold', () => {
    expect(getLevelFromXp(149)).toBe(1);
    expect(getLevelFromXp(399)).toBe(2);
    expect(getLevelFromXp(799)).toBe(3);
    expect(getLevelFromXp(1499)).toBe(4);
    expect(getLevelFromXp(2499)).toBe(5);
    expect(getLevelFromXp(3999)).toBe(6);
  });

  it('caps at level 7 for very high XP values', () => {
    expect(getLevelFromXp(99_999)).toBe(7);
  });
});

describe('getPreviousDay', () => {
  it('returns the day before a mid-month date', () => {
    expect(getPreviousDay('2024-03-15')).toBe('2024-03-14');
  });

  it('wraps correctly at a month boundary', () => {
    expect(getPreviousDay('2024-04-01')).toBe('2024-03-31');
  });

  it('handles February in a leap year', () => {
    expect(getPreviousDay('2024-03-01')).toBe('2024-02-29');
  });

  it('handles February in a non-leap year', () => {
    expect(getPreviousDay('2023-03-01')).toBe('2023-02-28');
  });

  it('wraps correctly at a year boundary', () => {
    expect(getPreviousDay('2024-01-01')).toBe('2023-12-31');
  });
});

describe('getCutoffDate', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(getCutoffDate(90)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns yesterday when called with 1', () => {
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    expect(getCutoffDate(1)).toBe(expected.toISOString().split('T')[0]);
  });

  it('returns today when called with 0', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getCutoffDate(0)).toBe(today);
  });
});

describe('getClientDate', () => {
  it('uses the X-Local-Date header when valid', () => {
    const req = { headers: { 'x-local-date': '2024-06-15' } };
    expect(getClientDate(req as any)).toBe('2024-06-15');
  });

  it('falls back to server date when header is absent', () => {
    const result = getClientDate({ headers: {} } as any);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back when the header is not a valid date string', () => {
    const req = { headers: { 'x-local-date': 'not-a-date' } };
    const result = getClientDate(req as any);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).not.toBe('not-a-date');
  });

  it('falls back when the header is an array', () => {
    const req = { headers: { 'x-local-date': ['2024-06-15', '2024-06-16'] } };
    const result = getClientDate(req as any);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
