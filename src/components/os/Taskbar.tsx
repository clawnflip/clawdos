import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../contexts/OSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../i18n/translations';
import { Disc, Monitor, Power, Search } from 'lucide-react';
import TokenTicker from './TokenTicker';

const CLAWDOS_TIMEZONE = 'America/New_York';

const Taskbar: React.FC = () => {
  const { windows, activeWindowId, focusWindow, minimizeWindow } = useOS();
  const { language, setLanguage } = useLanguage();
  const [time, setTime] = useState(new Date());
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[var(--taskbar-height)] glass-panel border-t border-[var(--color-glass-border)] flex items-center justify-between px-2 z-[var(--z-index-taskbar)]">
      
      {/* Start Button & Left Side */}
      <div className="flex items-center gap-3">
        <button 
            className="flex items-center justify-center p-2 rounded hover:bg-white/10 transition-colors group"
            onClick={() => setIsStartOpen(!isStartOpen)}
        >
             {/* Lobster Claw Icon Placeholder */}
            <div className="text-[var(--color-lobster-accent)] font-bold text-xl group-hover:lobster-glow">
                🦞
            </div>
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center bg-[rgba(255,255,255,0.1)] rounded-full px-3 py-1 text-sm text-[var(--color-text-secondary)] w-48 border border-transparent focus-within:border-[var(--color-lobster-accent)] transition-colors">
            <Search size={14} className="mr-2" />
            <input 
                type="text" 
                placeholder={getTranslation('taskbar.search', language)}
                className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400 text-xs"
            />
        </div>
      </div>

      {/* Center - Running Apps */}
      <div className="flex items-center gap-1 flex-1 justify-center px-4">
        {windows.map(window => (
          <button
            key={window.id}
            onClick={() => {
                if (activeWindowId === window.id && !window.isMinimized) {
                    minimizeWindow(window.id);
                } else {
                    focusWindow(window.id);
                }
            }}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md transition-all border
                ${activeWindowId === window.id && !window.isMinimized
                    ? 'bg-white/10 border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.2)]' 
                    : 'bg-transparent border-transparent hover:bg-white/5'
                }
            `}
          >
            <span className="text-white opacity-80">{window.icon || <Monitor size={16} />}</span>
            <span className="text-xs text-white max-w-[100px] truncate hidden sm:block">
                {window.title}
            </span>
            {activeWindowId === window.id && !window.isMinimized && (
                <div className="w-1 h-1 bg-[var(--color-lobster-accent)] rounded-full glow-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Right Side - Tray */}
      <div className="flex items-center gap-4 px-2">
        <TokenTicker />
        <div className="h-6 w-[1px] bg-white/10" />
        
        {/* Language Selector */}
        <div className="relative" ref={langMenuRef}>
            <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-xs text-white"
            >
                <span>{language === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
                <span className="hidden sm:inline">{language === 'zh' ? 'ZH' : 'EN'}</span>
            </button>
            
            {isLangMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-32 glass-panel rounded-lg border border-[var(--color-glass-border)] overflow-hidden shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <div className="py-1">
                        <button 
                            onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-lobster-accent)] hover:text-black transition-colors flex items-center justify-between ${language === 'en' ? 'text-[var(--color-lobster-accent)] bg-white/5' : 'text-white'}`}
                        >
                            <span className="flex items-center gap-2">🇺🇸 English</span>
                            {language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-lobster-accent)]" />}
                        </button>
                        <button 
                            onClick={() => { setLanguage('zh'); setIsLangMenuOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-lobster-accent)] hover:text-black transition-colors flex items-center justify-between ${language === 'zh' ? 'text-[var(--color-lobster-accent)] bg-white/5' : 'text-white'}`}
                        >
                            <span className="flex items-center gap-2">🇨🇳 中文</span>
                            {language === 'zh' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-lobster-accent)]" />}
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="h-6 w-[1px] bg-white/10" />

        <div className="flex flex-col items-end leading-none cursor-default">
            <span className="text-xs font-medium text-white">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: CLAWDOS_TIMEZONE })} ET
            </span>
            <span className="text-[10px] text-gray-400">
              {time.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: CLAWDOS_TIMEZONE })}
            </span>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
            <Power size={18} />
        </button>
      </div>
      
      {/* Start Menu Popup (Simple version) */}
      {isStartOpen && (
        <div className="absolute bottom-[var(--taskbar-height)] left-2 mb-2 w-80 h-96 glass-panel rounded-lg flex flex-col p-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
             <div className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
                 {getTranslation('taskbar.startMenu', language)}
             </div>
             <div className="grid grid-cols-4 gap-2">
                <div className="aspect-square bg-white/5 rounded flex items-center justify-center hover:bg-white/10 cursor-pointer">
                    <Monitor size={24} className="text-blue-400" />
                </div>
                 <div className="aspect-square bg-white/5 rounded flex items-center justify-center hover:bg-white/10 cursor-pointer">
                    <Disc size={24} className="text-[var(--color-lobster-accent)]" />
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default Taskbar;
