import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../lib/prisma', () => ({
  prisma: {
    habit: {
      findFirst: jest.fn(),
      findMany:  jest.fn(),
    },
    dailyCompletion: {
      findUnique: jest.fn(),
      create:     jest.fn(),
      delete:     jest.fn(),
      findMany:   jest.fn(),
    },
    xpEarnedDate: {
      findUnique: jest.fn(),
      create:     jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update:     jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.userId = 1;
    next();
  },
}));

const TODAY     = '2024-06-15';
const YESTERDAY = '2024-06-14';

const mockHabit = { id: 'habit-1', userId: 1, name: 'Run', emoji: '🏃', isPendingRemoval: false };
const mockUser  = { id: 1, xp: 100, streak: 3, lastCompletedDate: YESTERDAY };

function toggle(habitId = 'habit-1') {
  return request(app)
    .post('/api/progress/toggle')
    .set('Authorization', 'Bearer fake')
    .set('X-Local-Date', TODAY)
    .send({ habitId });
}

beforeEach(() => jest.clearAllMocks());

describe('POST /api/progress/toggle — input validation', () => {
  it('returns 400 when habitId is missing', async () => {
    const res = await request(app)
      .post('/api/progress/toggle')
      .set('Authorization', 'Bearer fake')
      .set('X-Local-Date', TODAY)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 when the habit does not belong to the user', async () => {
    (prisma.habit.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await toggle('nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/progress/toggle — checking a habit', () => {
  it('creates a completion row and returns checked: true', async () => {
    (prisma.habit.findFirst        as jest.Mock).mockResolvedValue(mockHabit);
    (prisma.dailyCompletion.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dailyCompletion.create as jest.Mock).mockResolvedValue({});
    // Not all habits done yet
    (prisma.habit.findMany         as jest.Mock).mockResolvedValue([mockHabit, { id: 'habit-2' }]);
    (prisma.dailyCompletion.findMany as jest.Mock).mockResolvedValue([{ habitId: 'habit-1' }]);

    const res = await toggle();
    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(true);
    expect(res.body.xpGained).toBe(0);
    expect(prisma.dailyCompletion.create).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/progress/toggle — unchecking a habit', () => {
  it('deletes the completion row and returns checked: false', async () => {
    (prisma.habit.findFirst          as jest.Mock).mockResolvedValue(mockHabit);
    (prisma.dailyCompletion.findUnique as jest.Mock).mockResolvedValue({ id: 42 });
    (prisma.dailyCompletion.delete   as jest.Mock).mockResolvedValue({});
    (prisma.habit.findMany           as jest.Mock).mockResolvedValue([mockHabit]);
    (prisma.dailyCompletion.findMany as jest.Mock).mockResolvedValue([]);

    const res = await toggle();
    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(false);
    expect(prisma.dailyCompletion.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
  });
});

describe('POST /api/progress/toggle — XP award', () => {
  it('awards XP when completing the last habit', async () => {
    (prisma.habit.findFirst          as jest.Mock).mockResolvedValue(mockHabit);
    (prisma.dailyCompletion.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dailyCompletion.create   as jest.Mock).mockResolvedValue({});
    (prisma.habit.findMany           as jest.Mock).mockResolvedValue([mockHabit]);
    (prisma.dailyCompletion.findMany as jest.Mock).mockResolvedValue([{ habitId: 'habit-1' }]);
    (prisma.xpEarnedDate.findUnique  as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique          as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update              as jest.Mock).mockResolvedValue({});
    (prisma.xpEarnedDate.create      as jest.Mock).mockResolvedValue({});
    (prisma.$transaction             as jest.Mock).mockImplementation(
      (ops: Promise<unknown>[]) => Promise.all(ops),
    );

    const res = await toggle();
    expect(res.status).toBe(200);
    expect(res.body.allDone).toBe(true);
    expect(res.body.xpGained).toBeGreaterThan(0);
  });

  it('XP formula: 50 base + streak bonus, capped at 100', async () => {
    const highStreakUser = { ...mockUser, streak: 20 };
    (prisma.habit.findFirst          as jest.Mock).mockResolvedValue(mockHabit);
    (prisma.dailyCompletion.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dailyCompletion.create   as jest.Mock).mockResolvedValue({});
    (prisma.habit.findMany           as jest.Mock).mockResolvedValue([mockHabit]);
    (prisma.dailyCompletion.findMany as jest.Mock).mockResolvedValue([{ habitId: 'habit-1' }]);
    (prisma.xpEarnedDate.findUnique  as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique          as jest.Mock).mockResolvedValue(highStreakUser);
    (prisma.user.update              as jest.Mock).mockResolvedValue({});
    (prisma.xpEarnedDate.create      as jest.Mock).mockResolvedValue({});
    (prisma.$transaction             as jest.Mock).mockImplementation(
      (ops: Promise<unknown>[]) => Promise.all(ops),
    );

    const res = await toggle();
    expect(res.body.xpGained).toBe(100); // 50 + min(20*5, 50) = 50 + 50 = 100
  });

  it('does not award XP a second time if XpEarnedDate already exists (idempotency)', async () => {
    (prisma.habit.findFirst          as jest.Mock).mockResolvedValue(mockHabit);
    (prisma.dailyCompletion.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dailyCompletion.create   as jest.Mock).mockResolvedValue({});
    (prisma.habit.findMany           as jest.Mock).mockResolvedValue([mockHabit]);
    (prisma.dailyCompletion.findMany as jest.Mock).mockResolvedValue([{ habitId: 'habit-1' }]);
    // XP already earned today
    (prisma.xpEarnedDate.findUnique  as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await toggle();
    expect(res.status).toBe(200);
    expect(res.body.xpGained).toBe(0);
    // Should not touch the user row
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
