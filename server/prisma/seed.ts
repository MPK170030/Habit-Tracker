import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function dateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function main() {
  const yesterday = dateString(1);

  const passwordHash = await bcrypt.hash('demo1234', 12);

  // Wipe and recreate so re-running always gives a clean state
  await prisma.user.deleteMany({ where: { email: 'demo@warrior.dev' } });

  // 1850 XP = level 5 (Hadal Pioneer), 350/1000 into the level
  // 21-day streak shows sustained commitment
  const demo = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@warrior.dev',
      password: passwordHash,
      diverName: 'Iron Will',
      xp: 2400,
      streak: 21,
      lastCompletedDate: yesterday,
      lastActiveDate: yesterday,
    },
  });

  const habitDefs = [
    { name: 'Morning Run',   emoji: '🏃' },
    { name: 'Read 30 min',   emoji: '📚' },
    { name: 'Meditate',      emoji: '🧘' },
    { name: 'Drink Water',   emoji: '💧' },
  ];

  const habits = await Promise.all(
    habitDefs.map(h => prisma.habit.create({ data: { ...h, userId: demo.id } })),
  );

  // Seed 21 days of completed history so the streak and XP look earned
  const completionRows = [];
  const xpRows = [];
  for (let daysAgo = 1; daysAgo <= 21; daysAgo++) {
    const date = dateString(daysAgo);
    for (const habit of habits) {
      completionRows.push({ userId: demo.id, date, habitId: habit.id });
    }
    xpRows.push({ userId: demo.id, date });
  }

  await prisma.dailyCompletion.createMany({ data: completionRows });
  await prisma.xpEarnedDate.createMany({ data: xpRows });

  console.log('Demo account ready — demo@warrior.dev / demo1234');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
