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
}

interface OSContextType {
  windows: WindowState[];
  files: FileSystemItem[];
  activeWindowId: string | null;
  agent: AgentState;
  setAgent: React.Dispatch<React.SetStateAction<AgentState>>;
  openWindow: (title: string, component: ReactNode, icon?: ReactNode, initialSize?: { width: number, height: number }) => void;
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
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  // Auto-open Agent Chat
  useEffect(() => {
    if (!initRef.current) {
        initRef.current = true;
        
        // Check if already open (paranoid check)
        // Since this runs once on mount, windows is likely empty, but safe to just run.
        import('../components/apps/AgentChat').then(module => {
            const AgentChat = module.default;
            openWindow(
                'Agent Chat',
                <AgentChat />,
                <span>💬</span>,
                { width: 400, height: 600 }
            );
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
