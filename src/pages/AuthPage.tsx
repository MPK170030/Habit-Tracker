import { useState, useMemo, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export function AuthPage() {
  const { login, register } = useAuth();

  const resetToken = useMemo(() => new URLSearchParams(window.location.search).get('token'), []);

  const [mode, setMode] = useState<Mode>(resetToken ? 'reset' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [warriorName, setWarriorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(name, email, password, warriorName || undefined);
      } else if (mode === 'forgot') {
        const { message } = await api.auth.forgotPassword(email);
        setInfo(message);
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { message } = await api.auth.resetPassword(resetToken!, password);
        setInfo(message);
        window.history.replaceState({}, '', window.location.pathname);
        setPassword('');
        setConfirmPassword('');
        setMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #080812 0%, #0d0d1f 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 inline-block">⚔️</div>
          <h1 className="text-amber-400 font-black text-2xl tracking-wider uppercase">Warrior Habits</h1>
          <p className="text-slate-500 text-sm mt-1">Forge your daily discipline</p>
        </div>

        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6 border border-slate-700">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Join'}
              </button>
            ))}
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <div className="mb-6 text-center">
            <p className="text-white font-bold text-lg">
              {mode === 'forgot' ? 'Reset your password' : 'Choose a new password'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'forgot'
                ? "Enter your email and we'll send you a reset link."
                : 'Enter a new password for your account.'}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">
                Your Name
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Manav"
                maxLength={50}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-amber-500 transition-colors text-sm"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="warrior@example.com"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-amber-500 transition-colors text-sm"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-amber-500 transition-colors text-sm"
              />
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">
                Confirm Password
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-amber-500 transition-colors text-sm"
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">
                Warrior Name{' '}
                <span className="text-slate-600 normal-case font-normal tracking-normal">
                  — optional
                </span>
              </label>
              <input
                type="text"
                value={warriorName}
                onChange={e => setWarriorName(e.target.value)}
                placeholder="The Unyielding"
                maxLength={20}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-amber-500 transition-colors text-sm"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-slate-500 hover:text-amber-400 text-xs font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl px-4 py-3 text-emerald-400 text-sm">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-xl transition-colors text-sm tracking-wide uppercase"
          >
            {submitting
              ? 'Loading…'
              : mode === 'login'
                ? 'Enter the Arena →'
                : mode === 'register'
                  ? 'Begin Your Journey →'
                  : mode === 'forgot'
                    ? 'Send Reset Link'
                    : 'Set New Password'}
          </button>

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-center text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
            >
              ← Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
