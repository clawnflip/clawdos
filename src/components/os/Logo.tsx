import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../i18n/translations';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", showText = true }) => {
  const { language } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon */}
      <div className="relative group shrink-0 w-full h-full aspect-square">
        <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full drop-shadow-[0_0_10px_rgba(255,69,0,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(255,69,0,0.8)]"
        >
            <defs>
                <linearGradient id="lobsterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4500" />
                    <stop offset="100%" stopColor="#ff8c00" />
                </linearGradient>
            </defs>
            {/* Abstract Claw Shape */}
            <path 
                d="M50 20 C 70 20, 85 35, 85 60 C 85 80, 70 90, 50 90 C 40 90, 35 80, 35 70" 
                fill="none" 
                stroke="url(#lobsterGradient)" 
                strokeWidth="8" 
                strokeLinecap="round"
            />
            <path 
                d="M50 35 C 30 35, 15 50, 15 75" 
                fill="none" 
                stroke="url(#lobsterGradient)" 
                strokeWidth="8" 
                strokeLinecap="round"
            />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
          <div className="flex flex-col leading-none justify-center">
            {language === 'zh' ? (
                 <span className="font-extrabold text-white tracking-widest text-lg font-sans">
                    {getTranslation('logo.clawdos', language)}
                </span>
            ) : (
                <span className="font-extrabold text-white tracking-widest text-lg font-sans">
                    CLAWD<span className="text-[var(--color-lobster-accent)]">OS</span>
                </span>
            )}
            <span className="text-[0.5em] text-white/50 tracking-[0.3em] font-mono uppercase">
                {getTranslation('logo.intelligence', language)}
            </span>
          </div>
      )}
    </div>
  );
};

export default Logo;
