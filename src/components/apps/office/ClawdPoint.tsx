import { useState, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { ChevronLeft, ChevronRight, Plus, MonitorPlay } from 'lucide-react';

interface ClawdPointProps {
    fileId?: string;
    initialContent?: string; // JSON string of slides
}

const ClawdPoint: React.FC<ClawdPointProps> = ({ fileId, initialContent }) => {
  const { updateFile } = useOS();
  const [slides, setSlides] = useState(() => {
     if (initialContent) {
         try {
             return JSON.parse(initialContent);
         } catch (e) {
             console.error("Failed to parse Slides data", e);
         }
     }
     return [
      { id: 1, title: 'Click to add title', content: 'Click to add subtitle' },
      { id: 2, title: 'Agenda', content: '1. Introduction\n2. Demo\n3. Q&A' },
    ];
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  const activeSlide = slides[currentSlideIndex];

  // Auto-save effect
  useEffect(() => {
    if (fileId) {
        const timeout = setTimeout(() => {
            updateFile(fileId, JSON.stringify(slides));
        }, 1000); // Debounce save
        return () => clearTimeout(timeout);
    }
  }, [slides, fileId, updateFile]);

  const addSlide = () => {
      setSlides([...slides, { id: Date.now(), title: 'New Slide', content: 'Bullet points here...' }]);
      setCurrentSlideIndex(slides.length);
  };

  const updateSlide = (key: 'title' | 'content', value: string) => {
      const newSlides = [...slides];
      newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], [key]: value };
      setSlides(newSlides);
  };

  if (isPresenting) {
      return (
          <div className="fixed inset-0 bg-black z-[9999] flex flex-col justify-center items-center text-white" onClick={() => {
              if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(currentSlideIndex + 1);
              else setIsPresenting(false);
          }}>
              <div className="text-6xl font-bold mb-8 text-center">{activeSlide.title}</div>
              <div className="text-3xl whitespace-pre-wrap text-center opacity-80">{activeSlide.content}</div>
              
              <div className="fixed bottom-4 left-4 text-xs opacity-30">Click to advance • ESC to exit</div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-white text-black font-sans">
        {/* Ribbon */}
        <div className="bg-[#b7472a] text-white p-2 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-4">
                <span className="font-bold text-lg">ClawdPoint</span>
                <div className="flex gap-2 text-sm">
                    <button className="hover:bg-white/10 px-2 py-1 rounded">Home</button>
                    <button className="hover:bg-white/10 px-2 py-1 rounded">Insert</button>
                    <button className="hover:bg-white/10 px-2 py-1 rounded">Design</button>
                    <button className="hover:bg-white/10 px-2 py-1 rounded">Transitions</button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {fileId && <div className="text-xs opacity-70">Saved</div>}
                <button 
                    onClick={() => setIsPresenting(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded flex items-center gap-2 text-sm font-semibold"
                >
                    <MonitorPlay size={16} /> Present
                </button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Slides */}
            <div className="w-48 bg-gray-100 border-r border-gray-300 overflow-y-auto p-4 flex flex-col gap-4">
                {slides.map((slide: { id: number; title: string; content: string }, index: number) => (
                    <div 
                        key={slide.id}
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`aspect-video bg-white shadow border-2 cursor-pointer p-2 overflow-hidden flex flex-col gap-1 transition-all ${currentSlideIndex === index ? 'border-[#b7472a] ring-2 ring-[#b7472a]/20' : 'border-transparent hover:border-gray-300'}`}
                    >
                        <div className="text-[6px] font-bold truncate">{slide.title}</div>
                        <div className="text-[4px] text-gray-500 whitespace-pre-wrap truncate">{slide.content}</div>
                        <div className="mt-auto text-[6px] text-gray-400 self-end">{index + 1}</div>
                    </div>
                ))}
                
                <button 
                    onClick={addSlide}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded hover:bg-gray-200 text-gray-500 gap-1"
                >
                    <Plus size={20} />
                    <span className="text-xs">New Slide</span>
                </button>
            </div>

            {/* Main Editor */}
            <div className="flex-1 bg-gray-200 p-8 flex flex-col items-center justify-center overflow-auto">
                <div className="aspect-video w-full max-w-4xl bg-white shadow-xl p-12 flex flex-col gap-8">
                     <textarea
                        value={activeSlide.title}
                        onChange={(e) => updateSlide('title', e.target.value)}
                        className="text-4xl font-bold w-full text-center border-none focus:outline-none focus:ring-2 focus:ring-dashed focus:ring-gray-300 bg-transparent resize-none overflow-hidden"
                        placeholder="Click to add title"
                        rows={1}
                     />
                     <textarea
                        value={activeSlide.content}
                        onChange={(e) => updateSlide('content', e.target.value)}
                        className="text-xl w-full text-center border-none focus:outline-none focus:ring-2 focus:ring-dashed focus:ring-gray-300 bg-transparent resize-none flex-1"
                        placeholder="Click to add subtitle"
                     />
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-[#b7472a] text-white text-xs p-1 px-4 flex justify-between items-center">
             <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
             <div className="flex gap-2">
                 <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} className="hover:bg-white/20 p-1 rounded"><ChevronLeft size={14}/></button>
                 <button onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))} className="hover:bg-white/20 p-1 rounded"><ChevronRight size={14}/></button>
             </div>
        </div>
    </div>
  );
};

export default ClawdPoint;
