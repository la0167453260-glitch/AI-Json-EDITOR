import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Network } from 'lucide-react';

interface DiagramToolProps {
  onInsert: (html: string) => void;
}

const DiagramTool: React.FC<DiagramToolProps> = ({ onInsert }) => {
  const [code, setCode] = useState<string>(`graph TD;
  A[Start] --> B{Is it?};
  B -- Yes --> C[OK];
  C --> D[End];
  B -- No --> E[Find Out];
  E --> D;`);
  
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
    renderDiagram();
  }, [code]);

  const renderDiagram = async () => {
    if (previewRef.current) {
        try {
            previewRef.current.innerHTML = '';
            const { svg } = await mermaid.render(`mermaid-${Date.now()}`, code);
            previewRef.current.innerHTML = svg;
        } catch (e) {
            console.error(e);
            if(previewRef.current) previewRef.current.innerHTML = '<span class="text-red-500 text-xs">Syntax Error</span>';
        }
    }
  };

  const insert = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-ins-${Date.now()}`, code);
        onInsert(`<div contenteditable="false" class="my-4 text-center">${svg}</div><p></p>`);
      } catch (e) {}
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-border">
       <div className="p-3 border-b border-border bg-gray-50 flex items-center gap-2">
         <Network size={16} /> 
         <span className="text-sm font-semibold">Diagram (Mermaid)</span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-auto">
         <textarea 
            className="w-full p-2 border border-border rounded font-mono text-xs h-40 focus:border-primary focus:outline-none resize-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
        />
        <div className="border border-border rounded p-2 bg-white min-h-[150px] flex items-center justify-center overflow-auto" ref={previewRef}></div>
      </div>
      <div className="p-2 border-t border-border">
         <button onClick={insert} className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded text-sm font-medium transition">
              Insert Diagram
         </button>
      </div>
    </div>
  );
};

export default DiagramTool;