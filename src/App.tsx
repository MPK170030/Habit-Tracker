import { useState, useMemo, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './pages/AuthModal';
import { MainApp } from './pages/MainApp';
import { LoadingScreen } from './components/LoadingScreen';
import { CanvasErrorBoundary } from './components/CanvasErrorBoundary';

const CausticsBackground = lazy(() => import('./components/CausticsBackground'));

export default function App() {
  const { user, loading: authLoading, login } = useAuth();

  const resetToken = useMemo(() => new URLSearchParams(window.location.search).get('token'), []);
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'reset' | null>(
    resetToken ? 'reset' : null
  );
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError]     = useState<string | null>(null);

  async function handleTryDemo() {
    setDemoError(null);
    setDemoLoading(true);
    try {
      await login('demo@warrior.dev', 'demo1234');
    } catch {
      setDemoError('Demo unavailable. Log in manually: demo@warrior.dev / demo1234');
    } finally {
      setDemoLoading(false);
    }
  }

  if (authLoading) return <LoadingScreen />;

  if (!user) {
    return (
      <>
        <LandingPage
          onLogin={() => setAuthModal('login')}
          onRegister={() => setAuthModal('register')}
          onTryDemo={handleTryDemo}
          demoLoading={demoLoading}
          demoError={demoError}
        />
        {authModal && (
          <AuthModal
            initialMode={authModal}
            resetToken={resetToken}
            onClose={() => setAuthModal(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <CanvasErrorBoundary>
        <Suspense fallback={null}>
          <CausticsBackground />
        </Suspense>
      </CanvasErrorBoundary>
      <MainApp />
    </>
  );
}
