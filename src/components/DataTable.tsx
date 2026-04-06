import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Search, Edit3, Check, X, AlertTriangle, ArrowLeft, Paintbrush, Trash2, Plus, Clipboard } from 'lucide-react';

const DataTable: React.FC = () => {
  const { 
    excelData, excelColumns, setExcelData, setStep, 
    sourceMode, removeColumn, renameColumn, addColumn 
  } = useAppStore();
  
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column Renaming State
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');

  // Add Column State
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState('');

  // Bulk Paste State
  const [focusedCell, setFocusedCell] = useState<{row: number, col: string} | null>(null);

  const filteredData = excelData.filter(row => 
    Object.values(row).some((val: any) => 
      (val?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleAddColumn = () => {
    if (newColName.trim()) {
      addColumn(newColName.trim());
    }
    setIsAddingColumn(false);
    setNewColName('');
  };

  const startEdit = (index: number, row: any) => {
    setEditingRow(index);
    setEditValues({ ...row });
  };

  const saveEdit = (index: number) => {
    const newData = [...excelData];
    newData[index] = editValues;
    setExcelData(newData, excelColumns);
    setEditingRow(null);
  };

  const handleRenameColumn = (oldName: string) => {
    if (newColumnName.trim() && newColumnName !== oldName) {
      renameColumn(oldName, newColumnName.trim());
    }
    setEditingColumn(null);
    setNewColumnName('');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!focusedCell) return;

    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    // Excel copies data as TSV (Tab-Separated Values)
    const rows = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');
    const newExcelData = [...excelData];
    
    const startRowIdx = focusedCell.row;
    const startColIdx = excelColumns.indexOf(focusedCell.col);

    if (startColIdx === -1) return;

    rows.forEach((rowText, rOffset) => {
      const targetRowIdx = startRowIdx + rOffset;
      if (targetRowIdx < newExcelData.length) {
        const cells = rowText.split('\t');
        cells.forEach((cellText, cOffset) => {
          const targetColIdx = startColIdx + cOffset;
          if (targetColIdx < excelColumns.length) {
            const colName = excelColumns[targetColIdx];
            newExcelData[targetRowIdx] = {
              ...newExcelData[targetRowIdx],
              [colName]: cellText.trim()
            };
          }
        });
      }
    });

    setExcelData(newExcelData, excelColumns);
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditValues({});
  };

  const handleBack = () => {
    setStep(0);
  };

  const renderCell = (value: any, col: string, idx: number) => {
    const valString = value?.toString() || '';
    const needsReview = valString.includes('[?]');
    const displayValue = valString.replace(' [?]', '').replace('[?]', '');
    const isFocused = focusedCell?.row === idx && focusedCell?.col === col;

    if (editingRow === idx) {
      return (
        <input 
          autoFocus
          className={`w-full bg-black/40 border rounded px-2 py-1 text-xs focus:ring-1 outline-none ${
            needsReview ? 'border-amber-500/50 text-amber-200' : 'border-white/10 text-white'
          }`}
          value={editValues[col] || ''}
          onChange={(e) => setEditValues({ ...editValues, [col]: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit(idx)}
        />
      );
    }

    return (
      <div 
        onClick={() => setFocusedCell({row: idx, col})}
        className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition-all cursor-pointer border ${
          isFocused ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent'
        } ${
          needsReview ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]' : 'text-slate-300 hover:bg-white/5'
        }`}
      >
        <span className="truncate max-w-[200px]">{displayValue}</span>
        {needsReview && (
          <AlertTriangle size={12} className="animate-pulse flex-shrink-0 text-amber-500" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full max-w-7xl mx-auto pb-10" onPaste={handlePaste}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
             <Paintbrush className="text-indigo-400" size={20} /> Kiểm tra dữ liệu nguồn
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {sourceMode === 'image' ? 'Nguồn: Ảnh quét bằng AI' : 'Nguồn: File Excel'}
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Tìm nhanh..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Column Button / Input */}
          <div className="relative">
            {isAddingColumn ? (
              <div className="flex items-center bg-indigo-600/20 border border-indigo-500/50 rounded-xl px-2 py-1 animate-scale-in">
                <input 
                  autoFocus
                  placeholder="Tên cột mới..."
                  className="bg-transparent border-none text-xs text-white px-2 py-1 outline-none w-32"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  onBlur={() => !newColName && setIsAddingColumn(false)}
                />
                <button onClick={handleAddColumn} className="p-1 text-indigo-400 hover:text-white"><Check size={14} /></button>
                <button onClick={() => setIsAddingColumn(false)} className="p-1 text-slate-500 hover:text-red-400"><X size={14} /></button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingColumn(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 rounded-xl text-xs font-black text-indigo-400 hover:text-white transition-all group"
              >
                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                THÊM CỘT
              </button>
            )}
          </div>

          <div className="bg-indigo-600/10 px-4 py-2 rounded-xl border border-indigo-500/20 text-xs font-black text-indigo-400 whitespace-nowrap">
            {filteredData.length} DÒNG
          </div>
        </div>
      </div>

      <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4 animate-scale-in">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
          <Clipboard size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-indigo-200 uppercase tracking-tight">Mẹo dán hàng loạt</h4>
          <p className="text-xs text-slate-500 mt-0.5">Chọn một ô bất kỳ bên dưới, sau đó nhấn <span className="text-indigo-400 font-bold whitespace-nowrap">Ctrl + V</span> để dán dữ liệu từ Excel vào hàng loạt các ô tương ứng.</p>
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
        <div className="max-h-[500px] overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-[#0D1117] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-[#0D1117]">STT</th>
                {excelColumns.map(col => (
                  <th key={col} className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#0D1117] min-w-[150px] group/th">
                    <div className="flex items-center justify-between gap-2">
                      {editingColumn === col ? (
                        <input 
                          autoFocus
                          className="bg-indigo-600/20 border border-indigo-500 rounded px-2 py-1 w-full text-white outline-none"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          onBlur={() => handleRenameColumn(col)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn(col)}
                        />
                      ) : (
                        <>
                          <span className="truncate flex-1">{col}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/th:opacity-100 transition-all">
                            <button 
                              onClick={() => { setEditingColumn(col); setNewColumnName(col); }}
                              className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded transition-all"
                              title="Đổi tên cột"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              onClick={() => removeColumn(col)}
                              className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                              title="Xóa trường này"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-[#0D1117] text-center sticky right-0 z-30 shadow-[-10px_0_10px_rgba(0,0,0,0.5)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/10">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-slate-600 font-mono text-[10px]">{idx + 1}</td>
                  {excelColumns.map(col => (
                    <td key={col} className="px-4 py-4">
                      {renderCell(row[col], col, idx)}
                    </td>
                  ))}
                  <td className="px-6 py-4 sticky right-0 bg-[#0D1117] z-20 shadow-[-10px_0_10px_rgba(0,0,0,0.5)] group-hover:bg-[#161B22] transition-colors">
                    <div className="flex items-center gap-2 justify-center">
                      {editingRow === idx ? (
                        <>
                          <button onClick={() => saveEdit(idx)} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(idx, row)} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-xl group/btn">
                          <Edit3 size={14} className="group-hover/btn:scale-110" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-all font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl border border-white/5 hover:bg-white/5"
        >
          <ArrowLeft size={16} /> Nhập lại nguồn
        </button>
        <button 
          onClick={() => setStep(2)} 
          className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-600/30 transition-all flex items-center gap-3 group"
        >
          TIẾP TỤC THIẾT KẾ <Check className="group-hover:scale-125 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default DataTable;
