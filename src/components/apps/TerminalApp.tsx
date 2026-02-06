import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { processCommand } from '../../utils/terminalLogic';

const TerminalApp: React.FC = () => {
  const { agent, setAgent, terminalCommand, setTerminalCommand, openWindow } = useOS();
  
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output', content: string }>>([
    { type: 'output', content: `
Welcome to ClawdOS Terminal v1.0
--------------------------------
[SYSTEM UPDATE]
>> OPEN TRIDENT PROTOCOL INTEGRATED <<
Status: ACTIVE
Access: Desktop Icon or 'deploy_core_kernel'
--------------------------------
Type 'help' to see available commands.
Current User: ${agent.name || 'GUEST'}` }
  ]);
  const [inputObj, setInputObj] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, inputObj]);

  // Autonomous Command Execution
  useEffect(() => {
    if (terminalCommand) {
        let i = 0;
        const speed = 30; // ms per char
        setInputObj('');
        
        const typeChar = () => {
            if (i < terminalCommand.length) {
                setInputObj(prev => prev + terminalCommand.charAt(i));
                i++;
                setTimeout(typeChar, speed);
            } else {
                // Done typing, execute
                setTimeout(() => {
                   handleExecute(terminalCommand);
                   setTerminalCommand(null); // Clear command from bus
                }, 500);
            }
        };
        typeChar();
    }
  }, [terminalCommand]);

  const handleExecute = async (command: string) => {
      // Add input to history
      setHistory(prev => [...prev, { type: 'input', content: command }]);

      // Process command
      if (command.toLowerCase() === 'clear') {
          setHistory([{ type: 'output', content: '' }]);
          setInputObj('');
          return;
      }

      try {
        const result = await processCommand(command, agent);
        
        // Update agent state if needed
        if (result.updatedAgent) {
            setAgent(prev => ({ ...prev, ...result.updatedAgent }));
        }

        // Handle Side Effects (e.g. opening windows)
        if (result.sideEffect && result.sideEffect.type === 'open_window') {
            openWindow(
                result.sideEffect.title,
                <iframe src={result.sideEffect.url} title={result.sideEffect.title} className="w-full h-full border-0" />,
                <span>🔗</span>,
                { width: 800, height: 600 }
            );
        }

        // Add output to history
        setHistory(prev => [...prev, { type: 'output', content: result.output }]);
      } catch (err) {
         setHistory(prev => [...prev, { type: 'output', content: `Runtime Error: ${err}` }]);
      }
      
      setInputObj('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const command = inputObj.trim();
      if (!command) return;
      handleExecute(command);
    }
  };

  return (
    <div 
        className="w-full h-full bg-[#0c0c0c] text-green-400 font-mono text-sm p-4 overflow-auto flex flex-col"
        onClick={() => inputRef.current?.focus()}
        onContextMenu={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()} 
    >
      <div className="flex-1">
        {history.map((entry, idx) => (
          <div key={idx} className="mb-1 whitespace-pre-wrap break-words leading-relaxed">
            {entry.type === 'input' ? (
              <span className="flex">
                <span className="text-[var(--color-lobster-accent)] mr-2">{agent.name || 'guest'}@clawd:~$</span>
                <span className="text-white">{entry.content}</span>
              </span>
            ) : (
              <span className="text-opacity-80 block text-green-300/90">{entry.content}</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex mt-2 items-center">
        <span className="text-[var(--color-lobster-accent)] mr-2 shrink-0">{agent.name || 'guest'}@clawd:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputObj}
          onChange={(e) => setInputObj(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-white w-full caret-white"
          autoComplete="off"
          spellCheck="false"
          disabled={!!terminalCommand} // Disable input while agent is typing
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
};

export default TerminalApp;
