import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, CheckCircle, AlertTriangle, Sparkles, RefreshCw, ExternalLink, Globe } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useOS } from '../../contexts/OSContext';
import type { ClawdSDKContext } from '../../types/miniapp';

interface MiniAppRunnerProps {
  initialCode?: string;
  appId?: string;
  appUrl?: string;
  appType?: 'code' | 'url';
}

const MiniAppRunner: React.FC<MiniAppRunnerProps> = ({ initialCode, appId, appUrl, appType = 'code' }) => {
  const { agent, closeWindow, windows } = useOS();
  const [code] = useState(initialCode || '');
  const [isRunning, setIsRunning] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [devInput, setDevInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isUrlMode = appType === 'url' && !!appUrl;

  // Build SDK context to send to iframe
  const getSdkContext = useCallback((): ClawdSDKContext => ({
    user: {
      wallet: agent.wallet || null,
      name: agent.name || null,
    },
    app: {
      id: appId || null,
    },
    theme: 'dark',
    platform: 'clawdos',
  }), [agent.wallet, agent.name, appId]);

  // SDK Bridge: listen to messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data.type !== 'string') return;

      // Only handle messages from our iframe
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;

      switch (data.type) {
        case 'clawd:ready':
          setIsRunning(true);
          break;

        case 'clawd:get_context':
          iframeRef.current?.contentWindow?.postMessage({
            type: 'clawd:context_response',
            payload: getSdkContext(),
          }, '*');
          break;

        case 'clawd:close': {
          // Find and close the window containing this runner
          const currentWindow = windows.find(w =>
            w.component && typeof w.component === 'object'
          );
          if (currentWindow) {
            closeWindow(currentWindow.id);
          }
          break;
        }

        case 'clawd:set_title':
          // Title updates are handled by the Window component - we'd need
          // a more complex setup to update it. For now, log it.
          console.log('SDK: set_title', data.payload?.title);
          break;

        case 'clawd:open_url':
          if (data.payload?.url && typeof data.payload.url === 'string') {
            window.open(data.payload.url, '_blank', 'noopener,noreferrer');
          }
          break;

        case 'clawd:show_toast':
          if (data.payload?.message) {
            console.log('SDK Toast:', data.payload.message);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [getSdkContext, windows, closeWindow]);

  // Send context updates when agent changes
  useEffect(() => {
    if (isRunning && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'clawd:context_update',
        payload: getSdkContext(),
      }, '*');
    }
  }, [agent.wallet, agent.name, isRunning, getSdkContext]);

  // Code mode: write HTML into iframe
  const runCode = () => {
    if (iframeRef.current && code && !isUrlMode) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(code);
        iframeDoc.close();
        setIsRunning(true);
      }
    }
  };

  useEffect(() => {
    if (code && !isUrlMode) {
      runCode();
    }
  }, [code, isUrlMode]);

  // URL mode: auto-set running when iframe loads
  const handleIframeLoad = () => {
    if (isUrlMode) {
      setIsRunning(true);
    }
  };

  const handleReload = () => {
    if (isUrlMode && iframeRef.current) {
      iframeRef.current.src = appUrl!;
    } else {
      runCode();
    }
  };

  const handleSubmit = async () => {
    if (!code && !isUrlMode) return;
    setSubmissionStatus('submitting');

    const titleMatch = code.match(/<title>(.*?)<\/title>/i);
    const name = titleMatch ? titleMatch[1] : `Mini App by ${agent.name || 'User'}`;

    const { error } = await supabase
      .from('mini_apps')
      .insert([{
        name,
        code: isUrlMode ? null : code,
        app_url: isUrlMode ? appUrl : null,
        app_type: appType,
        status: 'pending_review',
        owner_wallet: agent.wallet,
        description: 'Generated via Agent Chat'
      }]);

    if (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
    } else {
      setSubmissionStatus('success');
    }
  };

  const handleDevRequest = () => {
    if (!devInput.trim()) return;
    navigator.clipboard.writeText(`Regarding the app "${appId || 'New App'}", please update the code: ${devInput}`);
    alert("Instructions copied! Paste them in Agent Chat to generate the update.");
  };

  // URL mode layout (full preview, minimal UI)
  if (isUrlMode) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e2e] text-white overflow-hidden">
        {/* URL info bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#13131f] border-b border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Globe size={12} className="text-gray-500 shrink-0" />
            <span className="text-xs text-gray-400 font-mono truncate">{appUrl}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleReload}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              title="Reload"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={() => window.open(appUrl, '_blank', 'noopener,noreferrer')}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Full-size iframe */}
        <div className="flex-1 bg-white relative">
          <iframe
            ref={iframeRef}
            src={appUrl}
            title="Mini App"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    );
  }

  // Code mode layout (original with dev panel)
  return (
    <div className="flex h-full bg-[#1e1e2e] text-white overflow-hidden">
      {/* Left: Preview Area */}
      <div className="flex-1 flex flex-col border-r border-white/10">
        <div className="flex items-center justify-between p-2 bg-black/20 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview</span>
            <button
              onClick={handleReload}
              className="p-1 hover:bg-white/10 rounded text-green-400 transition-colors"
              title="Reload"
            >
              <Play size={14} />
            </button>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {isRunning ? 'Running' : 'Ready'}
          </div>
        </div>
        <div className="flex-1 bg-white relative">
          <iframe
            ref={iframeRef}
            title="Mini App Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
          />
        </div>
      </div>

      {/* Right: Dev Panel */}
      <div className="w-80 flex flex-col bg-[#13131f]">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-bold text-[var(--color-lobster-accent)] flex items-center gap-2">
            <Sparkles size={16} /> Dev Panel
          </h3>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Edit Instructions</label>
            <textarea
              value={devInput}
              onChange={(e) => setDevInput(e.target.value)}
              placeholder="e.g., Change background to blue, make the ball faster..."
              className="w-full h-32 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:border-[var(--color-lobster-accent)] outline-none resize-none"
            />
            <button
              onClick={handleDevRequest}
              className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              Copy to Agent Chat <Sparkles size={12} />
            </button>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Publishing</h4>
            <p className="text-xs text-gray-500 mb-3">
              Submit your app to the ClawdOS Store. Once approved, it will be tokenized and listed.
            </p>

            {submissionStatus === 'idle' && (
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg text-sm font-bold shadow-lg transition-all"
              >
                Submit to Store
              </button>
            )}

            {submissionStatus === 'submitting' && (
              <div className="w-full py-3 bg-white/5 rounded-lg text-center text-xs animate-pulse">
                Submitting for Review...
              </div>
            )}

            {submissionStatus === 'success' && (
              <div className="w-full py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center text-xs text-green-400 flex items-center justify-center gap-2">
                <CheckCircle size={14} /> Submitted Successfully!
              </div>
            )}

            {submissionStatus === 'error' && (
              <div className="w-full py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center text-xs text-red-400 flex items-center justify-center gap-2">
                <AlertTriangle size={14} /> Submission Failed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniAppRunner;
