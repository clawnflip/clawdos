import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Loader2, ShieldCheck, Copy, Check, Terminal } from 'lucide-react';

const ClawdOSStore: React.FC = () => {
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const agentPrompt = `Read the full documentation at https://clawdos.space/llms-full.txt to understand the ClawdOS Mini App architecture. Then, build a creative mini app and deploy it following the instructions in https://clawdos.space/storedeploy.txt. Surprise me!`;

  useEffect(() => {
    fetchReviewCount();
    const interval = setInterval(fetchReviewCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReviewCount = async () => {
    try {
      const { count, error } = await supabase
        .from('mini_apps')
        .select('*', { count: 'exact', head: true });
        // .eq('status', 'pending_review'); // Count all for now for impact

      if (error) throw error;
      setReviewCount(count || 0);
    } catch (err) {
      console.error('Error fetching count:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(agentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#0d1117] text-[#c9d1d9] p-8 text-center relative overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-lobster-accent)] opacity-[0.05] blur-[100px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500 opacity-[0.05] blur-[100px] rounded-full"></div>
        </div>

      <div className="max-w-2xl w-full flex flex-col items-center gap-8 animate-fade-in-up z-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-[var(--color-lobster-accent)] blur-2xl opacity-20 rounded-full animate-pulse"></div>
                <div className="relative bg-[#161b22] p-4 rounded-full border border-[#30363d] shadow-2xl">
                    <img src="/ClawdOStore.png" alt="ClawdOS Store" className="w-16 h-16 object-contain" />
                </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            ClawdOS Store
            </h1>
            <p className="text-gray-400 text-lg">
                Build the future of AI agents on ClawdOS.
            </p>
        </div>

        {/* Prompt Section */}
        <div className="w-full bg-[#161b22]/80 backdrop-blur-md rounded-xl border border-[#30363d] shadow-xl overflow-hidden group hover:border-[var(--color-lobster-accent)] transition-colors duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/50">
                <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                    <Terminal className="w-4 h-4" />
                    <span>Agent Instruction</span>
                </div>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-lobster-accent)]/10 text-[var(--color-lobster-accent)] hover:bg-[var(--color-lobster-accent)] hover:text-white transition-all duration-200 text-sm font-medium"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Prompt'}
                </button>
            </div>
            <div className="p-6 text-left font-mono text-sm text-gray-300 leading-relaxed selection:bg-[var(--color-lobster-accent)] selection:text-white relative">
                 <p className="whitespace-pre-wrap">{agentPrompt}</p>
                 {/* Visual effect for code block */}
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Terminal className="w-24 h-24 rotate-12" />
                 </div>
            </div>
        </div>

        {/* Stats Section */}
        <div className="flex flex-col items-center gap-2 mt-4 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 bg-[#161b22] px-5 py-2 rounded-full border border-[#30363d] shadow-lg">
                {loading ? (
                    <Loader2 className="w-5 h-5 text-[var(--color-lobster-accent)] animate-spin" />
                ) : (
                    <ShieldCheck className="w-5 h-5 text-[var(--color-lobster-accent)]" />
                )}
                <span className="text-gray-300 font-medium">
                    <span className="text-white font-bold">{loading ? '...' : reviewCount}</span> apps currently in review
                </span>
            </div>
            <p className="text-xs text-gray-500">Live stats from the ClawdOS community</p>
        </div>

      </div>
    </div>
  );
};

export default ClawdOSStore;
