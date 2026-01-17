import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, BarChart3, Plus } from 'lucide-react';

interface TableChartToolProps {
  onInsert: (html: string) => void;
}

const COLORS = ['#0d6efd', '#20c997', '#ffc107', '#fd7e14', '#dc3545', '#6610f2'];

const TableChartTool: React.FC<TableChartToolProps> = ({ onInsert }) => {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(2);
  const [mode, setMode] = useState<'table' | 'chart'>('table');
  const [chartType, setChartType] = useState('bar');
  
  // Data structure: Array of objects
  const [data, setData] = useState<any[]>([
    { label: 'Item 1', val1: 10 },
    { label: 'Item 2', val1: 20 },
    { label: 'Item 3', val1: 15 },
    { label: 'Item 4', val1: 25 },
  ]);

  const headers = Object.keys(data[0] || {});

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...data];
    const numValue = parseFloat(value);
    newData[rowIndex][key] = isNaN(numValue) ? value : numValue;
    setData(newData);
  };

  const addRow = () => {
    const newRow: any = {};
    headers.forEach(h => newRow[h] = h.startsWith('val') ? 0 : `Item ${data.length + 1}`);
    setData([...data, newRow]);
    setRows(rows + 1);
  };

  const addCol = () => {
    const newKey = `val${headers.length}`;
    const newData = data.map(row => ({ ...row, [newKey]: 0 }));
    setData(newData);
    setCols(cols + 1);
  };

  const insertContent = () => {
    if (mode === 'table') {
      let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;"><thead><tr>`;
      headers.forEach(h => tableHtml += `<th style="border: 1px solid #ddd; padding: 8px; background: #f8f9fa;">${h}</th>`);
      tableHtml += `</tr></thead><tbody>`;
      data.forEach(row => {
        tableHtml += `<tr>`;
        headers.forEach(h => tableHtml += `<td style="border: 1px solid #ddd; padding: 8px;">${row[h]}</td>`);
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table>`;
      onInsert(tableHtml);
    } else {
      // For charts, we ideally render an image or a complex SVG. 
      // Since we can't easily rasterize Recharts to image in this context without heavy libs,
      // we'll insert a simplified HTML representation or placeholder.
      onInsert(`<b>[Chart: ${chartType}]</b><br/><i>(Visual charts inserted as static images require backend rendering or html2canvas)</i>`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-border">
      <div className="p-3 border-b border-border bg-gray-50 flex flex-wrap gap-2 items-center">
         <div className="flex bg-white rounded border border-border p-1">
            <button onClick={() => setMode('table')} className={`p-1.5 rounded ${mode==='table'?'bg-primary text-white':''}`}><Table size={16}/></button>
            <button onClick={() => setMode('chart')} className={`p-1.5 rounded ${mode==='chart'?'bg-primary text-white':''}`}><BarChart3 size={16}/></button>
         </div>
         {mode === 'chart' && (
             <select 
               value={chartType} 
               onChange={(e) => setChartType(e.target.value)}
               className="text-xs border border-border rounded p-1"
             >
                 <option value="bar">Bar</option>
                 <option value="line">Line</option>
                 <option value="pie">Pie</option>
             </select>
         )}
         <div className="ml-auto flex gap-2">
            <button onClick={addRow} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> Row</button>
            <button onClick={addCol} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> Col</button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs text-left text-gray-500 border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        {headers.map((h) => (
                            <th key={h} className="px-3 py-2 border border-gray-200 min-w-[80px]">
                                <input className="bg-transparent font-bold w-full outline-none" defaultValue={h} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="bg-white border-b hover:bg-gray-50">
                            {headers.map(h => (
                                <td key={`${i}-${h}`} className="px-1 py-1 border border-gray-200">
                                    <input 
                                        className="w-full px-2 py-1 outline-none" 
                                        value={row[h]} 
                                        onChange={(e) => handleCellChange(i, h, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

          {mode === 'chart' && (
              <div className="h-64 border rounded p-2 bg-white">
                  <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                          <BarChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={headers[0]} />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              {headers.slice(1).map((h, i) => (
                                  <Bar key={h} dataKey={h} fill={COLORS[i % COLORS.length]} />
                              ))}
                          </BarChart>
                      ) : chartType === 'line' ? (
                           <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={headers[0]} />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              {headers.slice(1).map((h, i) => (
                                  <Line key={h} type="monotone" dataKey={h} stroke={COLORS[i % COLORS.length]} />
                              ))}
                          </LineChart>
                      ) : (
                          <PieChart>
                              <Pie 
                                data={data} 
                                dataKey={headers[1]} 
                                nameKey={headers[0]} 
                                cx="50%" cy="50%" 
                                outerRadius={80} 
                                fill="#8884d8" 
                                label
                              >
                                {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                          </PieChart>
                      )}
                  </ResponsiveContainer>
              </div>
          )}
      </div>
      
      <div className="p-2 border-t border-border">
          <button onClick={insertContent} className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded text-sm font-medium transition">
              Insert {mode === 'table' ? 'Table' : 'Chart'}
          </button>
      </div>
    </div>
  );
};

export default TableChartTool;