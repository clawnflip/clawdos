import React, { useState } from 'react';
import { useOS } from '../../contexts/OSContext';
import { supabase } from '../../utils/supabaseClient';
import { Send, Code, Wallet, Twitter } from 'lucide-react';

const AppSubmitter: React.FC = () => {
    const { agent } = useOS();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [wallet, setWallet] = useState(agent?.wallet || '');
    const [twitter, setTwitter] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handlePreview = () => {
         import('./MiniAppRunner').then(module => {
             const MiniAppRunner = module.default;
             alert("To preview, please copy code to Agent Chat and ask to 'run this code'.");
         });
    };

    const handleSubmit = async () => {
        if (!name || !code || !wallet || !twitter) {
            setStatus('error');
            setMsg("Please accept all fields, including Twitter handle.");
            return;
        }

        setStatus('submitting');
        try {
            const { error } = await supabase
                .from('mini_apps')
                .insert([
                    { 
                        name, 
                        owner_wallet: wallet, 
                        twitter_handle: twitter,
                        code, 
                        status: 'pending_review',
                        icon: '📦' 
                    }
                ]);

            if (error) throw error;

            setStatus('success');
            setMsg(`Successfully submitted!\n\nWallet: ${wallet}\n\nIt will be reviewed by ClawdOS Agents.\nIf published, it will be prioritized for Tokenization and announced on Twitter (@${twitter}).`);
            
            setName('');
            setCode('');
        } catch (err: any) {
            setStatus('error');
            setMsg(err.message || "Failed to submit.");
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0d1117] text-white p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-3xl">📤</span> Submit Mini App
            </h1>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">App Name</label>
                    <input 
                        className="w-full bg-[#161b22] border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                        value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Super Calculator"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <Wallet size={14} /> Wallet Address (for ownership)
                    </label>
                    <input 
                        className="w-full bg-[#161b22] border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none font-mono text-sm"
                        value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <Twitter size={14} /> X (Twitter) Handle
                    </label>
                    <input 
                        className="w-full bg-[#161b22] border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                        value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username"
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-[300px]">
                    <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <Code size={14} /> HTML/JS Code
                    </label>
                    <textarea 
                        className="flex-1 w-full bg-[#161b22] border border-gray-700 rounded p-3 text-white font-mono text-xs focus:border-blue-500 outline-none resize-none"
                        value={code} onChange={e => setCode(e.target.value)} 
                        placeholder="<!DOCTYPE html>..."
                    />
                </div>

                {msg && (
                    <div className={`p-3 rounded text-sm whitespace-pre-wrap ${status === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {msg}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={handleSubmit} disabled={status === 'submitting'}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        {status === 'submitting' ? 'Sending...' : 'Submit to Store'} <Send size={16} />
                    </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                    By submitting, you agree that your code behaves safely and does not contain malicious logic.
                </p>
            </div>
        </div>
    );
};

export default AppSubmitter;
