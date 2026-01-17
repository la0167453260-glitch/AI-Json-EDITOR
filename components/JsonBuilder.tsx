import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Copy, Upload, Download, 
  ChevronRight, ChevronDown, 
  FileJson, Check, Code, Sparkles, X, RefreshCw
} from 'lucide-react';
import { SchemaField, DataType } from '../types';
import { generateJsonData } from '../services/geminiService';

// --- Constants & Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const TYPE_COLORS: Record<DataType, string> = {
  string: 'text-green-400 border-green-400/30',
  number: 'text-blue-400 border-blue-400/30',
  boolean: 'text-purple-400 border-purple-400/30',
  null: 'text-red-400 border-red-400/30',
  object: 'text-yellow-400 border-yellow-400/30',
  array: 'text-orange-400 border-orange-400/30',
};

// Converts raw JSON into our SchemaField structure
const parseJsonToSchema = (data: any, key: string = ''): SchemaField => {
  const id = generateId();
  if (data === null) {
    return { id, key, type: 'null', value: null };
  }
  if (Array.isArray(data)) {
    return { 
      id, key, type: 'array', value: null, isOpen: true,
      items: data.map(item => parseJsonToSchema(item, '')) 
    };
  }
  if (typeof data === 'object') {
    return { 
      id, key, type: 'object', value: null, isOpen: true,
      children: Object.entries(data).map(([k, v]) => parseJsonToSchema(v, k))
    };
  }
  return { id, key, type: typeof data as DataType, value: data };
};

// Converts SchemaField structure back to raw JSON
const parseSchemaToJson = (schema: SchemaField): any => {
  if (schema.type === 'array') {
    return schema.items?.map(parseSchemaToJson) || [];
  }
  if (schema.type === 'object') {
    const obj: any = {};
    schema.children?.forEach(child => {
      // Enforce string keys
      if (child.key) obj[child.key] = parseSchemaToJson(child);
    });
    return obj;
  }
  return schema.value;
};

// --- Main Component ---
const JsonBuilder: React.FC = () => {
  // Root state is an Array of Objects (represented as SchemaField[])
  // The HTML prototype enforced the root as a "list of cards"
  const [rootItems, setRootItems] = useState<SchemaField[]>([
    { 
      id: generateId(), 
      key: '', 
      type: 'object', 
      value: null, 
      children: [
        { id: generateId(), key: 'id', type: 'number', value: 1 },
        { id: generateId(), key: 'name', type: 'string', value: 'Example Item' }
      ]
    }
  ]);

  const [preview, setPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Effects ---
  useEffect(() => {
    try {
      // Reconstruct the root array
      const data = rootItems.map(parseSchemaToJson);
      setPreview(JSON.stringify(data, null, 2));
      
      // Basic validation (duplicate keys check in objects)
      // This is a simplified check for the root level for now
      setError(null);
    } catch (e) {
      setPreview('Error generating JSON preview');
    }
  }, [rootItems]);

  // --- Actions ---
  const addRootObject = () => {
    const newObj: SchemaField = {
      id: generateId(),
      key: '',
      type: 'object',
      value: null,
      children: [{ id: generateId(), key: 'new_key', type: 'string', value: '' }],
      isOpen: true
    };
    setRootItems([...rootItems, newObj]);
  };

  const removeRootObject = (index: number) => {
    const newItems = [...rootItems];
    newItems.splice(index, 1);
    setRootItems(newItems);
  };

  const updateRootItem = (index: number, updatedItem: SchemaField) => {
    const newItems = [...rootItems];
    newItems[index] = updatedItem;
    setRootItems(newItems);
  };

  const duplicateRootItem = (index: number) => {
    const itemToClone = rootItems[index];
    // Deep clone by serializing to JSON and back to Schema
    const raw = parseSchemaToJson(itemToClone);
    const clone = parseJsonToSchema(raw, ''); 
    const newItems = [...rootItems];
    newItems.splice(index + 1, 0, clone);
    setRootItems(newItems);
  };

  const clearAll = () => setRootItems([]);

  // --- Import/Export ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string);
        if (!Array.isArray(raw)) {
          alert("Imported JSON must be an Array of Objects at the root level.");
          return;
        }
        const newItems = raw.map(item => parseJsonToSchema(item, ''));
        setRootItems(newItems);
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([preview], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- AI Handler ---
  const handleAiGenerate = async () => {
    if(!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateJsonData(aiPrompt);
      if (Array.isArray(result)) {
        const newItems = result.map(item => parseJsonToSchema(item, ''));
        setRootItems(newItems);
        setShowAiModal(false);
        setAiPrompt('');
      } else {
        alert("AI did not return an array. Try refining your prompt.");
      }
    } catch (e) {
      alert("Failed to generate JSON.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full text-sm relative">
      {/* AI Modal Overlay */}
      {showAiModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Sparkles className="text-accent" size={18} /> Generate JSON with AI
               </h3>
               <button onClick={() => setShowAiModal(false)} className="text-muted hover:text-white">
                 <X size={18} />
               </button>
             </div>
             <p className="text-muted mb-4 text-xs">
               Describe the data you need (e.g., "A list of 5 users with names, emails, and active status").
               The current workspace will be overwritten.
             </p>
             <textarea 
                className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-accent outline-none min-h-[100px] resize-none mb-4"
                placeholder="Enter prompt..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
             />
             <div className="flex justify-end gap-2">
               <button onClick={() => setShowAiModal(false)} className="px-4 py-2 rounded-lg text-muted hover:bg-white/5">Cancel</button>
               <button 
                onClick={handleAiGenerate} 
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 flex items-center gap-2"
               >
                 {isGenerating ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                 {isGenerating ? 'Generating...' : 'Generate'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Editor Pane (Left) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-background">
        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface/30">
          <div className="flex items-center gap-3">
             <span className="text-muted font-medium flex items-center gap-2">
               <div className="bg-accent/10 p-1 rounded text-accent">
                 <FileJson size={16} />
               </div>
               Root: Array of Objects
             </span>
             <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted border border-white/5">
                {rootItems.length} items
             </span>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowAiModal(true)}
                className="text-xs px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-md flex items-center gap-1.5 transition shadow-lg shadow-purple-900/20"
             >
                <Sparkles size={12} /> AI Generate
             </button>
             <div className="w-px h-5 bg-border mx-1"></div>
             <label className="cursor-pointer text-xs flex items-center gap-1.5 px-3 py-1.5 hover:bg-surface rounded-md text-muted hover:text-text transition border border-transparent hover:border-border">
               <Upload size={12} /> Import
               <input type="file" className="hidden" accept=".json" onChange={handleImport} />
             </label>
             <button onClick={addRootObject} className="text-xs px-3 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-md flex items-center gap-1.5 transition">
               <Plus size={14} /> Add Object
             </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          {rootItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted opacity-50">
               <Code size={48} className="mb-4"/>
               <p>Array is empty.</p>
               <button onClick={addRootObject} className="mt-4 px-4 py-2 bg-surface border border-border rounded hover:bg-white/5">Add your first Object</button>
            </div>
          ) : (
            <div className="space-y-6">
              {rootItems.map((item, idx) => (
                <ObjectCard 
                  key={item.id} 
                  schema={item} 
                  index={idx}
                  onChange={(updated) => updateRootItem(idx, updated)}
                  onDelete={() => removeRootObject(idx)}
                  onDuplicate={() => duplicateRootItem(idx)}
                />
              ))}
            </div>
          )}
          
          <div className="h-20"></div> {/* Bottom spacer */}
        </div>

        {/* Footer Actions */}
        <div className="p-2 border-t border-border bg-surface/10 flex justify-between items-center px-4">
           <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
             <Trash2 size={12} /> Clear All
           </button>
           <span className="text-xs text-muted/50">Changes auto-save to preview</span>
        </div>
      </div>

      {/* JSON Preview Pane (Right) */}
      <div className="w-[420px] flex flex-col bg-[#0b1220] border-l border-border">
         <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface/5">
            <span className="text-muted font-medium flex items-center gap-2"><Code size={14} /> Live Preview</span>
            <div className="flex items-center gap-1">
               <button onClick={handleCopy} className={`p-2 rounded-md transition ${copied ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-muted hover:text-text hover:bg-surface border border-transparent'}`} title="Copy">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
               </button>
               <button onClick={handleDownload} className="p-2 rounded-md text-muted hover:text-text hover:bg-surface transition border border-transparent hover:border-border" title="Download">
                  <Download size={14} />
               </button>
            </div>
         </div>
         {error && (
            <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs px-4">
               {error}
            </div>
         )}
         <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            <pre className="font-mono text-[11px] leading-relaxed text-[#d4d4d4]" dangerouslySetInnerHTML={{
                __html: syntaxHighlight(preview)
            }} />
         </div>
      </div>
    </div>
  );
};

// --- Recursive Field Component ---

const ObjectCard: React.FC<{
  schema: SchemaField;
  index: number;
  onChange: (s: SchemaField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ schema, index, onChange, onDelete, onDuplicate }) => {
  
  const handleUpdate = (newSchema: SchemaField) => {
    onChange(newSchema);
  };

  const addField = () => {
    const newField: SchemaField = { id: generateId(), key: '', type: 'string', value: '' };
    const newChildren = [...(schema.children || []), newField];
    onChange({ ...schema, children: newChildren });
  };

  return (
    <div className="bg-[#131b2e] border border-border/50 rounded-xl shadow-xl overflow-hidden group">
      {/* Card Header */}
      <div 
        className="bg-surface/30 px-4 py-2 flex items-center justify-between border-b border-white/5 cursor-pointer hover:bg-surface/50 transition"
        onClick={() => onChange({...schema, isOpen: !schema.isOpen})}
      >
        <div className="flex items-center gap-2">
           <span className="text-muted/50 font-mono text-xs">#{index}</span>
           <span className="font-medium text-text text-sm">Object</span>
           <span className="text-xs text-muted">Element</span>
        </div>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
             className="p-1.5 hover:bg-white/10 rounded text-muted hover:text-text" title="Duplicate"
           >
             <Copy size={12} />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(); }}
             className="p-1.5 hover:bg-red-500/20 rounded text-muted hover:text-red-400" title="Delete"
           >
             <Trash2 size={12} />
           </button>
           <div className="ml-1 text-muted">
             {schema.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
           </div>
        </div>
      </div>

      {/* Card Content */}
      {schema.isOpen && (
        <div className="p-4 space-y-1">
          {schema.children?.map((child, i) => (
            <FieldRow 
              key={child.id} 
              field={child} 
              onUpdate={(updated) => {
                const newChildren = [...(schema.children || [])];
                newChildren[i] = updated;
                onChange({ ...schema, children: newChildren });
              }}
              onDelete={() => {
                const newChildren = [...(schema.children || [])];
                newChildren.splice(i, 1);
                onChange({ ...schema, children: newChildren });
              }}
            />
          ))}
          
          <button 
            onClick={addField}
            className="mt-3 w-full py-1.5 border border-dashed border-border rounded-lg text-xs text-muted hover:text-text hover:bg-white/5 flex items-center justify-center gap-1 transition"
          >
            <Plus size={12} /> Add Field
          </button>
        </div>
      )}
    </div>
  );
};

const FieldRow: React.FC<{
  field: SchemaField;
  onUpdate: (f: SchemaField) => void;
  onDelete: () => void;
  isInsideArray?: boolean; // If inside array, no keys allowed
}> = ({ field, onUpdate, onDelete, isInsideArray }) => {
  
  const handleTypeChange = (newType: DataType) => {
    let newVal = field.value;
    // Reset value if type changes drastically
    if (newType === 'boolean') newVal = false;
    else if (newType === 'number') newVal = 0;
    else if (newType === 'string') newVal = '';
    else if (newType === 'null') newVal = null;
    
    // Setup container structures
    const children = newType === 'object' ? [] : undefined;
    const items = newType === 'array' ? [] : undefined;
    
    onUpdate({ ...field, type: newType, value: newVal, children, items });
  };

  const handleAddNested = () => {
    if (field.type === 'object') {
       onUpdate({ ...field, children: [...(field.children || []), { id: generateId(), key: 'new', type: 'string', value: '' }] });
    } else if (field.type === 'array') {
       onUpdate({ ...field, items: [...(field.items || []), { id: generateId(), key: '', type: 'string', value: '' }] });
    }
  };

  return (
    <div className="flex flex-col gap-2 py-1 relative group/row">
      <div className="flex items-start gap-2">
        {/* Key Input (Only if not inside array) */}
        {!isInsideArray && (
          <div className="flex items-center gap-1 bg-surface/50 border border-border rounded px-2 h-8 shrink-0">
             <span className="text-muted/40 font-mono text-xs">"</span>
             <input 
                className="bg-transparent border-none outline-none text-xs font-mono text-accent w-24 sm:w-32 placeholder:text-muted/20"
                placeholder="key"
                value={field.key}
                onChange={(e) => onUpdate({ ...field, key: e.target.value })}
             />
             <span className="text-muted/40 font-mono text-xs">"</span>
             <span className="text-muted ml-1 text-xs">:</span>
          </div>
        )}

        {/* Type Selector */}
        <select 
          className={`h-8 bg-surface/30 border border-border rounded px-2 text-[10px] uppercase font-bold outline-none cursor-pointer hover:bg-surface/60 transition ${TYPE_COLORS[field.type].split(' ')[0]}`}
          value={field.type}
          onChange={(e) => handleTypeChange(e.target.value as DataType)}
        >
           {['string', 'number', 'boolean', 'object', 'array', 'null'].map(t => (
             <option key={t} value={t}>{t}</option>
           ))}
        </select>

        {/* Value Editor */}
        <div className="flex-1 min-w-0">
           {field.type === 'string' && (
             <div className="flex items-center px-2 border border-border/50 rounded bg-[#0b1220] h-8 w-full focus-within:border-accent/50 transition">
                <input 
                  className="bg-transparent border-none outline-none text-xs w-full text-[#ce9178] placeholder:text-muted/20"
                  placeholder="string value"
                  value={String(field.value ?? '')}
                  onChange={(e) => onUpdate({...field, value: e.target.value})}
                />
             </div>
           )}
           {field.type === 'number' && (
             <div className="flex items-center px-2 border border-border/50 rounded bg-[#0b1220] h-8 w-32 focus-within:border-accent/50 transition">
                <input 
                  type="number"
                  className="bg-transparent border-none outline-none text-xs w-full text-[#b5cea8]"
                  value={Number(field.value)}
                  onChange={(e) => onUpdate({...field, value: parseFloat(e.target.value)})}
                />
             </div>
           )}
           {field.type === 'boolean' && (
              <button 
                onClick={() => onUpdate({...field, value: !field.value})}
                className={`h-8 px-3 rounded text-xs font-bold border transition ${field.value ? 'bg-primary/20 text-primary border-primary/30' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
              >
                {String(field.value)}
              </button>
           )}
           {field.type === 'null' && (
             <div className="h-8 flex items-center px-2 text-xs text-muted/50 italic">null</div>
           )}
           {(field.type === 'object' || field.type === 'array') && (
             <div className="h-8 flex items-center px-2">
                <span className="text-xs text-muted italic">
                  {field.type === 'object' ? `${field.children?.length || 0} items` : `${field.items?.length || 0} items`}
                </span>
             </div>
           )}
        </div>

        {/* Actions */}
        <button 
          onClick={onDelete}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-red-500/20 text-muted hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
           <Trash2 size={12} />
        </button>
      </div>

      {/* Nested Content (Object or Array) */}
      {(field.type === 'object' || field.type === 'array') && (
        <div className="ml-4 pl-4 border-l border-white/5 mt-1">
           {field.type === 'object' && field.children?.map((child, i) => (
             <FieldRow 
               key={child.id}
               field={child}
               onUpdate={(u) => {
                 const newChildren = [...(field.children || [])];
                 newChildren[i] = u;
                 onUpdate({...field, children: newChildren});
               }}
               onDelete={() => {
                 const newChildren = [...(field.children || [])];
                 newChildren.splice(i, 1);
                 onUpdate({...field, children: newChildren});
               }}
             />
           ))}
           {field.type === 'array' && field.items?.map((child, i) => (
             <div key={child.id} className="flex gap-2">
                <span className="text-[10px] text-muted/30 pt-2 font-mono">{i}</span>
                <div className="flex-1">
                  <FieldRow 
                    field={child}
                    isInsideArray={true}
                    onUpdate={(u) => {
                      const newItems = [...(field.items || [])];
                      newItems[i] = u;
                      onUpdate({...field, items: newItems});
                    }}
                    onDelete={() => {
                      const newItems = [...(field.items || [])];
                      newItems.splice(i, 1);
                      onUpdate({...field, items: newItems});
                    }}
                  />
                </div>
             </div>
           ))}
           
           <button 
             onClick={handleAddNested}
             className="mt-1 text-[10px] text-muted hover:text-accent flex items-center gap-1 py-1 px-2 hover:bg-white/5 rounded transition"
           >
             <Plus size={10} /> Add {field.type === 'object' ? 'Property' : 'Item'}
           </button>
        </div>
      )}
    </div>
  );
};


// --- Utils ---
const syntaxHighlight = (json: string) => {
    if (!json) return '';
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'text-[#ce9178]'; // String
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-[#9cdcfe]'; // Key
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-[#569cd6]'; // Boolean
        } else if (/null/.test(match)) {
            cls = 'text-[#569cd6]'; // Null
        } else {
            cls = 'text-[#b5cea8]'; // Number
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

export default JsonBuilder;
