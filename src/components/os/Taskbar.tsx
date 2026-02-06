import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useOS } from '../../contexts/OSContext';
import { Disc, Monitor, Power, Search } from 'lucide-react'; // Disc as a claw-like shape?

const Taskbar: React.FC = () => {
  const { windows, activeWindowId, focusWindow, minimizeWindow } = useOS();
  const [time, setTime] = useState(new Date());
  const [isStartOpen, setIsStartOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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
                placeholder="Search ClawdOS..." 
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
        <div className="flex flex-col items-end leading-none cursor-default">
            <span className="text-xs font-medium text-white">{format(time, 'HH:mm')}</span>
            <span className="text-[10px] text-gray-400">{format(time, 'dd/MM/yyyy')}</span>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
            <Power size={18} />
        </button>
      </div>
      
      {/* Start Menu Popup (Simple version) */}
      {isStartOpen && (
        <div className="absolute bottom-[var(--taskbar-height)] left-2 mb-2 w-80 h-96 glass-panel rounded-lg flex flex-col p-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
             <div className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">ClawdOS Menu</div>
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
