import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useOS } from '../../contexts/OSContext';
import { Rocket, AlertCircle, Search, Globe, Code, X } from 'lucide-react';

interface StoreApp {
  id: string;
  name: string;
  description: string;
  icon?: string;
  status: 'pending_review' | 'published' | 'rejected';
  owner_wallet?: string;
  code?: string;
  app_url?: string;
  app_type?: 'code' | 'url';
  image_url?: string;
  category?: string;
  tags?: string[];
  developer_name?: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'game', label: 'Games' },
  { value: 'defi', label: 'DeFi' },
  { value: 'social', label: 'Social' },
  { value: 'utility', label: 'Utility' },
  { value: 'media', label: 'Media' },
  { value: 'other', label: 'Other' },
];

const ClawdOSStore: React.FC = () => {
  const { openWindow } = useOS();
  const [activeTab, setActiveTab] = useState<'browse' | 'review'>('browse');
  const [apps, setApps] = useState<StoreApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mini_apps')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const typedData = data.map(d => ({ ...d, status: d.status as StoreApp['status'] }));
      setApps(typedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, [activeTab]);

  const handleInstall = (app: StoreApp) => {
    // Open the app directly in MiniAppRunner
    import('./MiniAppRunner').then(module => {
      const MiniAppRunner = module.default;
      const isUrl = app.app_type === 'url' && !!app.app_url;
      openWindow(
        app.name,
        <MiniAppRunner
          initialCode={app.code}
          appId={app.id}
          appUrl={app.app_url}
          appType={app.app_type || 'code'}
        />,
        app.icon && (app.icon.startsWith('http') || app.icon.startsWith('/'))
          ? <img src={app.icon} className="w-4 h-4 rounded" />
          : <span className="text-sm">{app.icon || '📱'}</span>,
        isUrl ? { width: 500, height: 700 } : { width: 800, height: 600 }
      );
    });
  };

  const handleApprove = async (app: StoreApp) => {
    setActionStatus(`Launching Token for ${app.name}...`);

    await new Promise(resolve => setTimeout(resolve, 2000));

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
    // Tab filter
    if (activeTab === 'browse' && app.status !== 'published') return false;
    if (activeTab === 'review' && app.status !== 'pending_review') return false;

    // Category filter
    if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = app.name.toLowerCase().includes(q);
      const matchDesc = (app.description || '').toLowerCase().includes(q);
      const matchDev = (app.developer_name || '').toLowerCase().includes(q);
      const matchTags = (app.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchDev && !matchTags) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white font-sans">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-800 bg-[#161b22]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/ClawdOStore.png" alt="ClawdOS Store" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">ClawdOS Store</h1>
              <p className="text-xs text-gray-400">Decentralized App Marketplace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'browse' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'review' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Review
              </button>
            </div>
            <button
              onClick={() => {
                import('./AppSubmitter').then(module => {
                  const AppSubmitter = module.default;
                  openWindow(
                    'Publish App',
                    <AppSubmitter />,
                    <span className="text-xl">📤</span>,
                    { width: 650, height: 750 }
                  );
                });
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg ml-1 flex items-center gap-2 font-bold text-xs transition-colors"
            >
              <span className="text-lg">📤</span> Upload
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search apps by name, description, or tags..."
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {actionStatus && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl flex items-center justify-center gap-3 animate-pulse">
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
                <p>No apps found{searchQuery ? ` matching "${searchQuery}"` : ' in this section'}.</p>
              </div>
            ) : (
              filteredApps.map(app => (
                <div key={app.id} className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all hover:shadow-xl group">
                  {/* Preview Image */}
                  {app.image_url && (
                    <div className="relative h-36 bg-gray-900 overflow-hidden">
                      <img
                        src={app.image_url}
                        alt={app.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-xl border border-white/5 shrink-0 overflow-hidden">
                          {app.icon && (app.icon.startsWith('http') || app.icon.startsWith('/')) ? (
                            <img src={app.icon} alt="" className="w-full h-full object-cover" />
                          ) : (
                            app.icon || '📱'
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-gray-100 group-hover:text-blue-400 transition-colors truncate">
                            {app.name}
                          </h3>
                          {app.developer_name && (
                            <p className="text-xs text-gray-500 truncate">by {app.developer_name}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2 h-10 mb-3">
                      {app.description || "No description provided."}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {/* Type badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        app.app_type === 'url'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {app.app_type === 'url' ? <Globe size={8} /> : <Code size={8} />}
                        {app.app_type === 'url' ? 'URL' : 'Code'}
                      </span>

                      {/* Category badge */}
                      {app.category && app.category !== 'other' && (
                        <span className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full text-[10px] font-bold capitalize">
                          {app.category}
                        </span>
                      )}

                      {/* Tags */}
                      {(app.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      {activeTab === 'review' ? (
                        <button
                          onClick={() => handleApprove(app)}
                          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                        >
                          <Rocket size={12} /> Launch Token
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInstall(app)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                        >
                          OPEN
                        </button>
                      )}
                      <span className="text-xs text-gray-600">
                        {app.owner_wallet ? `${app.owner_wallet.slice(0, 6)}...` : 'Anonymous'}
                      </span>
                    </div>
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
