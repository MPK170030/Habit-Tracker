import { LEVELS } from '../types';
import { HeroPreview } from '../components/HeroPreview';

interface Props {
  onLogin:      () => void;
  onRegister:   () => void;
  onTryDemo:    () => void;
  demoLoading:  boolean;
  demoError:    string | null;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ onLogin, onRegister, onTryDemo, demoLoading }: {
  onLogin:     () => void;
  onRegister:  () => void;
  onTryDemo:   () => void;
  demoLoading: boolean;
}) {
  return (
    <nav
      className="fixed top-0 w-full z-40 border-b border-slate-800/60"
      style={{ background: 'rgba(8,8,18,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="w-full px-6 lg:px-14 py-5 lg:py-6 flex items-center justify-between">
        <span className="text-cyan-400 font-black text-3xl tracking-wider uppercase">🌊 Fathom</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onTryDemo}
            disabled={demoLoading}
            className="hidden sm:block text-slate-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-colors px-5 py-2.5 rounded-xl border border-slate-700 hover:border-cyan-600/50"
          >
            {demoLoading ? 'Diving in…' : 'Try Demo'}
          </button>
          <button
            onClick={onLogin}
            className="text-slate-300 hover:text-white text-base font-medium transition-colors px-5 py-2.5 rounded-xl hover:bg-slate-800"
          >
            Log in
          </button>
          <button
            onClick={onRegister}
            className="bg-cyan-500 hover:bg-cyan-400 text-black text-base font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onRegister, onTryDemo, demoLoading, demoError }: {
  onRegister:  () => void;
  onTryDemo:   () => void;
  demoLoading: boolean;
  demoError:   string | null;
}) {
  return (
    <section className="min-h-screen flex items-center pt-20">
      <div className="w-full px-6 lg:px-14 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-cyan-400 text-sm font-black tracking-widest uppercase mb-5">
            Habit Tracker
          </p>
          <h1 className="text-6xl md:text-6xl font-black text-white leading-[1.1] mb-6">
            Descend deeper<br />every day.
          </h1>
          <p className="text-slate-400 text-xl leading-relaxed mb-8">
            There are 7 depth zones waiting below you. Show up every day, earn XP, and fathom how deep your discipline can actually take you.
          </p>
          <div className="flex flex-wrap gap-3 mb-3">
            <button
              onClick={onTryDemo}
              disabled={demoLoading}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-black text-base font-bold rounded-xl transition-colors"
            >
              {demoLoading ? 'Diving in…' : 'Try Demo →'}
            </button>
            <button
              onClick={onRegister}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-base font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
            >
              Create Account
            </button>
          </div>
          {demoError && (
            <p className="text-red-400 text-sm mt-1">{demoError}</p>
          )}
          <p className="text-slate-500 text-sm mt-2">No credit card · No commitment</p>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="w-full">
            <HeroPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: '🎯',
      title: 'Set your objectives',
      body: 'Name the habits you want to build, set them as dive objectives, and commit. Setup is instant — everything else is on you.',
    },
    {
      icon: '🤿',
      title: 'Complete your dive',
      body: 'Check off every objective before midnight to log a complete dive. All-or-nothing — but every clean day takes you deeper.',
    },
    {
      icon: '📈',
      title: 'Reach new depths',
      body: 'Your streak multiplies your daily XP. Keep it alive long enough and the ocean floor gets closer.',
    },
  ];

  return (
    <section className="py-28 border-t border-slate-800/50">
      <div className="w-full px-6 lg:px-14">
        <h2 className="text-4xl font-black text-white mb-2">How it works</h2>
        <p className="text-slate-500 text-base mb-16">Three steps. No excuses.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="text-cyan-400 text-sm font-black uppercase tracking-widest mb-2">
                Step {i + 1}
              </div>
              <h3 className="text-white font-bold text-xl mb-2">{step.title}</h3>
              <p className="text-slate-400 text-base leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Depth Levels ─────────────────────────────────────────────────────────────

function DepthLevels() {
  return (
    <section className="py-28 border-t border-slate-800/50">
      <div className="w-full px-6 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-cyan-400 text-sm font-black tracking-widest uppercase mb-5">
              The Descent
            </p>
            <h2 className="text-4xl font-black text-white mb-4">
              7 depth levels to unlock
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Seven zones anchored to real ocean depths — from the sunlit surface to the hadal trenches at 36,000 feet. Consistency is the only way down.
            </p>
          </div>

          <div className="relative pl-2">
            <div className="absolute left-[13px] top-3 bottom-3 w-px bg-slate-800" />
            <div className="space-y-5">
              {LEVELS.map(level => (
                <div key={level.level} className="flex items-center gap-4">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 relative z-10"
                    style={{
                      background: level.color,
                      boxShadow: `0 0 10px ${level.color}99`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-bold text-base">{level.title}</span>
                    <span className="text-slate-500 text-sm ml-2 hidden sm:inline">
                      {level.zone}
                    </span>
                  </div>
                  <span className="text-slate-600 text-sm flex-shrink-0">{level.depth}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA({ onRegister, onTryDemo, demoLoading }: {
  onRegister:  () => void;
  onTryDemo:   () => void;
  demoLoading: boolean;
}) {
  return (
    <section className="py-32 border-t border-slate-800/50">
      <div className="w-full px-6 lg:px-14">
        <div className="text-6xl mb-6">🌊</div>
        <h2 className="text-5xl font-black text-white mb-4">Start your descent.</h2>
        <p className="text-slate-500 text-base mb-10">No credit card. No commitment. Just depth.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRegister}
            className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black text-base font-bold rounded-xl transition-colors"
          >
            Create Account →
          </button>
          <button
            onClick={onTryDemo}
            disabled={demoLoading}
            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 text-base font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
          >
            {demoLoading ? 'Diving in…' : 'Try Demo'}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function LandingPage({ onLogin, onRegister, onTryDemo, demoLoading, demoError }: Props) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #080812 0%, #0d0d1f 100%)' }}>
      <Nav onLogin={onLogin} onRegister={onRegister} onTryDemo={onTryDemo} demoLoading={demoLoading} />
      <Hero onRegister={onRegister} onTryDemo={onTryDemo} demoLoading={demoLoading} demoError={demoError} />
      <HowItWorks />
      <DepthLevels />
      <FinalCTA onRegister={onRegister} onTryDemo={onTryDemo} demoLoading={demoLoading} />
    </div>
  );
}
