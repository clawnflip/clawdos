import { useState } from 'react';
import { OSProvider } from './contexts/OSContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Desktop from './components/os/Desktop';
import BootScreen from './components/os/BootScreen';
import MobileOS from './components/os/MobileOS';
import { useMediaQuery } from './hooks/useMediaQuery';
import { AnimatePresence } from 'framer-motion';
import AmbassadorApply from './components/ambassador/AmbassadorApply';

function AppContent() {
  // Routing bypass for Ambassador Apply page
  if (window.location.pathname === '/apply') {
    return <AmbassadorApply />;
  }

  const [booted, setBooted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <>
      <AnimatePresence>
        {!booted && <BootScreen onComplete={() => setBooted(true)} />}
      </AnimatePresence>
      {booted && (isMobile ? <MobileOS /> : <Desktop />)}
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
