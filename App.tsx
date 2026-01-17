import React from 'react';
import { LayoutGrid, Code2 } from 'lucide-react';
import JsonBuilder from './components/JsonBuilder';

const App: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface/50 backdrop-blur-sm">
         <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <LayoutGrid className="text-primary w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-100 tracking-tight">
              Pro <span className="text-primary">JSON Editor</span>
            </h1>
         </div>
         <div className="flex items-center gap-4 text-xs font-medium text-muted">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-border/50 border border-border">
              <Code2 size={12} /> Key-as-String Enforced
            </span>
            <span>v2.0.0</span>
         </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden">
         <JsonBuilder />
      </main>
    </div>
  );
};

export default App;