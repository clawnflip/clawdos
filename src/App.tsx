import { useState } from 'react';
import { OSProvider } from './contexts/OSContext';
import Desktop from './components/os/Desktop';
import BootScreen from './components/os/BootScreen';
import PodcastScreen from './components/apps/PodcastScreen';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <OSProvider>
      <PodcastScreen />
      {/* 
      <AnimatePresence>
        {!booted && <BootScreen onComplete={() => setBooted(true)} />}
      </AnimatePresence>
      {booted && <Desktop />} 
      */}
    </OSProvider>
  );
}

export default App;
