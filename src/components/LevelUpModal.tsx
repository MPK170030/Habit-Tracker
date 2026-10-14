import { useEffect, useState, lazy, Suspense } from 'react';
import { LEVELS } from '../types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';

const OceanAvatar = lazy(() => import('./OceanAvatar'));

interface Props {
  prevLevel: number;
  newLevel: number;
  onClose: () => void;
}

const SPARKLE_POSITIONS = [
  { left: '10%', top: '12%', delay: '0s'    },
  { left: '28%', top: '6%',  delay: '0.1s'  },
  { left: '50%', top: '4%',  delay: '0.2s'  },
  { left: '72%', top: '8%',  delay: '0.15s' },
  { left: '88%', top: '18%', delay: '0.05s' },
  { left: '92%', top: '42%', delay: '0.3s'  },
  { left: '88%', top: '68%', delay: '0.25s' },
  { left: '72%', top: '88%', delay: '0.1s'  },
  { left: '50%', top: '92%', delay: '0.35s' },
  { left: '28%', top: '88%', delay: '0.2s'  },
  { left: '10%', top: '70%', delay: '0.4s'  },
  { left: '6%',  top: '45%', delay: '0.15s' },
];

export function LevelUpModal({ prevLevel, newLevel, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const levelData = LEVELS.find(l => l.level === newLevel);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-slate-900 border-2 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl transition-all duration-300 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        style={{ borderColor: levelData?.color }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {SPARKLE_POSITIONS.map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full modal-sparkle"
              style={{ left: pos.left, top: pos.top, animationDelay: pos.delay, background: levelData?.color }}
            />
          ))}
        </div>

        <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: levelData?.color }}>
          🌊 New Depth Reached 🌊
        </div>

        <div className="text-6xl font-black text-white mb-1 drop-shadow-lg">
          {prevLevel} <span style={{ color: levelData?.color }}>→</span> {newLevel}
        </div>

        <div className="font-black text-2xl mb-1" style={{ color: levelData?.color }}>
          {levelData?.title}
        </div>

        <div className="text-slate-500 text-xs tracking-widest uppercase mb-5">
          {levelData?.zone} · {levelData?.depth}
        </div>

        <div className="w-32 h-44 mx-auto mb-6">
          <CanvasErrorBoundary fallback={
            <div className="w-full h-full flex items-center justify-center text-6xl">🤿</div>
          }>
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center text-6xl">🤿</div>
            }>
              <OceanAvatar level={newLevel} />
            </Suspense>
          </CanvasErrorBoundary>
        </div>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You've descended deeper. Maintain your dive streak to earn bonus depth every day.
        </p>

        <button
          onClick={handleClose}
          className="w-full py-3 font-black rounded-xl transition-colors uppercase tracking-widest text-sm text-black"
          style={{ background: levelData?.color }}
        >
          Descend Further →
        </button>
      </div>
    </div>
  );
}
