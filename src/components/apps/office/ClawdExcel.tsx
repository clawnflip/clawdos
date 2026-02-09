import { useState } from 'react';

interface ClawdExcelProps {
    fileId?: string;
    initialContent?: string; // JSON string of string[][]
}

const generateGrid = (rows: number, cols: number) => {
    const grid = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push('');
        }
        grid.push(row);
    }
    return grid;
};

const ClawdExcel: React.FC<ClawdExcelProps> = ({ fileId, initialContent }) => {
  const [data, setData] = useState<string[][]>(() => {
      if (initialContent) {
          try {
              return JSON.parse(initialContent);
          } catch (e) {
              console.error("Failed to parse Excel data", e);
          }
      }
      return generateGrid(20, 10);
  });
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);

  // Auto-save removed (file system not implemented)

  const handleCellChange = (r: number, c: number, value: string) => {
      const newData = [...data];
      // Deep copy the row to avoid mutation
      newData[r] = [...newData[r]];
      newData[r][c] = value;
      setData(newData);
  };

  const getColumnLabel = (index: number) => {
      return String.fromCharCode(65 + index); // A, B, C...
  };

  return (
    <div className="flex flex-col h-full bg-white text-black font-sans text-xs">
        {/* Ribbon */}
        <div className="bg-[#217346] text-white p-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <span className="font-bold text-lg">ClawdExcel</span>
                <div className="flex gap-2">
                    <button className="hover:bg-white/10 px-2 py-1 rounded">Home</button>
                    <button className="hover:bg-white/10 px-2 py-1 rounded">Insert</button>
                    <button className="hover:bg-white/10 px-2 py-1 rounded">Formulas</button>
                </div>
            </div>
            {fileId && <div className="text-xs opacity-70">Saved</div>}
        </div>

        {/* Formula Bar */}
        <div className="flex items-center p-1 border-b border-gray-300 bg-gray-50">
            <div className="w-10 text-center text-gray-500 font-bold border-r border-gray-300 mr-2">
                {selectedCell ? `${getColumnLabel(selectedCell.c)}${selectedCell.r + 1}` : ''}
            </div>
            <div className="font-serif italic text-gray-500 px-2">fx</div>
            <input 
                className="flex-1 border-none bg-transparent focus:outline-none" 
                value={selectedCell ? data[selectedCell.r][selectedCell.c] : ''}
                onChange={(e) => selectedCell && handleCellChange(selectedCell.r, selectedCell.c, e.target.value)}
                disabled={!selectedCell}
            />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto relative">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="bg-gray-100 border border-gray-300 w-10"></th>
                        {data[0].map((_, i) => (
                            <th key={i} className="bg-gray-100 border border-gray-300 px-1 font-normal text-gray-600 min-w-[80px]">
                                {getColumnLabel(i)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, r) => (
                        <tr key={r}>
                            <td className="bg-gray-100 border border-gray-300 text-center text-gray-500">{r + 1}</td>
                            {row.map((cell, c) => (
                                <td 
                                    key={c} 
                                    className={`border border-gray-300 p-0 relative ${selectedCell?.r === r && selectedCell?.c === c ? 'border-2 border-green-600 z-10' : ''}`}
                                    onClick={() => setSelectedCell({r, c})}
                                >
                                    <input 
                                        className="w-full h-full border-none px-1 focus:outline-none"
                                        value={cell}
                                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Sheet Tabs */}
        <div className="bg-gray-100 border-t border-gray-300 p-1 flex gap-1">
            <button className="bg-white px-3 py-1 text-green-700 font-bold border-b-2 border-green-600 shadow-sm">Sheet1</button>
            <button className="hover:bg-gray-200 px-2 py-1 text-gray-600">+</button>
        </div>
    </div>
  );
};

export default ClawdExcel;
