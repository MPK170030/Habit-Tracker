import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HABITS = [
  { emoji: '🏃', name: 'Morning Run' },
  { emoji: '📚', name: 'Read 30 min' },
  { emoji: '🧘', name: 'Meditate' },
  { emoji: '💧', name: 'Drink Water' },
];

const STREAK   = 21;
const XP_START = 2400;
const XP_GAIN  = 100;

// How long each stage takes (ms)
const CHECK_INTERVAL = 900;
const COMPLETE_HOLD  = 2200;
const RESET_HOLD     = 600;

export function HeroPreview() {
  const [checked, setChecked]     = useState<number[]>([]);
  const [complete, setComplete]   = useState(false);
  const [xp, setXp]               = useState(XP_START);

  const xpPercent = Math.min(((xp - 1500) / (2500 - 1500)) * 100, 100);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function runSequence(step: number) {
      if (step < HABITS.length) {
        timeout = setTimeout(() => {
          setChecked(prev => [...prev, step]);
          setXp(prev => prev + Math.round(XP_GAIN / HABITS.length));
          runSequence(step + 1);
        }, CHECK_INTERVAL);
      } else {
        timeout = setTimeout(() => {
          setComplete(true);
          timeout = setTimeout(reset, COMPLETE_HOLD);
        }, CHECK_INTERVAL * 0.5);
      }
    }

    function reset() {
      setComplete(false);
      setChecked([]);
      setXp(XP_START);
      timeout = setTimeout(() => runSequence(0), RESET_HOLD);
    }

    timeout = setTimeout(() => runSequence(0), 800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="w-full rounded-2xl border border-slate-700/60 overflow-hidden"
      style={{
        background: 'rgba(8,8,18,0.92)',
        boxShadow: '0 0 60px #22d3ee18, 0 0 120px #22d3ee0a',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-bold text-lg">🤿 Today's Dive</span>
          <span className="text-slate-500 text-sm">Lv.5 · Hadal Pioneer</span>
        </div>
        <p className="text-slate-600 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Habit rows */}
      <div className="px-5 pt-4 space-y-2.5">
        {HABITS.map((h, i) => {
          const isChecked = checked.includes(i);
          return (
            <motion.div
              key={h.name}
              animate={{
                backgroundColor: isChecked ? 'rgba(6,78,59,0.3)' : 'rgba(30,41,59,0.6)',
                borderColor:     isChecked ? 'rgba(52,211,153,0.3)' : 'rgba(71,85,105,0.6)',
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-3.5 rounded-xl border"
            >
              {/* Checkbox */}
              <motion.div
                animate={{
                  backgroundColor: isChecked ? '#10b981' : 'transparent',
                  borderColor:     isChecked ? '#10b981' : '#475569',
                  scale:           isChecked ? [1, 1.25, 1] : 1,
                }}
                transition={{ duration: 0.25, times: [0, 0.4, 1] }}
                className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0"
              >
                <AnimatePresence>
                  {isChecked && (
                    <motion.svg
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-3.5 h-3.5 text-white"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                    >
                      <motion.path
                        strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.div>

              <span className="text-xl flex-shrink-0">{h.emoji}</span>
              <motion.span
                animate={{ color: isChecked ? '#64748b' : '#f1f5f9' }}
                transition={{ duration: 0.3 }}
                className="font-medium text-base flex-1"
                style={{ textDecoration: isChecked ? 'line-through' : 'none' }}
              >
                {h.name}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* XP bar */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex justify-between text-sm text-slate-500 mb-1.5">
          <span>{xp.toLocaleString()} XP</span>
          <span className="text-cyan-600">{Math.round(xpPercent)}% to Trench Diver</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #22d3ee, #818cf8)' }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-cyan-500 text-sm">🤿 {STREAK}-day streak</span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-500 text-sm">+{XP_GAIN} XP today</span>
        </div>
      </div>

      {/* Completion banner */}
      <div className="px-5 pb-5">
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rounded-xl border border-emerald-700/50 bg-emerald-950/60 p-4 text-center"
            >
              <div className="text-2xl mb-0.5">🏆</div>
              <div className="text-emerald-400 font-bold text-base">Dive Complete!</div>
              <div className="text-slate-400 text-sm mt-0.5">
                Dive logged · 🤿 {STREAK}-day streak — keep descending!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
