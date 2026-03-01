import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from '../../contexts/OSContext';

interface MobileAppViewProps {
  appId: string;
}

const MobileAppView: React.FC<MobileAppViewProps> = ({ appId }) => {
  const { windows, closeWindow } = useOS();
  const windowState = windows.find(w => w.id === appId);

  if (!windowState || !windowState.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute inset-0 z-[100] bg-[var(--color-bg-desktop)] flex flex-col pt-8"
      >
        {/* The app container */}
        <div className="flex-1 w-full bg-black relative">
           {windowState.component}
        </div>
        
        {/* Home Indicator - Swipe/Tap to go home */}
        <div 
          className="h-6 w-full bg-black flex justify-center items-center pb-2 cursor-pointer pt-2"
          onClick={() => closeWindow(appId)}
        >
            <div className="w-1/3 h-1.5 bg-white/50 rounded-full hover:bg-white/80 transition-colors" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileAppView;
