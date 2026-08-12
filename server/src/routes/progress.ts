import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getToday, getYesterday, getCutoffDate, getLevelFromXp } from '../lib/dates';

const router = Router();
router.use(requireAuth);

// POST /api/progress/day-start
// Call this when the app loads. Flushes pending removals and prunes old data
// if the date has changed since the user last opened the app.
router.post('/day-start', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const today  = getToday();
  const cutoff = getCutoffDate(90);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.lastActiveDate === today) {
    res.json({ processed: false });
    return;
  }

  // New day: flush pending-removal habits + prune old records in one transaction
  await prisma.$transaction([
    prisma.habit.deleteMany({ where: { userId, isPendingRemoval: true } }),
    prisma.dailyCompletion.deleteMany({ where: { userId, date: { lt: cutoff } } }),
    prisma.xpEarnedDate.deleteMany({ where: { userId, date: { lt: cutoff } } }),
    prisma.user.update({ where: { id: userId }, data: { lastActiveDate: today } }),
  ]);

  res.json({ processed: true });
});

// POST /api/progress/toggle
// Checks or unchecks a habit for today, awards XP if all habits are done.
router.post('/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ habitId: z.string() });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const userId  = req.userId!;
  const { habitId } = result.data;
  const today   = getToday();

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }

  // Toggle completion
  const existing = await prisma.dailyCompletion.findUnique({
    where: { userId_date_habitId: { userId, date: today, habitId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.dailyCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.dailyCompletion.create({ data: { userId, date: today, habitId } });
  }

  // Check if all active habits are now complete
  const [allHabits, completionsToday] = await Promise.all([
    prisma.habit.findMany({
      where:  { userId, isPendingRemoval: false },
      select: { id: true },
    }),
    prisma.dailyCompletion.findMany({
      where:  { userId, date: today },
      select: { habitId: true },
    }),
  ]);

  const completedIds = new Set(completionsToday.map(c => c.habitId));
  const allDone = allHabits.length > 0 && allHabits.every(h => completedIds.has(h.id));

  let xpGained  = 0;
  let leveledUp = false;

  if (allDone) {
    const alreadyEarned = await prisma.xpEarnedDate.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!alreadyEarned) {
      const user      = await prisma.user.findUnique({ where: { id: userId } });
      const yesterday = getYesterday();
      const newStreak = user!.lastCompletedDate === yesterday ? user!.streak + 1 : 1;

      xpGained       = 50 + Math.min(newStreak * 5, 50);
      const newXp    = user!.xp + xpGained;
      const prevLevel = getLevelFromXp(user!.xp);
      const newLevel  = getLevelFromXp(newXp);
      leveledUp       = newLevel > prevLevel;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data:  { xp: newXp, streak: newStreak, lastCompletedDate: today },
        }),
        prisma.xpEarnedDate.create({ data: { userId, date: today } }),
      ]);
    }
  }

  res.json({ allDone, xpGained, leveledUp, checked: !existing });
});

export default router;
