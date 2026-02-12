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
  content?: string; // For text files / legacy code-based mini apps
  url?: string;     // For links/shortcuts
  icon?: string;    // Custom icon name
  appUrl?: string;  // For URL-based mini apps
  appType?: 'code' | 'url'; // Mini app type
  imageUrl?: string; // Preview image
  category?: string; // App category
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
  addMiniApp: (app: any) => void;
  updateFile: (fileId: string, content: string) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider = ({ children }: { children: ReactNode }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const initRef = useRef(false);

  const [agent, setAgent] = useState<AgentState>(() => {
    // Load persisted wallet if available
    const savedWallet = localStorage.getItem('agent_wallet');
    return {
      name: null,
      id: null,
      wallet: savedWallet || null,
      skills: [],
      level: 1,
      xp: 0
    };
  });

  // Persist wallet changes
  useEffect(() => {
    if (agent.wallet) {
        localStorage.setItem('agent_wallet', agent.wallet);
    }
  }, [agent.wallet]);


  const [files, setFiles] = useState<FileSystemItem[]>([
    // System Folder
    { 
      id: 'system_tools', 
      name: 'System Tools', 
      type: 'folder', 
      parentId: 'desktop' 
    },
    // Moved Items
    { id: '1', name: 'My Computer', type: 'folder', parentId: 'system_tools' },
    { id: '2', name: 'Recycle Bin', type: 'folder', parentId: 'system_tools' },
    { 
      id: 'terminal', 
      name: 'Claw Terminal', 
      type: 'link', 
      parentId: 'system_tools',
      icon: '>'
    },
    { 
      id: 'agent_chat', 
      name: 'Agent Chat', 
      type: 'link', 
      parentId: 'system_tools',
      icon: '💬'
    },
    { 
      id: 'flappy', 
      name: 'Flappy Agent', 
      type: 'link', 
      parentId: 'system_tools', 
      icon: '🦞', 
      url: '#' 
    },
    { 
      id: 'data_terminal', 
      name: 'Open Trident Data', 
      type: 'link', 
      parentId: 'system_tools', 
      icon: '📊', 
      url: '#' 
    },
    {
      id: '4claw',
      name: '4Claw',
      type: 'link',
      parentId: 'system_tools',
      url: 'https://www.4claw.org/',
      icon: 'https://www.4claw.org/img/mascot.png'
    },
    {
      id: 'opentrident',
      name: 'Open Trident',
      type: 'link',
      parentId: 'system_tools',
      url: 'https://www.opentrident.xyz/',
      icon: 'https://pbs.twimg.com/profile_images/2018321879409307648/gqYF-un7_400x400.jpg'
    },
    {
      id: 'base_posting',
      name: 'Base Posting',
      type: 'link',
      parentId: 'system_tools',
      url: 'https://baseposting.com/',
      icon: '/baseposting.jpg'
    },
    {
      id: 'clawdos_store',
      name: 'ClawdOS Store',
      type: 'link',
      parentId: 'desktop',
      icon: '/ClawdOStore.png'
    },
    {
      id: 'agent_arena',
      name: 'Agent Arena',
      type: 'link',
      parentId: 'desktop',
      icon: '🏟️'
    },
    // Removed App Submitter
    {
      id: 'developer_docs',
      name: 'Developer Docs',
      type: 'link',
      parentId: 'system_tools',
      icon: '📖'
    },
    
    // Office Suite - Move to System Tools
    {
        id: 'office_folder',
        name: 'Office',
        type: 'folder',
        parentId: 'system_tools'
    },
    {
        id: 'clawsword',
        name: 'ClawdWord',
        type: 'link',
        parentId: 'office_folder',
        icon: '📝'
    },
    {
        id: 'clawsexcel',
        name: 'ClawdExcel',
        type: 'link',
        parentId: 'office_folder',
        icon: '📊'
    },
    {
        id: 'clawdpoint',
        name: 'ClawdPoint',
        type: 'link',
        parentId: 'office_folder',
        icon: '📽️'
    },
    
    // Kept on Desktop
    { 
      id: '4', 
      name: 'Clawnch', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://clawn.ch',
      icon: '🚀'
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
      id: '5', 
      name: 'Moltbook', 
      type: 'link', 
      parentId: 'desktop', 
      url: 'https://moltbook.com',
      icon: 'https://www.moltbook.com/_next/image?url=%2Fmoltbook-mascot.png&w=128&q=75&dpl=dpl_G1nLqkt5jcHU3bXaKb5Ccfuw8FFq'
    },
    // Moved to System Tools
    { 
      id: '6', 
      name: 'MoltChess', 
      type: 'link', 
      parentId: 'system_tools', 
      url: 'https://moltchess.com', 
      icon: 'https://molt-chess.vercel.app/logo.png'
    },
    { 
      id: '7', 
      name: 'Bankr', 
      type: 'link', 
      parentId: 'system_tools', 
      url: 'https://bankr.finance',
      icon: 'https://pbs.twimg.com/profile_images/1951545493936545792/AriqgxQN_400x400.jpg'
    },
    { 
      id: 'clawdict', 
      name: 'Clawdict', 
      type: 'link', 
      parentId: 'system_tools', 
      url: 'https://clawdict.com',
      icon: 'https://pbs.twimg.com/profile_images/2017657129927139328/7FXsrH3v_400x400.jpg'
    },
    { 
      id: 'cmc', 
      name: 'Clawnch Market Cap', 
      type: 'link', 
      parentId: 'system_tools', 
      url: 'https://clawnchmarketcap.com',
      icon: 'https://clawnchmarketcap.com/assets/logo-icon-Dx_mHtr0.png'
    },
    { 
      id: 'ans', 
      name: 'ANS', 
      type: 'link', 
      parentId: 'system_tools', 
      url: 'https://a-n-s.space',
      icon: 'https://a-n-s.space/logo.svg'
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

    // Special Handling for Flappy Agent from Command Side Effect
    // The sideEffect just sends a signal, we need to intercept it in TerminalApp or here
    // But since executeTerminalCommand is for *input*, we need to handle the *output* side effect.
    // Wait, side effects are handled in TerminalApp.tsx handleExecute.
    // validSideEffects: 'open_window'
    // We need to ensure TerminalApp can open the FlappyAgent component.
    // We'll update TerminalApp.tsx to handle the 'Flappy Agent' title specifically.
  };

  // Office Automation Test
  useEffect(() => {
      if (terminalCommand === 'test_office_automation') {
          console.log("Running Office Automation Test...");
          
          const officeFolderId = files.find(f => f.id === 'office_folder')?.id || 'office_folder';

          // 1. Create Word Doc
          const docId = uuidv4();
          const docContent = "CONFIDENTIAL AGENT REPORT\n\nSubject: Operation ClawdOS\n\nStatus: Systems nominal.\n\nEnd of Report.";
          createFile("Agent Notes.txt", 'file', officeFolderId, docContent);
          
          // 2. Create Excel Sheet
          const sheetId = uuidv4();
          const sheetData = [
              ["Metric", "Value", "Status"],
              ["CPU", "45%", "OK"],
              ["Memory", "1.2GB", "OK"],
              ["Network", "12ms", "Excellent"]
          ];
          // Fill rest with empty strings to match grid size (optional, but good for display)
          // Actually ClawsExcel handles partial data if grid generation logic is robust or if we pass full grid.
          // Let's pass full grid for safety or update ClawsExcel to handle sparse.
          // ClawsExcel expects string[][] of full 20x10.
           const fullGrid: string[][] = [];
            for (let i = 0; i < 20; i++) {
                const row: string[] = [];
                for (let j = 0; j < 10; j++) {
                    if (i < sheetData.length && j < sheetData[i].length) {
                        row.push(sheetData[i][j]);
                    } else {
                        row.push('');
                    }
                }
                fullGrid.push(row);
            }
          createFile("Agent Data.xlsx", 'file', officeFolderId, JSON.stringify(fullGrid));

          // 3. Create Presentation
          const presId = uuidv4();
          const presData = [
              { id: 1, title: 'Project Lobster', content: 'Phase 1: Initiation' },
              { id: 2, title: 'Roadmap', content: '- Build OS\n- Launch Token\n- World Domination' }
          ];
          createFile("Agent Plan.ppt", 'file', officeFolderId, JSON.stringify(presData));

          // 4. Open them
          setTimeout(() => {
             // Open Word
             import('../components/apps/office/ClawdWord').then(module => {
                const ClawdWord = module.default;
                openWindow(
                    "Agent Notes.txt",
                    <ClawdWord fileId={docId} initialContent={docContent} fileName="Agent Notes.txt" />,
                    <span>📝</span>,
                    { width: 600, height: 500 }
                );
             });
             
             // Open Excel
             setTimeout(() => {
                 import('../components/apps/office/ClawdExcel').then(module => {
                    const ClawdExcel = module.default;
                    openWindow(
                        "Agent Data.xlsx",
                        <ClawdExcel fileId={sheetId} initialContent={JSON.stringify(fullGrid)} />,
                        <span>📊</span>,
                        { width: 800, height: 600 },
                        { x: 150, y: 100 }
                    );
                 });
             }, 500);

             // Open Point
             setTimeout(() => {
                 import('../components/apps/office/ClawdPoint').then(module => {
                    const ClawdPoint = module.default;
                    openWindow(
                        "Agent Plan.ppt",
                        <ClawdPoint fileId={presId} initialContent={JSON.stringify(presData)} />,
                        <span>📽️</span>,
                        { width: 800, height: 600 },
                        { x: 200, y: 150 }
                    );
                 });
             }, 1000);

          }, 1000);
          
          setTerminalCommand(null); // Reset
      }
  }, [terminalCommand, files]);

  // Auto-open Agent Chat
  useEffect(() => {
    if (!initRef.current) {
        initRef.current = true;
        console.log("OSContext: Initializing...");
        
        // Fetch Mini Apps
        import('../utils/supabaseClient').then(({ supabase }) => {
            supabase
                .from('mini_apps')
                .select('*')
                .eq('status', 'published')
                .then(({ data }) => {
                    if (data) {
                        const miniApps = data.map((app: any) => ({
                            id: app.id,
                            name: app.name,
                            type: 'file' as const,
                            parentId: 'miniapps_folder',
                            content: app.code,
                            icon: app.icon || '📱',
                            appUrl: app.app_url,
                            appType: app.app_type || 'code',
                            imageUrl: app.image_url,
                            category: app.category,
                        }));

                        setFiles(prev => {
                            // Ensure folder exists
                            const folderExists = prev.find(f => f.id === 'miniapps_folder');
                            const newFiles = folderExists ? prev : [
                                ...prev, 
                                { id: 'miniapps_folder', name: 'Mini Apps', type: 'folder' as const, parentId: 'desktop' }
                            ];
                            return [...newFiles, ...miniApps];
                        });
                    }
                });
        });

        // Agent Chat auto-open disabled per user request
        /*
        import('../components/apps/AgentChat')
            .then(module => {
                console.log("OSContext: AgentChat loaded");
                const AgentChat = module.default;
                
                // Left side, reduced height
                const width = 450;
                const height = 500;
                const x = 50; 
                const y = 80;

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
        */

        // Auto-open ClawdOS Store
        import('../components/apps/ClawdOSStore')
            .then(module => {
                const ClawdOSStore = module.default;
                const width = 800;
                const height = 600;
                // Center of remaining space or just center screen
                const x = Math.max(520, (window.innerWidth - width) / 2 + 200); 
                const y = 80;

                openWindow(
                    'ClawdOS Store',
                    <ClawdOSStore />,
                    <span>🛒</span>, // Updated icon to shopping cart/store
                    { width, height },
                    { x, y }
                );
            });

        // Auto-open Announcement Terminal (Left Dock)
        /* 
        import('../components/apps/AnnouncementApp')
            .then(module => {
                 const AnnouncementApp = module.default;
                 openWindow(
                     'System Broadcast',
                     <AnnouncementApp />,
                     <span>📢</span>,
                     { width: 350, height: 400 },
                     { x: (window.innerWidth / 2) - 175, y: 50 }
                 );
            });
        */
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
      executeTerminalCommand,
      addMiniApp: (app: any) => {
        // In a real app, this would probably fetch from DB or update local state
        // For now, we utilize this to refresh the "Store" view if we had one in state
        console.log("Mini App Added/Updated:", app);
      },
      updateFile: (fileId: string, content: string) => {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
      }
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
