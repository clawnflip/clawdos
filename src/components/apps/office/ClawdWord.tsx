import { useState } from 'react';

interface ClawdWordProps {
  fileId?: string;
  initialContent?: string;
  fileName?: string;
}

const ClawdWord: React.FC<ClawdWordProps> = ({ fileId, initialContent = '', fileName: initialFileName = 'Untitled.txt' }) => {
  const [content, setContent] = useState(initialContent || 'Welcome to ClawdWord!\n\nStart typing here...');
  const [fileName, setFileName] = useState(initialFileName);

  // Auto-save effect (placeholder - file system not implemented)
  // useEffect(() => {
  //   if (fileId) {
  //       const timeout = setTimeout(() => {
  //           // Save to file system
  //       }, 1000);
  //       return () => clearTimeout(timeout);
  //   }
  // }, [content, fileId]);

  return (
    <div className="flex flex-col h-full bg-white text-black font-sans">
      {/* Ribbon / Toolbar */}
      <div className="bg-[#f3f4f6] border-b border-[#e5e7eb] p-2 flex items-center gap-4">
        <div className="flex flex-col">
            <input 
                type="text" 
                value={fileName} 
                onChange={(e) => setFileName(e.target.value)}
                className="bg-transparent font-bold text-sm border-none focus:outline-none focus:bg-white px-1 rounded"
            />
            <div className="flex gap-2 text-xs text-slate-600 mt-1">
                <button className="hover:bg-gray-200 px-2 py-0.5 rounded">File</button>
                <button className="hover:bg-gray-200 px-2 py-0.5 rounded">Home</button>
                <button className="hover:bg-gray-200 px-2 py-0.5 rounded">Insert</button>
                <button className="hover:bg-gray-200 px-2 py-0.5 rounded">View</button>
            </div>
        </div>
        <div className="h-8 w-px bg-gray-300 mx-2"></div>
        <div className="flex gap-1">
             <button className="p-1 hover:bg-gray-200 rounded text-sm font-bold">B</button>
             <button className="p-1 hover:bg-gray-200 rounded text-sm italic">I</button>
             <button className="p-1 hover:bg-gray-200 rounded text-sm underline">U</button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 bg-[#e5e5e5] p-8 overflow-auto flex justify-center">
        <div className="bg-white w-full max-w-[800px] min-h-[1000px] shadow-lg p-12 text-black">
            <textarea 
                className="w-full h-full resize-none border-none focus:outline-none p-0 text-base leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
            />
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-[#2b579a] text-white text-xs p-1 px-4 flex justify-between items-center">
        <div className="flex gap-4">
            <span>Page 1 of 1</span>
            <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
            <span>English (U.S.)</span>
            {fileId && <span className="opacity-50">Saved to cloud</span>}
        </div>
        <div>
            <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default ClawdWord;
