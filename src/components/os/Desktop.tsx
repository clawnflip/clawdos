import React, { useState, useRef } from 'react';
import { useOS } from '../../contexts/OSContext';
import Icon from './Icon';
import Logo from './Logo';
import Window from './Window';
import Taskbar from './Taskbar';
import { AnimatePresence, motion } from 'framer-motion';

const Desktop: React.FC = () => {
  const { files, windows, createFile } = useOS();
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const desktopRef = useRef<HTMLDivElement>(null);

  // Filter for desktop items
  const desktopItems = files.filter(f => f.parentId === 'desktop');

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection if clicking directly on desktop (not on icons/windows)
    // Note: Icons stopPropagation if needed, or we check target
    if ((e.target as HTMLElement).id === 'desktop-area') {
        setIsSelecting(true);
        setStartPos({ x: e.clientX, y: e.clientY });
        setSelectionBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
        setContextMenu(null); // Close context menu
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && startPos) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const width = Math.abs(currentX - startPos.x);
      const height = Math.abs(currentY - startPos.y);
      const x = Math.min(currentX, startPos.x);
      const y = Math.min(currentY, startPos.y);

      setSelectionBox({ x, y, width, height });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setStartPos(null);
    setSelectionBox(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreateFolder = () => {
      createFile('New Folder', 'folder');
      setContextMenu(null);
  };

  return (
    <div 
        id="desktop-area"
        ref={desktopRef}
        className="relative w-full h-full overflow-hidden bg-gray-900" // Added bg-gray-900 to ensure visibility
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
    >
        {/* Debug Indicator - Will remove later */}
        {/* <div className="absolute top-0 right-0 p-2 text-xs text-green-500 z-50">Desktop Mounted</div> */}
        {/* Background Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-100">
           <Logo className="w-1/3 h-1/3" showText={true} />
        </div>
        
      {/* Desktop Icons Grid - Absolute positioning to allow free movement (simulated via drag) */}
      <div className="absolute top-0 left-0 w-full h-[calc(100vh-var(--taskbar-height))] p-4 flex flex-col flex-wrap content-start gap-2 z-10 pointer-events-none">
         <div className="flex flex-col flex-wrap h-full content-start gap-4 pointer-events-auto">
            {desktopItems.map(item => (
                <Icon key={item.id} item={item} />
            ))}
         </div>
      </div>

      {/* Selection Box */}
      {selectionBox && (
          <div 
            className="absolute border border-[var(--color-lobster-accent)] bg-[rgba(255,107,53,0.2)] z-20 pointer-events-none"
            style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height
            }}
          />
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute w-48 bg-[rgba(20,30,48,0.9)] backdrop-blur-md border border-[var(--color-glass-border)] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden py-1"
                style={{ left: contextMenu.x, top: contextMenu.y }}
            >
                <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[var(--color-lobster-accent)] hover:text-black transition-colors" onClick={handleCreateFolder}>
                    New Folder
                </button>
                <div className="h-[1px] bg-white/10 my-1" />
                <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[var(--color-lobster-accent)] hover:text-black transition-colors">
                    Personalize
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[var(--color-lobster-accent)] hover:text-black transition-colors">
                    Display Settings
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Windows Layer */}
      {windows.map(window => (
        <Window key={window.id} id={window.id} />
      ))}

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
};

export default Desktop;
