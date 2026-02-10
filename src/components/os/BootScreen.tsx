import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../i18n/translations';
import { Volume2, VolumeX, SkipForward, Play } from 'lucide-react';

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Try unmuted first
  const videoRef = useRef<HTMLVideoElement>(null);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  
  // Progress state for fallback mode
  const [progress, setProgress] = useState(0);
  const { language } = useLanguage();

  // Fallback Timer
  useEffect(() => {
    if (videoError) {
        const timer = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
            clearInterval(timer);
            setTimeout(onComplete, 500);
            return 100;
            }
            return prev + 2;
        });
        }, 40);
        return () => clearInterval(timer);
    }
  }, [videoError, onComplete]);

  // Autoplay Logic
  useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const attemptPlay = async () => {
          try {
              // 1. Try playing unmuted
              video.muted = false;
              setIsMuted(false);
              await video.play();
              setIsPlaying(true);
          } catch (err) {
              console.warn("Unmuted autoplay failed, falling back to muted.", err);
              try {
                  // 2. Fallback to muted
                  video.muted = true;
                  setIsMuted(true);
                  await video.play();
                  setIsPlaying(true);
              } catch (mutedErr) {
                  console.error("Muted autoplay also failed.", mutedErr);
                  setAutoplayFailed(true);
              }
          }
      };

      attemptPlay();
  }, []);

  const handleVideoError = () => {
      console.warn("Boot video failed to load, falling back to legacy boot screen.");
      setVideoError(true);
  };

  const handleEnded = () => {
      onComplete();
  };

  const toggleMute = () => {
      if (videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
          setIsMuted(videoRef.current.muted);
      }
  };

  const handleStart = () => {
      if (videoRef.current) {
          videoRef.current.muted = false;
          setIsMuted(false);
          videoRef.current.play()
            .then(() => {
                setIsPlaying(true);
                setAutoplayFailed(false);
            })
            .catch(err => console.error("Play failed", err));
      }
  };

  if (videoError) {
      // Legacy Fallback (omitted for brevity, same as before but I must write full file to avoid truncation)
      return (
        <motion.div 
            className="fixed inset-0 bg-[#0d1117] z-[9999] flex flex-col items-center justify-center text-white"
            exit={{ opacity: 0, transition: { duration: 1 } }}
        >
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1 }}
                className="text-6xl mb-8 flex flex-col items-center gap-4"
            >
                <div className="text-8xl animate-pulse">🦞</div>
                <div className="font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-[#ff6b35]">
                    {getTranslation('logo.clawdos', language)}
                </div>
            </motion.div>

            <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden relative">
                <motion.div 
                    className="h-full bg-[#ff6b35] shadow-[0_0_10px_#ff6b35]"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="mt-2 text-xs text-gray-500 font-mono">
                {progress < 100 
                ? `${getTranslation('boot.loading', language)} ${progress}%` 
                : getTranslation('boot.ready', language)}
            </div>
        </motion.div>
      );
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
        {/* Helper text if not playing (completely blocked) */}
        {(!isPlaying && autoplayFailed) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer" onClick={handleStart}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-4 text-white/80 hover:text-white"
                >
                    <div className="p-6 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                        <Play className="w-12 h-12 fill-current" />
                    </div>
                    <span className="text-sm font-mono tracking-widest uppercase opacity-70">
                        Initialize System
                    </span>
                </motion.button>
            </div>
        )}

        {/* Video Element - Removed autoPlay/muted props to handle manually in useEffect */}
        <video
            ref={videoRef}
            src="/boot.mp4"
            className="w-full h-full object-cover"
            playsInline
            onEnded={handleEnded}
            onError={handleVideoError}
        />

        {/* Controls Overlay */}
        <div className="absolute bottom-8 right-8 flex gap-4 z-20">
            {/* Show Unmute Prompt if playing but muted */}
            {(isPlaying && isMuted) && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 text-white/80 text-xs font-mono mr-2 pointer-events-none"
                >
                    <VolumeX className="w-4 h-4 text-red-400" /> Auto-muted by browser
                </motion.div>
            )}

            {isPlaying && (
                <button 
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-black/30 text-white/50 hover:text-white hover:bg-black/50 transition-all"
                >
                    {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}
            
            <button 
                onClick={onComplete}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all text-xs font-mono uppercase tracking-wider backdrop-blur-md"
            >
                Skip Boot <SkipForward className="w-3 h-3" />
            </button>
        </div>

    </motion.div>
  );
};

export default BootScreen;
