import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { Sigma } from 'lucide-react';

interface LatexToolProps {
  onInsert: (html: string) => void;
}

const LatexTool: React.FC<LatexToolProps> = ({ onInsert }) => {
  const [input, setInput] = useState<string>('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
        try {
            katex.render(input, previewRef.current, {
                throwOnError: false,
                displayMode: true
            });
        } catch (e) {
            // Handle error silently or show toast
        }
    }
  }, [input]);

  const insert = () => {
    // Generate HTML for insertion. Note: CSS must be loaded in the doc.
    try {
        const html = katex.renderToString(input, { throwOnError: false });
        onInsert(`<span contenteditable="false" class="mx-1">${html}</span>&nbsp;`);
    } catch (e) {}
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-border">
      <div className="p-3 border-b border-border bg-gray-50 flex items-center gap-2">
         <Sigma size={16} /> 
         <span className="text-sm font-semibold">LaTeX Editor</span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-auto">
        <textarea 
            className="w-full p-2 border border-border rounded font-mono text-sm h-32 focus:border-primary focus:outline-none resize-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter LaTeX..."
        />
        <div className="border border-border rounded p-4 bg-gray-50 min-h-[100px] flex items-center justify-center overflow-x-auto">
            <div ref={previewRef} />
        </div>
        <div className="flex gap-2">
            <button onClick={() => setInput(prev => prev + ' \\alpha ')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">α</button>
            <button onClick={() => setInput(prev => prev + ' \\beta ')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">β</button>
            <button onClick={() => setInput(prev => prev + ' \\sum ')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">∑</button>
            <button onClick={() => setInput(prev => prev + ' \\int ')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">∫</button>
        </div>
      </div>
      <div className="p-2 border-t border-border">
         <button onClick={insert} className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded text-sm font-medium transition">
              Insert Equation
         </button>
      </div>
    </div>
  );
};

export default LatexTool;