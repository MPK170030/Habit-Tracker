import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../lib/email';

const router = Router();

const registerSchema = z.object({
  name:        z.string().min(1).max(100),
  email:       z.string().email(),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  warriorName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: number): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

const safeUserSelect = {
  id:               true,
  name:             true,
  email:            true,
  warriorName:      true,
  xp:               true,
  streak:           true,
  lastCompletedDate: true,
  lastActiveDate:   true,
  createdAt:        true,
} as const;

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { name, email, password, warriorName } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hash, warriorName: warriorName ?? 'Goku' },
    select: safeUserSelect,
  });

  res.status(201).json({ token: signToken(user.id), user });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json({ token: signToken(user.id), user: safeUser });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({ email: z.string().email() });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });

  // Always respond the same way to prevent email enumeration
  if (!user) {
    res.json({ message: 'If that email exists, a reset link has been sent.' });
    return;
  }

  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
  const resetUrl  = `${clientUrl}?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    token:    z.string().min(1),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { token, password } = result.data;

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.used || record.expiresAt < new Date()) {
    res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  res.json({ message: 'Password updated. You can now sign in.' });
});

// GET /api/auth/me  — returns the logged-in user's basic profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where:  { id: req.userId! },
    select: safeUserSelect,
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
