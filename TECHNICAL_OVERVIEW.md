# Fathom — Technical Overview

## What the project is

Fathom is a fullstack gamified habit tracker with an ocean exploration theme. Users create daily habits, check them off each day, earn XP, and descend through 7 depth levels — from Shore Diver to Abyss Master. Completing all habits in a day awards XP; maintaining a streak multiplies how much you earn.

It's a single-page React app backed by an Express + TypeScript REST API, with a PostgreSQL database managed through Prisma.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Express, TypeScript, tsx (hot reload) |
| Database | PostgreSQL via Prisma ORM |
| Auth | Self-implemented JWT + bcryptjs |
| Email | Nodemailer with Gmail (app password) |
| Deployment | Vercel (frontend) + Render (backend) + Supabase (database) |

---

## Architecture

### Frontend

The app has no router. `App.tsx` is the auth gate — it renders `<LandingPage>` + `<AuthModal>` when logged out, and `<MainApp>` when logged in. Auth state is managed by `AuthContext`, which validates the stored JWT on mount via `GET /api/auth/me`.

**Component structure** is split across `src/components/` and `src/pages/`:

```
src/
├── App.tsx                  # Auth gate only (~55 lines)
├── pages/
│   ├── MainApp.tsx          # Authenticated shell, layout, level-up handling
│   ├── LandingPage.tsx      # Marketing/entry page
│   └── AuthModal.tsx        # Login, register, forgot + reset password (4 modes)
├── components/
│   ├── DiverCard.tsx        # Left panel — avatar, name, XP bar, streak
│   ├── HabitList.tsx        # Right panel — today's habits, progress bar, completion banner
│   ├── HabitRow.tsx         # Single habit row with toggle
│   ├── ManagePanel.tsx      # Bottom sheet — add, edit, remove habits
│   ├── XPBar.tsx            # Depth progress bar
│   ├── LoadingScreen.tsx    # Full-screen loading state
│   ├── LevelUpModal.tsx     # Level-up animation overlay
│   ├── DemoPanel.tsx        # Demo account instructions + simulate-day button
│   ├── OceanAvatar.tsx      # Three.js diver avatar (level-dependent)
│   └── CausticsBackground.tsx  # Three.js animated background
└── hooks/
    └── useAppState.ts       # All mutable app state and actions
```

**State management is centralised in one hook** — `useAppState.ts`. It owns habits, XP, streak, daily completions, and XP earned dates. Every mutation uses **optimistic updates with rollback**: the UI updates immediately, the API call fires async, and if it fails the state reverts silently.

On mount, `useAppState` fires `POST /api/progress/day-start` in parallel with the initial state load. This endpoint is idempotent per day — it gates on `lastActiveDate === today` and no-ops if already processed.

**Auth** is managed by `AuthContext`. The JWT is stored in `localStorage` under the key `fathom_token` and attached to every request as `Authorization: Bearer <token>`. On mount, `AuthContext` validates the stored token via `GET /api/auth/me` — if expired or invalid it's cleared, preventing a broken logged-in state.

### Backend

Express + TypeScript. All routes are prefixed `/api/`. Every route validates its request body with **Zod** before touching the database.

| File | Prefix | Responsibility |
|---|---|---|
| `routes/auth.ts` | `/api/auth` | register, login, forgot/reset password, token validation |
| `routes/user.ts` | `/api/user` | full app state, update diver name |
| `routes/habits.ts` | `/api/habits` | add, edit, schedule removal, cancel removal |
| `routes/progress.ts` | `/api/progress` | day-start, toggle completion, simulate-day (demo only) |

---

## Database Schema

Five tables with real foreign-key relations.

```
User (1) ──< Habit (many)
User (1) ──< DailyCompletion (many)
Habit (1) ──< DailyCompletion (many)
User (1) ──< XpEarnedDate (many)
User (1) ──< PasswordResetToken (many)
```

### User

Stores identity, credentials, and all gamification state:

```prisma
model User {
  id                Int      @id @default(autoincrement())
  name              String
  email             String   @unique
  password          String   // bcrypt hash, cost factor 12
  diverName         String   @default("Diver")
  xp                Int      @default(0)
  streak            Int      @default(0)
  lastCompletedDate String?  // YYYY-MM-DD — used for streak continuity check
  lastActiveDate    String?  // YYYY-MM-DD — used to gate day-start processing
  createdAt         DateTime @default(now())
}
```

`streak` and `lastCompletedDate` are stored, not computed. Streak is recalculated on each XP award: if `lastCompletedDate === yesterday`, increment; otherwise reset to 1.

### Habit

```prisma
model Habit {
  id               String   @id @default(uuid())
  name             String
  emoji            String
  isPendingRemoval Boolean  @default(false)
  createdAt        DateTime @default(now())
  userId           Int
}
```

Habits use a **soft-delete pattern** via `isPendingRemoval`. Flagged habits stay alive until the next `day-start` flushes them. This prevents mid-day data corruption — a hard delete would cascade-delete completion records, breaking the "all habits done" check and potentially re-awarding XP.

### DailyCompletion

```prisma
model DailyCompletion {
  id      Int    @id @default(autoincrement())
  date    String // YYYY-MM-DD
  userId  Int
  habitId String

  @@unique([userId, date, habitId])
  @@index([userId, date])
}
```

One row per `(user, date, habit)`. The composite unique constraint prevents double-completion at the database level. Checking off creates a row; unchecking deletes it.

### XpEarnedDate

```prisma
model XpEarnedDate {
  id     Int    @id @default(autoincrement())
  date   String
  userId Int

  @@unique([userId, date])
}
```

Exists to solve one specific problem: XP idempotency on uncheck/recheck. Without it, completing all habits → unchecking one → rechecking it would award XP twice. Writing a `(userId, date)` row on first award and checking for it before awarding again makes the toggle endpoint idempotent.

### PasswordResetToken

```prisma
model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  userId    Int
}
```

---

## XP & Progression System

### XP formula

```
xpGained = 50 + min(streak × 5, 50)
```

Minimum 50 XP/day (any streak), maximum 100 XP/day (streak ≥ 10). XP is awarded once per day only when **all active habits** are completed.

### Level thresholds

7 levels mapped to ocean depth zones:

| Level | Title | Zone | XP Required |
|---|---|---|---|
| 1 | Shore Diver | Sunlit Zone | 0 |
| 2 | Open Water | Twilight Zone | 150 |
| 3 | Deep Diver | Midnight Zone | 400 |
| 4 | Abyssal Scout | Abyssal Zone | 800 |
| 5 | Hadal Pioneer | Hadal Zone | 1,500 |
| 6 | Trench Diver | Mariana Trench | 2,500 |
| 7 | Abyss Master | The Deep | 4,000 |

### Level calculation

The level is computed from XP using an array of thresholds. The same algorithm runs on both sides:

- **Client** — `getLevelInfo(xp)` in `src/types.ts`, returns the full level object (title, color, zone) used for rendering
- **Server** — `getLevelFromXp(xp)` in `server/src/lib/dates.ts`, returns just the level number used for detecting level-up on toggle

Both iterate the same thresholds array `[0, 150, 400, 800, 1500, 2500, 4000]`. When adding a new level, update both files.

---

## Authentication

Fully self-implemented — no Auth0, Clerk, or Firebase.

**Mechanism:** JWT tokens, 7-day expiry, signed with `JWT_SECRET`. Passwords hashed with bcryptjs at cost factor 12.

**Frontend storage:** Token stored in `localStorage` as `fathom_token`. Every API request reads it and attaches it as `Authorization: Bearer <token>`.

**Token validation on refresh:** `AuthContext` runs `GET /api/auth/me` on mount. If the token is expired or invalid, it's cleared and the user is signed out cleanly.

---

## Rate Limiting

Auth routes are protected with `express-rate-limit`:

| Route | Window | Max requests |
|---|---|---|
| `POST /api/auth/login` | 15 minutes | 10 |
| `POST /api/auth/forgot-password` | 1 hour | 5 |

Limits are per IP. Breaches return a `429` with a JSON error message. Standard `RateLimit-*` headers are sent on every response so clients can surface the wait time if needed.

---

## Password Reset

A four-mode flow in `AuthModal.tsx` (modes: `login`, `register`, `forgot`, `reset`).

### Step 1 — Request reset

User submits their email. **The response is always identical** regardless of whether the email exists — "If that email exists, a reset link has been sent." This prevents email enumeration.

If the user exists, the backend generates a 32-byte cryptographically random token (`crypto.randomBytes(32).toString('hex')`), writes a `PasswordResetToken` row with a 1-hour expiry, and emails the reset link via Nodemailer/Gmail.

### Step 2 — Landing on the reset link

`App.tsx` reads `?token=` from the URL on mount via `useMemo`. If a token is present, `AuthModal` opens directly in `reset` mode.

### Step 3 — Setting a new password

Backend validates the token (exists, not `used`, not expired), then runs a **Prisma transaction** that atomically updates the password hash and sets `used: true`. The atomic transaction prevents replay attacks — the token is invalidated in the same operation that changes the password. After success the frontend strips the token from the URL and switches to `login` mode.

---

## Day-Start Idempotency

`POST /api/progress/day-start` is called every time the app loads. It gates on `lastActiveDate === today` and no-ops immediately if already processed. Otherwise it runs a single transaction that:

1. Deletes all `isPendingRemoval` habits for the user
2. Deletes `DailyCompletion` rows older than 90 days
3. Deletes `XpEarnedDate` rows older than 90 days
4. Updates `lastActiveDate` to today

This keeps the database lean without a separate cron job.

---

## Demo Mode

The demo account (`demo@warrior.dev`) has a dedicated endpoint: `POST /api/progress/simulate-day`. It is gated to that email only and:

1. Deletes today's `DailyCompletion` rows for the user
2. Deletes today's `XpEarnedDate` row
3. Rolls `lastActiveDate` back to yesterday so `day-start` fires again on next load

This lets a recruiter check off all habits, earn XP, simulate the next day, and do it again — triggering the level-up modal in a single session. The frontend disables the button after one level-up has occurred via simulation.

---

## Hardest Technical Decisions

### 1. Habit deletion timing (soft delete)

Hard-deleting a habit immediately would cascade-delete its `DailyCompletion` rows, corrupting the "all habits done" check mid-day and potentially re-triggering XP. The `isPendingRemoval` flag keeps habits alive until the next `day-start`, where they're flushed in a transaction. This required threading the flag through the schema, the toggle logic (pending-removal habits excluded from the "all done" check), and the frontend (shown greyed out with "last day" label).

### 2. XP idempotency on uncheck/recheck

Without `XpEarnedDate`, the toggle endpoint is not idempotent with respect to XP: complete all habits → uncheck one → recheck → XP fires twice. The dedicated dedup table is the fix. It's a deliberate denormalisation — you could derive "did XP fire today?" from `lastCompletedDate`, but that field also drives streak logic, so conflating them would introduce subtle bugs.

### 3. Concurrent completion (minor)

The toggle endpoint is a read-modify-write on completion state. Under concurrent requests for the same habit from the same user, the `@@unique([userId, date, habitId])` constraint causes a duplicate insert to throw rather than silently double-count. Acceptable for a personal habit tracker; would need `SELECT FOR UPDATE` at scale.

### Known weakness — Timezone

`getToday()` uses `new Date().toISOString().split('T')[0]`, which is always UTC. A user in UTC-5 checking habits at 11pm local time is on a different calendar day server-side. The `X-Local-Date` header is sent by the frontend on every request and used by all progress endpoints to anchor "today" to the client's calendar date — this mitigates the issue for most flows, but streak calculation on the server still uses server-computed dates in some paths.
