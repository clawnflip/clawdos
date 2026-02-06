import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40); // 2 seconds approx

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 bg-[var(--color-bg-desktop)] z-[9999] flex flex-col items-center justify-center text-white"
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-6xl mb-8 flex flex-col items-center gap-4"
        >
            <div className="text-8xl animate-pulse">🦞</div>
            <div className="font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-[var(--color-lobster-accent)]">
                ClawdOS
            </div>
        </motion.div>

        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden relative">
            <motion.div 
                className="h-full bg-[var(--color-lobster-accent)] shadow-[0_0_10px_var(--color-lobster-accent)]"
                style={{ width: `${progress}%` }}
            />
        </div>
        <div className="mt-2 text-xs text-gray-500 font-mono">
            {progress < 100 ? `Loading System Resources... ${progress}%` : 'System Ready'}
        </div>
    </motion.div>
  );
};

export default BootScreen;
