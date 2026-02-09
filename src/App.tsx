import { useState } from 'react';
import { OSProvider } from './contexts/OSContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Desktop from './components/os/Desktop';
import BootScreen from './components/os/BootScreen';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <LanguageProvider>
      <OSProvider>
        <AnimatePresence>
          {!booted && <BootScreen onComplete={() => setBooted(true)} />}
        </AnimatePresence>
        {booted && <Desktop />}
      </OSProvider>
    </LanguageProvider>
  );
}

export default App;
