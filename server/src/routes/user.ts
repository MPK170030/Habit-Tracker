import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getCutoffDate } from '../lib/dates';

const router = Router();
router.use(requireAuth);

// GET /api/user/state  — full app state the frontend needs on load
router.get('/state', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId  = req.userId!;
  const cutoff  = getCutoffDate(90);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      habits: {
        orderBy: { createdAt: 'asc' },
      },
      dailyCompletions: {
        where:  { date: { gte: cutoff } },
        select: { date: true, habitId: true },
      },
      xpEarnedDates: {
        where:  { date: { gte: cutoff } },
        select: { date: true },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Reshape dailyCompletions into { "YYYY-MM-DD": ["habitId", ...] }
  const dailyCompletions: Record<string, string[]> = {};
  for (const dc of user.dailyCompletions) {
    if (!dailyCompletions[dc.date]) dailyCompletions[dc.date] = [];
    dailyCompletions[dc.date].push(dc.habitId);
  }

  const { password, dailyCompletions: _, xpEarnedDates, ...rest } = user;
  res.json({
    ...rest,
    dailyCompletions,
    xpEarnedDates: xpEarnedDates.map(x => x.date),
  });
});

// PATCH /api/user/warrior-name
router.patch('/warrior-name', async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ warriorName: z.string().min(1).max(50) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const user = await prisma.user.update({
    where:  { id: req.userId! },
    data:   { warriorName: result.data.warriorName },
    select: { warriorName: true },
  });
  res.json(user);
});

export default router;
