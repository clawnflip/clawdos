import React, { useState, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import MobileIcon from './MobileIcon';
import MobileAppView from './MobileAppView';
import { Wifi, Signal, Battery } from 'lucide-react'; 

const CLAWDOS_TIMEZONE = 'America/New_York';

const MobileOS: React.FC = () => {
  const { files, activeWindowId, windows } = useOS();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let desktopItems = files.filter(f => f.parentId === 'desktop' || f.parentId === 'system_tools');
  // Hide the system tools folder itself from the home screen
  desktopItems = desktopItems.filter(f => f.id !== 'system_tools');
  
  // Custom logic to pick standard dock items: Store, ClawdVille, Chat, Terminal
  const dockAppIds = ['clawdos_store', 'clawdville', 'agent_chat', 'terminal']; 
  
  const dockItems = dockAppIds.map(id => files.find(f => f.id === id)).filter(Boolean) as any[];
  
  // Fill rest of dock if not found
  if (dockItems.length < 4) {
      const extra = desktopItems.filter(i => !dockItems.find(d => d.id === i.id)).slice(0, 4 - dockItems.length);
      dockItems.push(...extra);
  }

  const homeItems = desktopItems.filter(item => !dockItems.find(d => d.id === item.id));

  const activeApp = windows.find(w => w.id === activeWindowId);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white selection:bg-transparent">
      {/* Background - iOS style wallpaper */}
      <div 
        className="absolute inset-0 pointer-events-none bg-no-repeat bg-center"
        style={{ backgroundImage: 'url("/clawdosmobile.png")', backgroundSize: '100% 100%' }}
      >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      </div>

      {/* iOS Status Bar */}
      <div className="absolute top-0 w-full h-12 flex items-center justify-between px-6 z-50 text-xs font-medium pointer-events-none">
        <div className="w-16">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: CLAWDOS_TIMEZONE })}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl shadow-md" /> {/* Dynamic Island */}
        <div className="flex items-center gap-1.5 justify-end w-16">
          <Signal size={14} />
          <Wifi size={14} />
          <Battery size={16} />
        </div>
      </div>

      {/* Persistent Mobile Notification for ClawdVille */}
      {!activeApp && (
        <div 
            className="absolute top-16 left-4 right-4 z-40 bg-[#1c1c1e]/80 backdrop-blur-xl rounded-[20px] p-4 shadow-2xl border border-white/10 flex items-start gap-4 cursor-pointer"
            onClick={() => {
                const url = 'https://www.clawdville.xyz/';
                window.open(url, '_blank');
            }}
        >
            <img src="/clawdville.png" alt="Icon" className="w-10 h-10 rounded-lg drop-shadow-md flex-shrink-0" />
            <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                    <span className="text-white font-semibold text-[13px]">ClawdVille</span>
                    <span className="text-gray-400 text-[11px]">Now</span>
                </div>
                <p className="text-gray-200 text-[13px] leading-tight">
                    Don't forget to apply for ClawdVille early access!
                </p>
            </div>
        </div>
      )}

      {activeApp ? (
        <MobileAppView appId={activeApp.id} />
      ) : (
        <div 
          className="w-full h-full pb-[120px] px-6 flex flex-col justify-start overflow-y-auto no-scrollbar relative z-10"
          style={{ paddingTop: '190px' }}
        >
          <div className="flex flex-row flex-wrap justify-between gap-x-2 gap-y-8">
            {homeItems.map(item => (
              <MobileIcon key={item.id} item={item} />
            ))}
          </div>

          <div className="fixed bottom-6 left-4 right-4 h-[84px] rounded-3xl bg-white/20 backdrop-blur-3xl border border-white/10 flex items-center justify-around px-2 z-20 shadow-xl">
            {dockItems.map(item => (
              <MobileIcon key={item.id} item={item} showName={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default MobileOS;
