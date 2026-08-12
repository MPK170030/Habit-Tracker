import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const habitSchema = z.object({
  name:  z.string().min(1).max(100),
  emoji: z.string().min(1).max(10),
});

// POST /api/habits  — add a habit
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = habitSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const habit = await prisma.habit.create({
    data: { ...result.data, userId: req.userId! },
  });
  res.status(201).json(habit);
});

// PATCH /api/habits/:id  — edit name / emoji
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = habitSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }

  const updated = await prisma.habit.update({
    where: { id: req.params.id },
    data:  result.data,
  });
  res.json(updated);
});

// DELETE /api/habits/:id  — schedule removal (takes effect next day)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }

  const updated = await prisma.habit.update({
    where: { id: req.params.id },
    data:  { isPendingRemoval: true },
  });
  res.json(updated);
});

// PATCH /api/habits/:id/cancel-removal  — undo a scheduled removal
router.patch('/:id/cancel-removal', async (req: AuthRequest, res: Response): Promise<void> => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }

  const updated = await prisma.habit.update({
    where: { id: req.params.id },
    data:  { isPendingRemoval: false },
  });
  res.json(updated);
});

export default router;
