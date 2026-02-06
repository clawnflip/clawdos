import React, { useState, useEffect } from 'react';

const AnnouncementApp: React.FC = () => {
  const [text, setText] = useState('');
  const fullText = `
[SYSTEM BROADCAST]
--------------------------------
>> NEW MODULE DETECTED <<

ID:   BANKR
TYPE: DEFI_OPTIMIZER
URL:  bankr.bot

DESCRIPTION:
Advanced yield optimization and 
automated portfolio management.
Seamlessly integrated into ClawdOS.

STATUS: INSTALLED [OK]
ACCESS: DESKTOP SHORTCUT
--------------------------------
[END TRANSMISSION]
`;

  const startedRef = React.useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let i = 0;
    const speed = 30;
    const type = () => {
      if (i < fullText.length) {
        setText(prev => prev + fullText.charAt(i));
        i++;
        setTimeout(type, speed);
      }
    };
    type();
  }, []);

  return (
    <div className="w-full h-full bg-[#110505] text-[#ff4444] font-mono p-4 overflow-hidden selection:bg-red-900/40">
      <div className="whitespace-pre-wrap leading-relaxed animate-pulse-slow">
        {text}
        <span className="inline-block w-2 h-4 bg-[#ff4444] ml-1 animate-pulse"/>
      </div>
      <div className="absolute bottom-2 right-2 text-[10px] text-red-800 opacity-50">
        SECURE_CHANNEL_V1
      </div>
    </div>
  );
};

export default AnnouncementApp;
