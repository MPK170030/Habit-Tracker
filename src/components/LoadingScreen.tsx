export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #080812 0%, #0d0d1f 100%)' }}
    >
      <div className="text-cyan-400 text-4xl animate-pulse">🌊</div>
    </div>
  );
}
