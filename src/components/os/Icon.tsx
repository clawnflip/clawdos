import React from 'react';
import { useOS } from '../../contexts/OSContext';
import type { FileSystemItem } from '../../contexts/OSContext';
import { Folder, FileText, Globe, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

interface IconProps {
  item: FileSystemItem;
}

const Icon: React.FC<IconProps> = ({ item }) => {
  const { openWindow, moveFile } = useOS();

  const renderIconContent = () => {
    // Check if icon is a URL (starts with http/https) or emoji
    if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/'))) {
        return <img src={item.icon} alt={item.name} className="w-12 h-12 object-contain drop-shadow-md" />;
    }
    
    // Explicit overrides/fallbacks
    if (item.name === 'Clawnch') return <span className="text-5xl drop-shadow-md">🦞</span>;
    if (item.name === 'Claw Terminal') return <span className="text-5xl drop-shadow-md font-mono text-green-500">&gt;_</span>;
    if (item.name === 'Agent Chat') return <span className="text-5xl drop-shadow-md">💬</span>;
    if (item.name === 'Flappy Agent') return <span className="text-5xl drop-shadow-md">🦞</span>;
    if (item.name === 'My Computer') return <Anchor size={48} className="text-[var(--color-lobster-accent)]" />;

    switch (item.type) {
      case 'folder': return <Folder size={48} className="text-yellow-400 drop-shadow-lg" fill="currentColor" />;
      case 'link': 
        if (item.name.includes('Moltx')) return <Globe size={48} className="text-[var(--color-lobster-accent)] drop-shadow-md" />;
        return <Globe size={48} className="text-blue-400 drop-shadow-md" />;
      default: return <FileText size={48} className="text-gray-300 drop-shadow-md" />;
    }
  };

  const handleDoubleClick = () => {
    if (item.name === 'Claw Terminal') {
        import('../apps/TerminalApp').then(module => {
             const TerminalApp = module.default;
             openWindow(
                 'Claw Terminal',
                 <TerminalApp />,
                 <span className="font-mono text-xs font-bold">&gt;_</span>,
                 { width: 700, height: 500 }
             );
         });
         return;
    }

    if (item.name === 'Agent Chat') {
        import('../apps/AgentChat').then(module => {
            const AgentChat = module.default;
            openWindow(
                'Agent Chat',
                <AgentChat />,
                <span>💬</span>,
                { width: 400, height: 600 }
            );
        });
        return;
    }

    if (item.name === 'Data Terminal') {
        import('../apps/MarketTerminal').then(module => {
            const MarketTerminal = module.default;
            openWindow(
                'Open Trident Data',
                <MarketTerminal />,
                <span>📊</span>,
                { width: 800, height: 600 }
            );
        });
        return;
    }

    if (item.name === 'Flappy Agent') {
        import('../apps/FlappyAgent').then(module => {
            const FlappyAgent = module.default;
            openWindow(
                'Flappy Agent',
                <FlappyAgent />,
                <span>🦞</span>,
                { width: 400, height: 500 }
            );
        });
        return;
    }

    if (item.type === 'link' && item.url) {
        openWindow(
            item.name, 
            <iframe src={item.url} title={item.name} className="w-full h-full border-0" />,
            item.icon && item.icon.startsWith('http') ? <img src={item.icon} className="w-4 h-4" /> : <Globe size={16} />
        );
    } else if (item.type === 'folder') {
        import('../apps/FolderWindow').then(module => {
            const FolderWindow = module.default;
            openWindow(
                item.name,
                <FolderWindow folderId={item.id} />,
                <Folder size={16} />,
                { width: 500, height: 400 }
            );
        });
    }
  };

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-1 w-24 h-28 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group relative z-10"
      onDoubleClick={handleDoubleClick}
      whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
      onDragEnd={(_, info) => {
        // Detect Drop Target
        // We look for elements with 'data-folder-id' under the cursor
        const dropTarget = document.elementFromPoint(info.point.x, info.point.y);
        const folderElement = dropTarget?.closest('[data-folder-id]');
        
        if (folderElement) {
            const targetFolderId = folderElement.getAttribute('data-folder-id');
            // Prevent self-drop or dropping folder into file (only items into VALID folders)
            if (targetFolderId && targetFolderId !== item.id) {
                // If item is not a folder itself, or if we allowed folder nesting (we do)
                // Just ensuring we don't drop a folder into itself (circular)
                // For this simple OS, simple 'id !== id' is enough
                moveFile(item.id, targetFolderId);
            }
        }
      }}
      data-folder-id={item.type === 'folder' ? item.id : undefined}
    >
      <div className="transform group-hover:scale-105 transition-transform duration-200 pointer-events-none">
        {renderIconContent()}
      </div>
      <span className="text-white text-xs text-center font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-1 rounded truncate w-full pointer-events-none">
        {item.name}
      </span>
    </motion.div>
  );
};

export default Icon;
