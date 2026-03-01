import React from 'react';
import { useOS } from '../../contexts/OSContext';
import type { FileSystemItem } from '../../contexts/OSContext';
import { Folder, FileText, Globe, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileIconProps {
  item: FileSystemItem;
  showName?: boolean;
}

const MobileIcon: React.FC<MobileIconProps> = ({ item, showName = true }) => {
  const { openWindow, executeTerminalCommand } = useOS();

  const renderIconContent = () => {
    if (item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/'))) {
        return <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-[14px]" />;
    }
    if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/'))) {
        return <img src={item.icon} alt={item.name} className="w-[80%] h-[80%] object-contain" />;
    }
    
    // Explicit overrides/fallbacks
    if (item.name === 'Clawnch') return <span className="text-4xl drop-shadow-md">🦞</span>;
    if (item.name === 'Claw Terminal') return <span className="text-3xl drop-shadow-md font-mono text-green-500 flex items-center justify-center w-full h-full bg-black rounded-[14px] border border-green-500/30">&gt;_</span>;
    if (item.name === 'Agent Chat') return <span className="text-4xl drop-shadow-md">💬</span>;
    if (item.name === 'Flappy Agent') return <span className="text-4xl drop-shadow-md">🦞</span>;
    if (item.name === 'Agent Arena') return <span className="text-4xl drop-shadow-md">🏟️</span>;
    if (item.name === 'ClawdOS Terminal') return <span className="text-3xl drop-shadow-md font-mono text-green-500 flex items-center justify-center w-full h-full bg-black rounded-[14px] border border-green-500/30">&gt;_</span>;
    if (item.name === 'My Computer') return <Anchor size={36} className="text-[var(--color-lobster-accent)]" />;
    if (item.name === 'ClawdOS Store') return <img src="/ClawdOStore.png" alt="Store" className="w-full h-full object-cover rounded-[14px]" />;
    
    // Office Icons
    if (item.name === 'ClawdWord' || item.name.endsWith('.txt')) return <span className="text-4xl">📝</span>;
    if (item.name === 'ClawdExcel' || item.name.endsWith('.xlsx')) return <span className="text-4xl">📊</span>;
    if (item.name === 'ClawdPoint' || item.name.endsWith('.ppt')) return <span className="text-4xl">📽️</span>;

    switch (item.type) {
      case 'folder': return <Folder size={36} className="text-yellow-400 drop-shadow-lg" fill="currentColor" />;
      case 'link': 
        if (item.name.includes('Moltx')) return <Globe size={36} className="text-[var(--color-lobster-accent)] drop-shadow-md" />;
        return <Globe size={36} className="text-blue-400 drop-shadow-md" />;
      default: return <FileText size={36} className="text-gray-300 drop-shadow-md" />;
    }
  };

  const handleTap = () => {
    // Determine dimensions (full screen on mobile)
    const size = { width: window.innerWidth, height: window.innerHeight };

    if (item.name === 'Claw Terminal') {
        import('../apps/TerminalApp').then(module => {
             const TerminalApp = module.default;
             openWindow('Claw Terminal', <TerminalApp />, <span className="font-mono text-xs font-bold">&gt;_</span>, size, {x:0,y:0});
         });
         return;
    }

    if (item.name === 'Agent Chat') {
        import('../apps/AgentChat').then(module => {
            const AgentChat = module.default;
            openWindow('Agent Chat', <AgentChat />, <span>💬</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'Data Terminal') {
        import('../apps/MarketTerminal').then(module => {
            const MarketTerminal = module.default;
            openWindow('Open Trident Data', <MarketTerminal />, <span>📊</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'Flappy Agent') {
        import('../apps/FlappyAgent').then(module => {
            const FlappyAgent = module.default;
            openWindow('Flappy Agent', <FlappyAgent />, <span>🦞</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'Agent Arena') {
        import('../apps/AgentArena').then(module => {
            const AgentArena = module.default;
            openWindow('Agent Arena', <AgentArena spectatorOnly={true} />, <span>🏟️</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'ClawdOS Terminal') {
        executeTerminalCommand('x_advisor');
        return;
    }

    if (item.name === 'ClawdOS Store') {
        import('../apps/ClawdOSStore').then(module => {
            const ClawdOSStore = module.default;
            openWindow('ClawdOS Store', <ClawdOSStore />, <img src="/ClawdOStore.png" alt="Store" className="w-8 h-8" />, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'Developer Docs') {
        import('../apps/ClawdOSDocs').then(module => {
            const ClawdOSDocs = module.default;
            openWindow('Developer Docs', <ClawdOSDocs />, <span>📖</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'Publish App') {
        import('../apps/AppSubmitter').then(module => {
            const AppSubmitter = module.default;
            openWindow('Publish App', <AppSubmitter />, <span>📤</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'ClawdVille') {
        // Open window instantly via window.open directly since it's external
        window.open(item.url, '_blank');
        return;
    }

    // Office Apps
    if (item.name === 'ClawdWord' || (item.name.endsWith('.txt') && item.type === 'file')) {
        import('../apps/office/ClawdWord').then(module => {
            const ClawdWord = module.default;
            openWindow(item.name, <ClawdWord fileId={item.id} initialContent={item.content} fileName={item.name} />, <span>📝</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'ClawdExcel' || (item.name.endsWith('.xlsx') && item.type === 'file')) {
        import('../apps/office/ClawdExcel').then(module => {
            const ClawdExcel = module.default;
            openWindow(item.name, <ClawdExcel fileId={item.id} initialContent={item.content} />, <span>📊</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.name === 'ClawdPoint' || (item.name.endsWith('.ppt') && item.type === 'file')) {
        import('../apps/office/ClawdPoint').then(module => {
            const ClawdPoint = module.default;
            openWindow(item.name, <ClawdPoint fileId={item.id} initialContent={item.content} />, <span>📽️</span>, size, {x:0,y:0});
        });
        return;
    }

    if (item.type === 'link' && item.url) {
        // Handle iframe-blocking websites (like CMC) by offering an external link or automatically opening it
        if (item.name === 'Clawnch Market Cap' || item.name === 'ClawdVille') {
             window.open(item.url, '_blank');
             return; // Don't open an internal window
        }
        openWindow(item.name, <iframe src={item.url} title={item.name} className="w-full h-full border-0 bg-white" />, item.icon && item.icon.startsWith('http') ? <img src={item.icon} className="w-4 h-4" /> : <Globe size={16} />, size, {x:0,y:0});
    } else if (item.type === 'folder') {
        import('../apps/FolderWindow').then(module => {
            const FolderWindow = module.default;
            // For folders, we might still want window-like or full-screen
            openWindow(item.name, <FolderWindow folderId={item.id} />, <Folder size={16} />, size, {x:0,y:0});
        });
    } else if (item.type === 'file' && (item.content || item.appUrl)) {
        import('../apps/MiniAppRunner').then(module => {
            const MiniAppRunner = module.default;
            openWindow(item.name, <MiniAppRunner initialCode={item.content} appId={item.id} appUrl={item.appUrl} appType={item.appType || 'code'} />, item.imageUrl ? <img src={item.imageUrl} className="w-4 h-4 rounded" /> : <span>📱</span>, size, {x:0,y:0});
        });
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 w-[72px]" onClick={handleTap}>
      <motion.div 
        whileTap={{ scale: 0.9 }}
        className="w-[60px] h-[60px] rounded-[14px] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm border border-white/10 overflow-hidden relative"
      >
        {renderIconContent()}
      </motion.div>
      {showName && (
        <span className="text-white text-[11px] font-medium truncate w-full text-center tracking-wide drop-shadow-md mt-1">
          {item.name}
        </span>
      )}
    </div>
  );
};

export default MobileIcon;
