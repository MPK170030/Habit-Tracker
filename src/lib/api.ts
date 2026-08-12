const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('wh_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Response types ──────────────────────────────────────────────────────────

export interface ApiUser {
  id:               number;
  name:             string;
  email:            string;
  warriorName:      string;
  xp:               number;
  streak:           number;
  lastCompletedDate: string | null;
  lastActiveDate:   string | null;
  createdAt:        string;
}

export interface ApiHabit {
  id:               string;
  name:             string;
  emoji:            string;
  isPendingRemoval: boolean;
  createdAt:        string;
  userId:           number;
}

export interface ApiState extends ApiUser {
  habits:           ApiHabit[];
  dailyCompletions: Record<string, string[]>;
  xpEarnedDates:    string[];
}

export interface ToggleResult {
  allDone:   boolean;
  xpGained:  number;
  leveledUp: boolean;
  checked:   boolean;
}

// ── API surface ─────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (name: string, email: string, password: string, warriorName?: string) =>
      request<{ token: string; user: ApiUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, warriorName }),
      }),

    login: (email: string, password: string) =>
      request<{ token: string; user: ApiUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    me: () => request<ApiUser>('/auth/me'),

    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },

  user: {
    state: () => request<ApiState>('/user/state'),

    updateWarriorName: (warriorName: string) =>
      request<{ warriorName: string }>('/user/warrior-name', {
        method: 'PATCH',
        body: JSON.stringify({ warriorName }),
      }),
  },

  habits: {
    add: (name: string, emoji: string) =>
      request<ApiHabit>('/habits', {
        method: 'POST',
        body: JSON.stringify({ name, emoji }),
      }),

    edit: (id: string, name: string, emoji: string) =>
      request<ApiHabit>(`/habits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, emoji }),
      }),

    scheduleRemoval: (id: string) =>
      request<ApiHabit>(`/habits/${id}`, { method: 'DELETE' }),

    cancelRemoval: (id: string) =>
      request<ApiHabit>(`/habits/${id}/cancel-removal`, { method: 'PATCH' }),
  },

  progress: {
    dayStart: () =>
      request<{ processed: boolean }>('/progress/day-start', { method: 'POST' }),

    toggle: (habitId: string) =>
      request<ToggleResult>('/progress/toggle', {
        method: 'POST',
        body: JSON.stringify({ habitId }),
      }),
  },
};
