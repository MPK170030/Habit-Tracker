import { describe, it, expect } from 'vitest';
import { getLevelInfo, LEVELS } from '../types';

describe('getLevelInfo', () => {
  it('starts at level 1 with 0 XP', () => {
    const { current, progressXp, progressPercent } = getLevelInfo(0);
    expect(current.level).toBe(1);
    expect(progressXp).toBe(0);
    expect(progressPercent).toBe(0);
  });

  it('identifies the correct next level', () => {
    const { next } = getLevelInfo(0);
    expect(next?.level).toBe(2);
  });

  it('calculates progress percent correctly within a tier', () => {
    // Level 1 spans 0–149 XP (range: 150). At 75 XP: 75/150 = 50%.
    const { progressPercent, progressXp } = getLevelInfo(75);
    expect(progressXp).toBe(75);
    expect(progressPercent).toBe(50);
  });

  it('treats the exact threshold as the start of the new level', () => {
    const { current } = getLevelInfo(150);
    expect(current.level).toBe(2);
  });

  it('keeps level at 2 one XP below the next threshold', () => {
    // Level 3 starts at 400, so 399 is still level 2.
    expect(getLevelInfo(399).current.level).toBe(2);
    expect(getLevelInfo(400).current.level).toBe(3);
  });

  it('returns null for next at max level and clamps progress to 100%', () => {
    const { next, progressPercent } = getLevelInfo(99_999);
    expect(next).toBeNull();
    expect(progressPercent).toBe(100);
  });

  it('returns the correct level at every threshold in LEVELS', () => {
    for (const level of LEVELS) {
      const { current } = getLevelInfo(level.minXp);
      expect(current.level).toBe(level.level);
    }
  });

  it('returns the level colour matching the LEVELS definition', () => {
    const { current } = getLevelInfo(400); // level 3
    const expected = LEVELS.find(l => l.level === 3)?.color;
    expect(current.color).toBe(expected);
  });
});
