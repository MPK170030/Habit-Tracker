# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Warrior Habits** — a gamified habit tracker with a Dragon Ball Z theme. Users complete daily habits to earn XP and progress through 7 Goku transformation levels (Base Form → Super Saiyan Blue). It's a fullstack app with a React frontend and a separate Express backend.

## Commands

### Run both frontend and backend together (from repo root)
```
npm run dev:all
```
This uses `concurrently` to start the Express server (port 3001) and Vite dev server (port 5173) simultaneously.

### Frontend only (from repo root)
```
npm run dev       # Vite dev server on :5173
npm run build     # tsc -b && vite build
npm run lint      # ESLint
```

### Backend only (from `server/`)
```
npm run dev       # tsx watch src/index.ts (hot-reload)
npm run build     # tsc
npm run start     # node dist/index.js
npm run db:migrate   # prisma migrate dev (run after schema changes)
npm run db:generate  # prisma generate (regenerate client)
npm run db:studio    # open Prisma Studio GUI
```

### First-time server setup
Copy `server/.env.example` to `server/.env` and fill in values. The database is SQLite and lives at `server/prisma/prisma/dev.db`.

## Architecture

### Frontend (`src/`)

The app is a single-page application with no router. `App.tsx` acts as the auth gate — it renders `<AuthPage>` when logged out, and `<MainApp>` when logged in.

**State management is centralized in one hook**: `src/hooks/useAppState.ts`. It owns all mutable state (habits, XP, streak, completions) and exposes actions. Every mutation uses **optimistic updates with rollback on error** — the UI updates immediately, the API call runs async, and state reverts if the call fails.

On mount, `useAppState` fires `POST /api/progress/day-start` in parallel with loading state. This endpoint is idempotent per day (checks `lastActiveDate`) and handles: flushing habits pending removal and pruning completion records older than 90 days.

**Auth** is managed by `src/contexts/AuthContext.tsx`. The JWT is stored in `localStorage` as `wh_token` and attached to every request in `src/lib/api.ts`. On mount, `AuthContext` validates the stored token via `GET /api/auth/me`.

**Component structure** in `App.tsx` is flat — all UI components (`WarriorCard`, `HabitList`, `HabitRow`, `ManagePanel`, `XPBar`) are defined in the same file and receive props from `MainApp`. `GokuAvatar` and `LevelUpModal` are the only components extracted to `src/components/`.

**Types and XP logic** live in `src/types.ts`: the `LEVELS` array (7 levels, each with a Goku title, minXp, and color), `getLevelInfo()` for computing current level/progress, and the `HABIT_EMOJIS` preset list.

### Backend (`server/src/`)

Express + TypeScript. All routes are under `/api/`. Request validation uses **Zod** on every route. Auth uses JWT (bcryptjs passwords, 7-day tokens).

| Route file | Prefix | Responsibility |
|---|---|---|
| `routes/auth.ts` | `/api/auth` | register, login, forgot/reset password |
| `routes/user.ts` | `/api/user` | fetch full app state, update warrior name |
| `routes/habits.ts` | `/api/habits` | add, edit, schedule removal, cancel removal |
| `routes/progress.ts` | `/api/progress` | day-start, toggle habit completion |

**Database** is SQLite via Prisma. Key schema notes:
- `Habit.isPendingRemoval` — soft delete; habits with this flag are deleted on the next `day-start`
- `DailyCompletion` — one row per (user, date, habit); unique constraint prevents double-counting
- `XpEarnedDate` — tracks which days XP was awarded; prevents double XP if the user completes all habits, unchecks one, and rechecks it

**XP formula**: 50 base + min(streak × 5, 50), so max 100 XP/day. XP is awarded once per day when all active (non-pending-removal) habits are completed.

**The level calculation is duplicated**: `getLevelFromXp()` exists in both `server/src/lib/dates.ts` (used server-side to detect level-up on toggle) and implicitly in `src/types.ts`'s `getLevelInfo()` (used client-side). Keep them in sync when adding levels.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite`). Custom CSS animations (`.xp-bar-fill`, `.check-pop`, `.modal-sparkle`, `.panel-slide`, `.quest-complete`) are defined in `src/index.css`. The color palette is slate-based with amber-400/500 as the primary accent and per-level colors from `LEVELS[n].color`.
