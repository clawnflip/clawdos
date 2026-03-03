import { useState, useEffect } from 'react';
import { OSProvider } from './contexts/OSContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Desktop from './components/os/Desktop';
import BootScreen from './components/os/BootScreen';
import MobileOS from './components/os/MobileOS';
import { useMediaQuery } from './hooks/useMediaQuery';
import { AnimatePresence } from 'framer-motion';
import AmbassadorApply from './components/ambassador/AmbassadorApply';

const isMiniApp = window.location.search.includes('miniApp=true') ||
  window.location.pathname.startsWith('/mini') ||
  window.parent !== window;

function AppContent() {
  // Routing bypass for Ambassador Apply page
  if (window.location.pathname === '/apply') {
    return <AmbassadorApply />;
  }

  const [booted, setBooted] = useState(isMiniApp);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!isMiniApp) return;
    import('@farcaster/miniapp-sdk').then(({ sdk }) => {
      sdk.actions.ready();
    });
  }, []);

  return (
    <>
      <AnimatePresence>
        {!booted && <BootScreen onComplete={() => setBooted(true)} />}
      </AnimatePresence>
      {booted && (isMiniApp || isMobile ? <MobileOS /> : <Desktop />)}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <OSProvider>
        <AppContent />
      </OSProvider>
    </LanguageProvider>
  );
}

export default App;
