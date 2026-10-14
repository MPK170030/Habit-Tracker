# Fathom

A gamified habit tracker with an ocean exploration theme. Complete your daily habits to earn XP, build streaks, and descend through 7 depth levels — from Shore Diver to Abyss Master.

**Live demo:** [habits.manavpkothari.dev](https://habits.manavpkothari.dev)

> **Try it instantly** — use `demo@warrior.dev` / `demo1234`, or click the **Try Demo** button on the landing page.

![Fathom preview](https://www.manavpkothari.dev/assets/images/Habit%20Tracker.png)

---

## Features

- **Gamified XP system** — earn 50–100 XP per day based on your streak; level up through 7 tiers
- **Streak tracking** — consecutive daily completions multiply your XP (10× streak = max 100 XP/day)
- **Optimistic UI** — every action updates instantly with silent rollback on failure
- **Soft-delete habits** — removing a habit takes effect the next day to avoid mid-day data corruption
- **Full auth flow** — register, login, forgot password, and reset password via email
- **Responsive** — works on mobile and desktop

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Express, TypeScript, Zod |
| Database | PostgreSQL via Prisma ORM |
| Auth | Self-built JWT + bcryptjs (no third-party provider) |
| Email | Nodemailer + Gmail |
| Deployment | Vercel (frontend) + Render (backend) + Supabase (database) |

---

## Local setup

**Prerequisites:** Node 18+, a PostgreSQL database (or Supabase project)

### 1. Clone and install

```bash
git clone https://github.com/MPK170030/Habit-Tracker.git
cd Habit-Tracker
npm install
cd server && npm install && cd ..
```

### 2. Configure the backend

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`:

```env
DATABASE_URL="postgresql://..."   # Supabase pooler URL
DIRECT_URL="postgresql://..."     # Supabase direct URL
JWT_SECRET="any-long-random-string"
CLIENT_URL="http://localhost:5173"
GMAIL_USER="you@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
```

### 3. Run migrations and seed demo data

```bash
cd server
npm run db:migrate
npm run db:seed
cd ..
```

### 4. Start the dev servers

```bash
npm run dev:all
```

Frontend runs on [localhost:5173](http://localhost:5173), backend on [localhost:3001](http://localhost:3001).

---

## Planned features

- **Per-habit XP rewards** — currently XP is all-or-nothing (awarded only when all habits are completed). The next phase will introduce small XP gains per individual habit checked, with the larger streak-based reward reserved for completing the full set. Requires retuning the level curve and replacing the current `XpEarnedDate` idempotency logic.
- **Push notifications** — daily reminders to complete habits. Intended implementation is web push via the Notifications API, scheduled server-side per user timezone and configurable notification time.
- **PWA / mobile app** — the app is responsive but not yet installable. Options under consideration: PWA (lightweight, no app store) vs React Native (native feel, broader device access). PWA is the likely first step given the existing web stack.

---

## Architecture notes

See [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) for a deep dive into:

- Optimistic update + rollback pattern in `useAppState`
- Why habit deletion is deferred to the next day (soft-delete)
- XP idempotency — how the `XpEarnedDate` table prevents double-awarding on uncheck/recheck
- Password reset atomic transaction design
- Known timezone edge case
