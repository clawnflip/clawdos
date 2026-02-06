import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface WindowState {
  id: string;
  title: string;
  component: ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  icon?: ReactNode;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'link';
  parentId: string | null;
  content?: string; // For text files
  url?: string;     // For links/shortcuts
  icon?: string;    // Custom icon name
}

export interface AgentState {
  name: string | null;
  id: string | null;
  wallet: string | null;
  skills: string[];
  level: number;
  xp: number;
  apiKey?: string;
}

// ...



interface OSContextType {
  windows: WindowState[];
  files: FileSystemItem[];
  activeWindowId: string | null;
  agent: AgentState;
  setAgent: React.Dispatch<React.SetStateAction<AgentState>>;
  openWindow: (title: string, component: ReactNode, icon?: ReactNode, initialSize?: { width: number, height: number }, initialPos?: { x: number, y: number }) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  createFile: (name: string, type: 'file' | 'folder' | 'link', parentId?: string, content?: string) => void;
  moveFile: (fileId: string, newParentId: string) => void;
  terminalCommand: string | null;
  setTerminalCommand: (cmd: string | null) => void;
  executeTerminalCommand: (cmd: string) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider = ({ children }: { children: ReactNode }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const initRef = useRef(false);

  const [agent, setAgent] = useState<AgentState>({
    name: null,
    id: null,
    wallet: null,
    skills: [],
    level: 1,
    xp: 0
  });

  const [files, setFiles] = useState<FileSystemItem[]>([
    { id: '1', name: 'My Computer', type: 'folder', parentId: 'desktop' },
    { id: '2', name: 'Recycle Bin', type: 'folder', parentId: 'desktop' },
    { 
      id: 'terminal', 
      name: 'Claw Terminal', 
      type: 'link', 
      parentId: 'desktop',
      icon: '>'
    },
    { 
      id: 'agent_chat', 
      name: 'Agent Chat', 
      type: 'link', 
      parentId: 'desktop',
      icon: '💬'
    },
    { 
      id: '3', 
      name: 'Moltx.io', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://moltx.io',
      icon: 'https://moltx.io/logo.webp'
    },
    { 
      id: '4', 
      name: 'Moltbook', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://www.moltbook.com/',
      icon: 'https://www.moltbook.com/_next/image?url=%2Fmoltbook-mascot.png&w=128&q=75&dpl=dpl_G1nLqkt5jcHU3bXaKb5Ccfuw8FFq'
    },
    { 
      id: '5', 
      name: 'Clawnch', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://clawn.ch/',
      icon: '🚀'
    },
    { 
      id: '6', 
      name: '4Claw', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://www.4claw.org/',
      icon: 'https://www.4claw.org/img/mascot.png'
    },
    { 
      id: '7', 
      name: 'Molt Chess', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://molt-chess.vercel.app/',
      icon: 'https://molt-chess.vercel.app/logo.png'
    },
    { 
      id: '8', 
      name: 'Open Trident', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://www.opentrident.xyz/',
      icon: 'https://pbs.twimg.com/profile_images/2018321879409307648/gqYF-un7_400x400.jpg'
    },
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  const getNextZIndex = () => {
    const maxZ = Math.max(0, ...windows.map(w => w.zIndex));
    return maxZ + 1;
  };

  const openWindow = (title: string, component: ReactNode, icon?: ReactNode, initialSize?: { width: number, height: number }, initialPos?: { x: number, y: number }) => {
    const id = uuidv4();
    const newWindow: WindowState = {
      id,
      title,
      component,
      icon,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: getNextZIndex(),
      width: initialSize?.width || 800,
      height: initialSize?.height || 600,
      x: initialPos?.x ?? (100 + (windows.length * 30)),
      y: initialPos?.y ?? (50 + (windows.length * 30)),
    };
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const maximizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
    focusWindow(id);
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: getNextZIndex() } : w));
  };

  const createFile = (name: string, type: 'file' | 'folder' | 'link', parentId: string = 'desktop', content?: string) => {
    const newFile: FileSystemItem = {
      id: uuidv4(),
      name,
      type,
      parentId,
      content,
    };
    setFiles(prev => [...prev, newFile]);
  };

  const moveFile = (fileId: string, newParentId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, parentId: newParentId } : f));
  };
  
  const [terminalCommand, setTerminalCommand] = useState<string | null>(null);

  const executeTerminalCommand = (cmd: string) => {
    setTerminalCommand(cmd);
    
    // Process command immediately to handle side effects that need OS access (like opening windows)
    // Note: TerminalApp also calls processCommand for display, but side effects should be handled here or there.
    // Ideally, we let TerminalApp handle the logic, but since we want the OS to react even if Terminal is backgrounded...
    // Actually, TerminalLogic is pure. Let's run it here just to check for side effects.
    
    // We delegate execution logic to TerminalApp to avoid double-processing and state desync.
    // The command is passed via 'terminalCommand' state, which TerminalApp listens to.

    const terminalOpen = windows.find(w => w.title === 'Claw Terminal');
    if (!terminalOpen) {
       import('../components/apps/TerminalApp').then(module => {
            const TerminalApp = module.default;
             openWindow(
                'Claw Terminal',
                <TerminalApp />,
                <span className="font-mono text-xs font-bold text-green-500">&gt;_</span>,
                { width: 700, height: 500 }
            );
       });
    }
  };

  // Auto-open Agent Chat
  useEffect(() => {
    if (!initRef.current) {
        initRef.current = true;
        console.log("OSContext: Initializing...");
        
        import('../components/apps/AgentChat')
            .then(module => {
                console.log("OSContext: AgentChat loaded");
                const AgentChat = module.default;
                
                // Calculate Right Dock Position
                const width = 400;
                const height = window.innerHeight - 100;
                const x = window.innerWidth - width - 20; // 20px padding from right
                const y = 50;

                openWindow(
                    'Agent Chat',
                    <AgentChat />,
                    <span>💬</span>,
                    { width, height },
                    { x, y }
                );
            })
            .catch(err => {
                console.error("OSContext: Failed to load AgentChat", err);
            });
    }
  }, []);

  return (
    <OSContext.Provider value={{
      windows,
      files,
      activeWindowId,
      agent,
      setAgent,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      focusWindow,
      createFile,
      moveFile,
      terminalCommand,
      setTerminalCommand,
      executeTerminalCommand
    }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
