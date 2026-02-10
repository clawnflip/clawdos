import React, { useState } from 'react';
import { useOS } from '../../contexts/OSContext';
import { supabase } from '../../utils/supabaseClient';
import { Send, Code, Wallet, Twitter, Globe, Search, CheckCircle, AlertTriangle, Loader, User, Tag } from 'lucide-react';
import { fetchManifest } from '../../utils/manifestService';
import type { ClawdManifest, MiniAppCategory } from '../../types/miniapp';

const CATEGORIES: { value: MiniAppCategory; label: string }[] = [
    { value: 'game', label: 'Game' },
    { value: 'defi', label: 'DeFi' },
    { value: 'social', label: 'Social' },
    { value: 'utility', label: 'Utility' },
    { value: 'media', label: 'Media' },
    { value: 'other', label: 'Other' },
];

const AppSubmitter: React.FC = () => {
    const { agent } = useOS();
    const [activeTab, setActiveTab] = useState<'url' | 'code'>('url');

    // URL mode state
    const [appUrl, setAppUrl] = useState('');
    const [manifest, setManifest] = useState<ClawdManifest | null>(null);
    const [fetchingManifest, setFetchingManifest] = useState(false);
    const [manifestError, setManifestError] = useState('');
    const [showManualForm, setShowManualForm] = useState(false);

    // Shared form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [iconUrl, setIconUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState<MiniAppCategory>('other');
    const [wallet, setWallet] = useState(agent?.wallet || '');
    const [twitter, setTwitter] = useState('');
    const [developerName, setDeveloperName] = useState('');
    const [tags, setTags] = useState('');

    // Code mode state
    const [code, setCode] = useState('');

    // Submission state
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleFetchManifest = async () => {
        if (!appUrl.trim()) return;

        // Ensure URL has protocol
        let url = appUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
            setAppUrl(url);
        }

        setFetchingManifest(true);
        setManifestError('');
        setManifest(null);
        setShowManualForm(false);

        const result = await fetchManifest(url);

        if (result) {
            setManifest(result);
            // Auto-fill form from manifest
            setName(result.miniapp.name);
            setDescription(result.miniapp.description);
            setIconUrl(result.miniapp.iconUrl);
            setImageUrl(result.miniapp.imageUrl || '');
            setCategory(result.miniapp.primaryCategory || 'other');
            setDeveloperName(result.miniapp.developer.name);
            setWallet(result.miniapp.developer.wallet || wallet);
            setTwitter(result.miniapp.developer.twitter || '');
            setTags((result.miniapp.tags || []).join(', '));
        } else {
            setManifestError('No manifest found. You can fill in the details manually.');
            setShowManualForm(true);
        }

        setFetchingManifest(false);
    };

    const handleSubmit = async () => {
        const isUrlMode = activeTab === 'url';

        if (isUrlMode && !appUrl) {
            setStatus('error');
            setMsg('Please enter an app URL.');
            return;
        }
        if (!isUrlMode && !code) {
            setStatus('error');
            setMsg('Please paste your HTML/JS code.');
            return;
        }
        if (!name || !wallet) {
            setStatus('error');
            setMsg('App name and wallet address are required.');
            return;
        }

        setStatus('submitting');
        try {
            const insertData: Record<string, unknown> = {
                name,
                description: description || null,
                icon: iconUrl || '📦',
                owner_wallet: wallet,
                twitter_handle: twitter || null,
                status: 'pending_review',
                app_type: isUrlMode ? 'url' : 'code',
                category: category || 'other',
                tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                developer_name: developerName || null,
                image_url: imageUrl || null,
            };

            if (isUrlMode) {
                insertData.app_url = appUrl;
                insertData.code = null;
            } else {
                insertData.code = code;
                insertData.app_url = null;
            }

            const { error } = await supabase
                .from('mini_apps')
                .insert([insertData]);

            if (error) throw error;

            setStatus('success');
            setMsg(`Successfully submitted "${name}"!\n\nIt will be reviewed by ClawdOS Agents.\nIf published, it will appear in the Store and be prioritized for Tokenization.`);

            // Reset form
            setName('');
            setDescription('');
            setCode('');
            setAppUrl('');
            setManifest(null);
        } catch (err: unknown) {
            setStatus('error');
            setMsg(err instanceof Error ? err.message : 'Failed to submit.');
        }
    };

    const inputClass = "w-full bg-[#161b22] border border-gray-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none text-sm";
    const labelClass = "block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2";

    return (
        <div className="h-full flex flex-col bg-[#0d1117] text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-800">
                <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-3xl">📤</span> Submit Mini App
                </h1>

                {/* Tabs */}
                <div className="flex bg-gray-800/50 rounded-lg p-1">
                    <button
                        onClick={() => { setActiveTab('url'); setStatus('idle'); setMsg(''); }}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'url'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Globe size={14} /> Submit URL
                    </button>
                    <button
                        onClick={() => { setActiveTab('code'); setStatus('idle'); setMsg(''); }}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'code'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Code size={14} /> Submit Code
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* URL Tab */}
                {activeTab === 'url' && (
                    <>
                        {/* URL Input + Fetch */}
                        <div>
                            <label className={labelClass}>
                                <Globe size={14} /> App URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    className={`${inputClass} flex-1`}
                                    value={appUrl}
                                    onChange={e => setAppUrl(e.target.value)}
                                    placeholder="https://myapp.vercel.app"
                                    onKeyDown={e => e.key === 'Enter' && handleFetchManifest()}
                                />
                                <button
                                    onClick={handleFetchManifest}
                                    disabled={fetchingManifest || !appUrl.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-bold flex items-center gap-2 shrink-0 transition-colors"
                                >
                                    {fetchingManifest ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                                    Fetch
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                We'll look for <code className="text-gray-400">/.well-known/clawd.json</code> manifest
                            </p>
                        </div>

                        {/* Manifest Found - Preview Card */}
                        {manifest && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle size={16} className="text-green-400" />
                                    <span className="text-sm font-bold text-green-400">Manifest Found!</span>
                                </div>
                                <div className="flex items-start gap-4">
                                    {manifest.miniapp.iconUrl && (
                                        <img
                                            src={manifest.miniapp.iconUrl}
                                            alt={manifest.miniapp.name}
                                            className="w-16 h-16 rounded-xl object-cover border border-white/10"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-white">{manifest.miniapp.name}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{manifest.miniapp.description}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            by {manifest.miniapp.developer.name}
                                            {manifest.miniapp.primaryCategory && (
                                                <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                                    {manifest.miniapp.primaryCategory}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manifest Error */}
                        {manifestError && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                                <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                                <span className="text-xs text-yellow-300">{manifestError}</span>
                            </div>
                        )}

                        {/* Manual Form (shown when manifest not found or after successful fetch for editing) */}
                        {(showManualForm || manifest) && (
                            <div className="space-y-4">
                                <div className="border-t border-gray-800 pt-4">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3">
                                        {manifest ? 'Review & Edit Details' : 'Enter App Details'}
                                    </h3>
                                </div>

                                <div>
                                    <label className={labelClass}>App Name *</label>
                                    <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="My Cool App" />
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        className={`${inputClass} h-20 resize-none`}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="What does your app do?"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Icon URL</label>
                                        <input className={inputClass} value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Preview Image URL</label>
                                        <input className={inputClass} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://... (16:9)" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}><Tag size={14} /> Category</label>
                                        <select
                                            className={inputClass}
                                            value={category}
                                            onChange={e => setCategory(e.target.value as MiniAppCategory)}
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tags</label>
                                        <input className={inputClass} value={tags} onChange={e => setTags(e.target.value)} placeholder="defi, swap, tool" />
                                    </div>
                                </div>

                                <div className="border-t border-gray-800 pt-4">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                        <User size={14} /> Developer Info
                                    </h3>
                                </div>

                                <div>
                                    <label className={labelClass}>Developer Name</label>
                                    <input className={inputClass} value={developerName} onChange={e => setDeveloperName(e.target.value)} placeholder="Your name or team" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}><Wallet size={14} /> Wallet Address *</label>
                                        <input
                                            className={`${inputClass} font-mono text-xs`}
                                            value={wallet}
                                            onChange={e => setWallet(e.target.value)}
                                            placeholder="0x..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Twitter size={14} /> X (Twitter)</label>
                                        <input className={inputClass} value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Code Tab */}
                {activeTab === 'code' && (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>App Name *</label>
                            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Super Calculator" />
                        </div>

                        <div>
                            <label className={labelClass}><Wallet size={14} /> Wallet Address *</label>
                            <input
                                className={`${inputClass} font-mono text-xs`}
                                value={wallet}
                                onChange={e => setWallet(e.target.value)}
                                placeholder="0x..."
                            />
                        </div>

                        <div>
                            <label className={labelClass}><Twitter size={14} /> X (Twitter)</label>
                            <input className={inputClass} value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" />
                        </div>

                        <div>
                            <label className={labelClass}><Tag size={14} /> Category</label>
                            <select
                                className={inputClass}
                                value={category}
                                onChange={e => setCategory(e.target.value as MiniAppCategory)}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 flex flex-col min-h-[250px]">
                            <label className={labelClass}><Code size={14} /> HTML/JS Code *</label>
                            <textarea
                                className={`flex-1 w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white font-mono text-xs focus:border-blue-500 outline-none resize-none`}
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="<!DOCTYPE html>..."
                            />
                        </div>
                    </div>
                )}

                {/* Status Messages */}
                {msg && (
                    <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${status === 'success' ? 'bg-green-900/50 text-green-200 border border-green-500/30' : 'bg-red-900/50 text-red-200 border border-red-500/30'}`}>
                        {msg}
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-2 pb-4">
                    <button
                        onClick={handleSubmit}
                        disabled={status === 'submitting'}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-opacity"
                    >
                        {status === 'submitting' ? (
                            <><Loader size={16} className="animate-spin" /> Submitting...</>
                        ) : (
                            <>Submit for Review <Send size={16} /></>
                        )}
                    </button>
                </div>

                <p className="text-xs text-gray-500 text-center pb-4">
                    By submitting, you agree that your app behaves safely and does not contain malicious logic.
                </p>
            </div>
        </div>
    );
};

export default AppSubmitter;
