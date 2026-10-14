import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

interface Props {
  initialMode: Mode;
  resetToken?: string | null;
  onClose: () => void;
}

export function AuthModal({ initialMode, resetToken, onClose }: Props) {
  const { login, register } = useAuth();

  const [mode, setMode]               = useState<Mode>(initialMode);
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [diverName, setDiverName] = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [info, setInfo]               = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        // login redirects via AuthContext — modal will unmount automatically
      } else if (mode === 'register') {
        await register(name, email, password, diverName || undefined);
      } else if (mode === 'forgot') {
        const { message } = await api.auth.forgotPassword(email);
        setInfo(message);
      } else if (mode === 'reset') {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
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
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2 inline-block">🌊</div>
          <h1 className="text-cyan-400 font-black text-2xl tracking-wider uppercase">Fathom</h1>
        </div>

        {/* Mode tabs */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-800 rounded-xl p-1 mb-5 border border-slate-700">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 text-base font-bold rounded-lg transition-all duration-200 ${
                  mode === m ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <div className="mb-5 text-center">
            <p className="text-white font-bold text-xl">
              {mode === 'forgot' ? 'Reset your password' : 'Choose a new password'}
            </p>
            <p className="text-slate-500 text-base mt-1">
              {mode === 'forgot'
                ? "Enter your email and we'll send a reset link."
                : 'Enter a new password for your account.'}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label className="text-slate-400 text-sm font-bold uppercase tracking-widest block mb-1.5">
                Your Name
              </label>
              <input
                required type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Manav" maxLength={50}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-cyan-500 transition-colors text-base"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="text-slate-400 text-sm font-bold uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                required type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="diver@example.com"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-cyan-500 transition-colors text-base"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div>
              <label className="text-slate-400 text-sm font-bold uppercase tracking-widest block mb-1.5">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <input
                required type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" minLength={8}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-cyan-500 transition-colors text-base"
              />
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label className="text-slate-400 text-sm font-bold uppercase tracking-widest block mb-1.5">
                Confirm Password
              </label>
              <input
                required type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" minLength={8}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-cyan-500 transition-colors text-base"
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-slate-400 text-sm font-bold uppercase tracking-widest block mb-1.5">
                Diver Name{' '}
                <span className="text-slate-600 normal-case font-normal tracking-normal">— optional</span>
              </label>
              <input
                type="text" value={diverName}
                onChange={e => setDiverName(e.target.value)}
                placeholder="The Relentless" maxLength={20}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder-slate-600 outline-none border border-slate-700 focus:border-cyan-500 transition-colors text-base"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right -mt-2">
              <button
                type="button" onClick={() => switchMode('forgot')}
                className="text-slate-500 hover:text-cyan-400 text-sm font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3 text-red-400 text-base">
              {error}
            </div>
          )}

          {info && (
            <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl px-4 py-3 text-emerald-400 text-base">
              {info}
            </div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-xl transition-colors text-base tracking-wide uppercase"
          >
            {submitting
              ? 'Loading…'
              : mode === 'login'    ? 'Begin Descent →'
              : mode === 'register' ? 'Start Diving →'
              : mode === 'forgot'   ? 'Send Reset Link'
              :                       'Set New Password'}
          </button>

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button" onClick={() => switchMode('login')}
              className="w-full text-center text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
            >
              ← Back to Log In
            </button>
          )}
        </form>

        {/* Close hint */}
        <p className="text-center text-slate-700 text-sm mt-4">Click outside to close</p>
      </div>
    </div>
  );
}
