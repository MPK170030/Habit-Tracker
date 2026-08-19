# Warrior Habits — Technical Overview

## What the project is

Warrior Habits is a fullstack gamified habit tracker with a Dragon Ball Z theme. Users create daily habits, check them off each day, earn XP, and progress through 7 Goku transformation levels — Base Form through Super Saiyan Blue. The gamification is the core hook: completing all your habits in a single day awards XP, and maintaining a streak multiplies how much you earn.

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
| Deployment | AWS EC2 + Docker + EBS (chosen, paused for learning) |

---

## Architecture

### Frontend

The app has no router. `App.tsx` is the auth gate — it renders `<AuthPage>` when the user is logged out and `<MainApp>` when logged in. Navigation between views is handled by local state inside `MainApp`.

All mutable app state lives in a single hook: `src/hooks/useAppState.ts`. It owns habits, XP, streak, and daily completions, and exposes action functions. Every mutation uses **optimistic updates with rollback** — the UI updates immediately, the API call fires async, and if it fails the state reverts. This makes the UI feel instant even on slow connections.

On mount, `useAppState` fires `POST /api/progress/day-start` in parallel with the initial data load. This endpoint is idempotent per day — it checks `lastActiveDate` and no-ops if it's already been called today.

Component structure is intentionally flat. `WarriorCard`, `HabitList`, `HabitRow`, `ManagePanel`, and `XPBar` are all defined in `App.tsx` and receive props from `MainApp`. Only `GokuAvatar` and `LevelUpModal` are extracted to `src/components/`. This was a deliberate call to avoid premature abstraction in a small app.

### Backend

Express + TypeScript. All routes are prefixed `/api/`. Every route does Zod validation before touching the database. The route structure:

| File | Prefix | Responsibility |
|---|---|---|
| `routes/auth.ts` | `/api/auth` | register, login, forgot/reset password, token validation |
| `routes/user.ts` | `/api/user` | fetch full app state, update warrior name |
| `routes/habits.ts` | `/api/habits` | add, edit, schedule removal, cancel removal |
| `routes/progress.ts` | `/api/progress` | day-start, toggle habit completion |

---

## Database Schema

Five tables with real foreign-key relations — not flat, not JSON blobs.

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
  password          String   // bcrypt hash
  warriorName       String   @default("Goku")
  xp                Int      @default(0)
  streak            Int      @default(0)
  lastCompletedDate String?  // YYYY-MM-DD — used for streak continuity check
  lastActiveDate    String?  // YYYY-MM-DD — used to gate day-start processing
  createdAt         DateTime @default(now())
}
```

`streak` and `lastCompletedDate` are stored columns, not computed. Streak is recalculated on each XP award: if `lastCompletedDate === yesterday`, increment; otherwise reset to 1.

### Habit

```prisma
model Habit {
  id               String   @id @default(uuid())
  name             String
  emoji            String
  isPendingRemoval Boolean  @default(false)
  createdAt        DateTime @default(now())
  userId           Int
  user             User              @relation(...)
  completions      DailyCompletion[]
}
```

Habits use a **soft-delete pattern** via `isPendingRemoval`. When a user deletes a habit, it isn't removed from the database immediately — it gets flagged. The actual deletion happens the next time `day-start` runs (i.e., the next day the user opens the app). This was a deliberate design decision to avoid mid-day data corruption: if a habit were hard-deleted mid-day, its completion records would cascade-delete too, which would break the "all habits done" check and potentially re-award XP incorrectly.

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

One row per `(user, date, habit)`. The composite unique constraint prevents double-completion at the database level. Checking off a habit creates a row; unchecking deletes it. There are no boolean flags on `Habit` itself — the completion state is derived entirely from whether a matching row exists.

### XpEarnedDate

```prisma
model XpEarnedDate {
  id     Int    @id @default(autoincrement())
  date   String
  userId Int

  @@unique([userId, date])
}
```

This table exists to solve one specific problem: XP idempotency on uncheck/recheck. Without it, a user could: complete all habits (XP awarded) → uncheck one habit → recheck it → XP awarded again. By writing a `(userId, date)` row the first time XP is granted and checking for it before awarding again, the toggle endpoint is idempotent regardless of how many times it's called.

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

## Authentication

Fully self-implemented — no Auth0, Clerk, Firebase, or any third-party auth provider.

**Mechanism:** JWT tokens, 7-day expiry, signed with `JWT_SECRET`. Passwords hashed with bcryptjs at cost factor 12.

**Frontend storage:** The token is stored in `localStorage` under the key `wh_token`. Every API request reads it and attaches it as `Authorization: Bearer <token>`.

**Validation on refresh:** `AuthContext` runs on mount, reads the stored token, and hits `GET /api/auth/me`. If the token is expired or invalid, it's cleared and the user is logged out. This means a user is never stuck in a broken logged-in state.

**Auth context:** `src/contexts/AuthContext.tsx` exposes `{ user, token, loading, login, register, logout }` via React context. The `loading` flag gates rendering — the app shows nothing until the token validation resolves, preventing a flash of the login screen for returning users.

---

## Password Reset

A four-mode flow managed entirely in `AuthPage.tsx` (modes: `login`, `register`, `forgot`, `reset`).

### Step 1 — Request reset (`forgot` mode)

User submits their email. Backend looks up the user. Whether or not the user exists, **the response is always identical** — "If that email exists, a reset link has been sent." This prevents email enumeration: an attacker can't probe which emails are registered.

If the user does exist, the backend:
1. Generates a 32-byte cryptographically random token via `crypto.randomBytes(32).toString('hex')` — 256 bits of entropy
2. Writes a `PasswordResetToken` row with a 1-hour expiry
3. Sends an email via Nodemailer/Gmail containing `CLIENT_URL?token=<token>`

### Step 2 — Landing on the reset link

`AuthPage` reads `?token=` from the URL on mount via `useMemo`. If a token is present, the page initialises directly in `reset` mode rather than `login`.

### Step 3 — Setting a new password (`reset` mode)

User enters and confirms a new password. Frontend validates they match before submitting. Backend then:
1. Looks up the token in `PasswordResetToken`
2. Rejects if: token not found, already `used`, or `expiresAt` is in the past
3. If valid, runs a **Prisma transaction** that atomically:
   - Updates the user's password hash
   - Sets `used: true` on the token

The atomic transaction is what prevents replay attacks — the token is invalidated in the same operation that updates the password. There's no window where the token is valid but the password is already changed.

After success, the frontend strips the token from the URL (`window.history.replaceState`) and redirects to login.

### Email

Nodemailer configured with `service: 'gmail'` (not raw SMTP host/port — the Gmail shorthand handles that). Auth is via a Gmail app password, not the account password. Credentials: `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars.

---

## XP & Streak System

### XP formula

```
xpGained = 50 + min(streak × 5, 50)
```

Minimum 50 XP/day (streak of 0 or 1), maximum 100 XP/day (streak of 10+). XP is awarded once per day, only when **all active (non-pending-removal) habits** are completed.

### Streak logic

Streak is stored as an integer on `User`. On XP award:
- If `user.lastCompletedDate === yesterday` → `streak + 1`
- Otherwise → reset to `1`

`yesterday` is computed server-side. The streak can only increment on XP award, which can only happen once per day, so there's no way to inflate it.

### Level thresholds

7 levels mapped to Goku transformations:

| Level | XP Required | Form |
|---|---|---|
| 1 | 0 | Base Form |
| 2 | 150 | Kaioken |
| 3 | 400 | Super Saiyan |
| 4 | 800 | Super Saiyan 2 |
| 5 | 1500 | Super Saiyan 3 |
| 6 | 2500 | Super Saiyan God |
| 7 | 4000 | Super Saiyan Blue |

Level calculation (`getLevelFromXp`) is duplicated: once in `server/src/lib/dates.ts` (server-side, for detecting level-up on toggle) and once in `src/types.ts` (client-side, for rendering). These must be kept in sync when thresholds change.

---

## Hardest Technical Decisions

### 1. Habit deletion timing (soft delete)

The hardest schema decision. Hard-deleting a habit immediately would cascade-delete its `DailyCompletion` rows, which would corrupt the "all habits done" check mid-day and could incorrectly re-trigger XP. The solution is `isPendingRemoval` — habits marked for deletion stay alive until the next `day-start`, where they're flushed in a transaction along with old completion records. This required threading the flag through the schema, the toggle logic (pending-removal habits are excluded from the "all done" check), and the frontend (which shows them as greyed out / staged for removal).

### 2. XP idempotency on uncheck/recheck

Without `XpEarnedDate`, the toggle endpoint is not idempotent with respect to XP: complete all habits → uncheck one → recheck → XP fires twice. The dedicated dedup table is the fix. It's a deliberate denormalization — you could derive "did XP fire today?" from `lastCompletedDate`, but that field also drives streak logic, so conflating the two would create subtle bugs.

### 3. Concurrent completion (minor)

The toggle endpoint reads completion state, then writes. Under concurrent requests for the same habit from the same user, this is a read-modify-write race. It's mitigated by the `@@unique([userId, date, habitId])` constraint — a duplicate insert would throw rather than silently double-count — but there's no explicit row-level lock. Acceptable for a personal habit tracker; would need a transaction with `SELECT FOR UPDATE` at higher scale.

### Known weakness — Timezone

`getToday()` and `getYesterday()` use `new Date().toISOString().split('T')[0]`, which is always UTC. A user in UTC-5 checking habits at 11pm their local time is on a different calendar day server-side than they expect. Streak breaks and completion records go to the wrong date. This is a latent bug — it wasn't solved, and fixing it properly requires storing a user timezone and computing "today" relative to it.

---

## Day-Start Idempotency

`POST /api/progress/day-start` is called every time the app loads. It gates on `lastActiveDate === today` — if already processed for today, it returns `{ processed: false }` immediately. Otherwise it runs a single transaction that:

1. Deletes all `isPendingRemoval` habits for the user
2. Deletes `DailyCompletion` rows older than 90 days
3. Deletes `XpEarnedDate` rows older than 90 days
4. Updates `lastActiveDate` to today

This keeps the database lean without a separate cron job. The 90-day window is enough for the calendar/history views.

---

## Deployment (chosen, paused)

Decision: **AWS EC2 + Docker + EBS**.

- EC2 for the Express server (containerized)
- EBS volume for the PostgreSQL database
- Docker Compose to wire them together

Paused to focus on learning the underlying concepts before automating them away. The reset-password frontend flow (the UI for entering a new password via the emailed link) was also identified as incomplete at the point deployment was paused.
