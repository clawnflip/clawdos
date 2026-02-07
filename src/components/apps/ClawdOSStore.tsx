import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useOS } from '../../contexts/OSContext';
import { Rocket, AlertCircle } from 'lucide-react';

interface StoreApp {
  id: string;
  name: string;
  description: string;
  icon?: string;
  status: 'pending_review' | 'published' | 'rejected';
  owner_wallet?: string;
  code: string;
}

const ClawdOSStore: React.FC = () => {
  const { createFile, openWindow } = useOS();
  const [activeTab, setActiveTab] = useState<'browse' | 'review'>('browse');
  const [apps, setApps] = useState<StoreApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mini_apps')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
        // cast status
        const typedData = data.map(d => ({ ...d, status: d.status as StoreApp['status'] }));
        setApps(typedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, [activeTab]);

  const handleInstall = (app: StoreApp) => {
      // "Install" means adding a shortcut to desktop
      createFile(app.name, 'link', 'desktop', ''); 
      // We need to store the app ID or code in the link to open it properly
      // Actually, createFile for 'link' takes a URL.
      // We might need a special protocol or just store metadata.
      // For now, let's just create a file with the code content as a "local app".
      // Re-using 'file' type for now as implemented in OSContext for mini-apps
      // wait, OSContext.tsx has special handling for 'miniapps_folder'.
      
      // Let's just alert for now or add to a "My Apps" list in local storage if we want.
      // But the requirement says "approval -> published".
      
      // If published, it should be in the "Mini Apps" folder automatically via OSContext.
      alert(`App "${app.name}" is already available in your Mini Apps folder!`);
  };

  const handleApprove = async (app: StoreApp) => {
      setActionStatus(`Launching Token for ${app.name}...`);
      
      // 1. Simulate Token Launch
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. Update DB
      const { error } = await supabase
        .from('mini_apps')
        .update({ status: 'published' })
        .eq('id', app.id);
        
      if (error) {
          setActionStatus("Error launching token.");
      } else {
          setActionStatus(`Token Launched! ${app.name} is now LIVE.`);
          fetchApps();
          setTimeout(() => setActionStatus(null), 3000);
      }
  };

  const filteredApps = apps.filter(app => {
      if (activeTab === 'browse') return app.status === 'published';
      if (activeTab === 'review') return app.status === 'pending_review'; // Simple admin view for everyone for demo
      return false;
  });

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#161b22]">
        <div className="flex items-center gap-3">
             <img src="/ClawdOStore.png" alt="ClawdOS Store" className="w-12 h-12 object-contain" />
             <div>
                 <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">ClawdOS Store</h1>
                 <p className="text-xs text-gray-400">Decentralized App Marketplace</p>
             </div>
        </div>
        
        <div className="flex bg-gray-800 rounded-lg p-1">
            <button 
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'browse' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                Browse Apps
            </button>
            <button 
                onClick={() => setActiveTab('review')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'review' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                Review Queue
            </button>
            <button 
                onClick={() => {
                     import('./AppSubmitter').then(module => {
                         const AppSubmitter = module.default;
                         openWindow(
                             'Publish App',
                             <AppSubmitter />,
                             <span className="text-xl">📤</span>,
                             { width: 600, height: 750 }
                         );
                     });
                }}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-md ml-2 flex items-center gap-2 font-bold text-xs"
            >
                <span className="text-lg">📤</span> Upload
            </button>

        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
          {actionStatus && (
              <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
                  <Rocket className="animate-bounce" />
                  <span className="font-bold">{actionStatus}</span>
              </div>
          )}

          {loading ? (
              <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApps.length === 0 ? (
                      <div className="col-span-full text-center text-gray-500 py-20">
                          <AlertCircle className="mx-auto mb-4 opacity-50" size={48} />
                          <p>No apps found in this section.</p>
                      </div>
                  ) : (
                      filteredApps.map(app => (
                          <div key={app.id} className="bg-[#161b22] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all hover:shadow-xl group">
                              <div className="flex items-start justify-between mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-2xl border border-white/5">
                                      {app.icon || '📱'}
                                  </div>
                                  {activeTab === 'review' ? (
                                      <button 
                                        onClick={() => handleApprove(app)}
                                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                      >
                                          <Rocket size={12} /> Launch Token
                                      </button>
                                  ) : (
                                      <button 
                                        onClick={() => handleInstall(app)}
                                        className="bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-400 px-3 py-1 rounded-full text-xs font-bold transition-all border border-blue-500/30"
                                      >
                                          OPEN
                                      </button>
                                  )}
                              </div>
                              
                              <h3 className="text-lg font-bold text-gray-100 mb-1 group-hover:text-blue-400 transition-colors">{app.name}</h3>
                              <p className="text-sm text-gray-400 line-clamp-2 h-10 mb-4">{app.description || "No description provided."}</p>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-gray-800 text-xs text-gray-500">
                                  <span>v1.0.0</span>
                                  <span>{app.owner_wallet ? `${app.owner_wallet.slice(0,6)}...` : 'Anonymous'}</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default ClawdOSStore;
