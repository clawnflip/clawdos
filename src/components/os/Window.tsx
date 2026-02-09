import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { useOS } from '../../contexts/OSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../i18n/translations';

interface WindowProps {
  id: string;
}

const Window: React.FC<WindowProps> = ({ id }) => {
  const { windows, closeWindow, minimizeWindow, maximizeWindow, focusWindow } = useOS();
  const { language } = useLanguage();
  const windowState = windows.find(w => w.id === id);

  if (!windowState || !windowState.isOpen) return null;

  return (
    <AnimatePresence>
      {!windowState.isMinimized && (
        <motion.div
          drag={!windowState.isMaximized}
          dragMomentum={false}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            width: windowState.isMaximized ? '100vw' : windowState.width,
            height: windowState.isMaximized ? 'calc(100vh - 48px)' : windowState.height,
            x: windowState.isMaximized ? 0 : windowState.x,
            y: windowState.isMaximized ? 0 : windowState.y,
            borderRadius: windowState.isMaximized ? 0 : 12,
          }}
          exit={{ scale: 0.9, opacity: 0 }}
          onDragStart={() => focusWindow(id)}
          onClick={() => focusWindow(id)}
          style={{
            position: 'absolute',
            zIndex: windowState.zIndex,
            overflow: 'hidden',
          }}
          className={`glass-panel flex flex-col ${windowState.isMaximized ? 'top-0 left-0' : ''}`}
        >
          {/* Title Bar */}
          <div 
            className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-glass-border)] bg-[rgba(255,255,255,0.05)] cursor-default select-none"
            onDoubleClick={() => maximizeWindow(id)}
          >
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium flex items-center gap-2">
                {windowState.icon}
                {windowState.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"
                title={getTranslation('window.minimize', language)}
              >
                <Minus size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }}
                className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"
                title={getTranslation('window.maximize', language)}
              >
                {windowState.isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                className="p-1 hover:bg-red-500 rounded-full text-white transition-colors"
                title={getTranslation('window.close', language)}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-[rgba(5,10,20,0.4)] relative">
             {/* Mouse event shield for iframes when dragging could be added here if needed */}
             {windowState.component}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Window;
