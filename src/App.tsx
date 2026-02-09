import { OSProvider } from './contexts/OSContext';
import PodcastScreen from './components/apps/PodcastScreen';

function App() {

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
