import React, { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useOS } from '../../contexts/OSContext';

interface MiniAppRunnerProps {
  initialCode?: string;
  appId?: string; // If viewing an existing app
}

const MiniAppRunner: React.FC<MiniAppRunnerProps> = ({ initialCode, appId }) => {
  const { agent } = useOS();
  const [code] = useState(initialCode || ''); // Code is read-only in this view for now
  const [isRunning, setIsRunning] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [devInput, setDevInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ... runCode logic remains the same ...

  const runCode = () => {
    if (iframeRef.current) {
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
    if (code) {
      runCode();
    }
  }, [code]);

  const handleSubmit = async () => {
    if (!code) return;
    setSubmissionStatus('submitting');
    
    // Extract title
    const titleMatch = code.match(/<title>(.*?)<\/title>/i);
    const name = titleMatch ? titleMatch[1] : `Mini App by ${agent.name || 'User'}`;

    const { error } = await supabase
      .from('mini_apps')
      .insert([
        { 
          name, 
          code, 
          status: 'pending_review', // Apps go to pending review
          owner_wallet: agent.wallet,
          description: 'Generated via Agent Chat'
        }
      ]);

    if (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
    } else {
      setSubmissionStatus('success');
    }
  };

  const handleDevRequest = () => {
      if (!devInput.trim()) return;
      
      // We need to send this back to the Agent Chat window
      // Since we can't easily access the OPEN Agent Chat instance state directly from here without context
      // We will use a "system message" approach or just open the agent chat if closed and pass a prompt.
      // Ideally, the AgentChat should be listening to a global event or we use the OSContext to pass a message.
      
      // For now, let's use a simple alert/mock or just try to open Agent Chat with a specific intruction.
      // But passing data to open windows is hard.
      // Let's use the clipboard for now as a fallback or just say "Copy this to chat".
      // OR better: Execute a terminal command that the Agent can intercept? No.
      
      // Best approach for this architecture:
      // Dispatch a custom event that AgentChat listens to?
      // Or just COPY to clipboard and notify user.
      
      // Wait, we have `agent` context. 
      // Let's keep it simple: Show a toast saying "Request sent to Neural Core" (Mock) 
      // and actually just update the code if we could, but we need the LLM.
      
      // REAL SOLUTION:
      // We can't easily trigger the LLM from here without duplicating AgentChat logic.
      // So, we will instruct the user to "Paste this in Chat".
      // OR we just use `executeTerminalCommand` to send a signal?
      
      // Let's user `navigator.clipboard.writeText` and tell user to paste it.
      navigator.clipboard.writeText(`Regarding the app "${appId || 'New App'}", please update the code: ${devInput}`);
      alert("Instructions copied! Paste them in Agent Chat to generate the update.");
  };

  return (
    <div className="flex h-full bg-[#1e1e2e] text-white overflow-hidden">
      
      {/* Left: Preview Area (70%) */}
      <div className="flex-1 flex flex-col border-r border-white/10">
          <div className="flex items-center justify-between p-2 bg-black/20 border-b border-white/5">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview</span>
                <button 
                    onClick={runCode}
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

      {/* Right: Dev Panel (30%) */}
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
