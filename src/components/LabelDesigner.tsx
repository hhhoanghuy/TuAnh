import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Bold, AlignLeft, AlignCenter, AlignRight, Type, Sparkles, Save, Layout, Palette, ChevronsUpDown, Copy, GripVertical, Edit2 } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAppStore, LabelTemplate } from '../store/useAppStore';

export interface LabelLine {
  id: string;
  text: string;
  bold: boolean;
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
}

interface LabelDesignerProps {
  columns: string[];
  onSave: (lines: LabelLine[]) => void;
  initialLines?: LabelLine[];
}

export const LabelDesigner: React.FC<LabelDesignerProps> = ({ columns, onSave, initialLines }) => {
  const {
    labelDesign: lines,
    setLabelDesign: setLines,
    lineSpacing,
    setLineSpacing,
    savedTemplates,
    saveTemplate,
    deleteTemplate,
    updateTemplateName,
    loadTemplate
  } = useAppStore();

  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingTemplateIdx, setEditingTemplateIdx] = useState<number | null>(null);
  const [newTplName, setNewTplName] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const addLine = () => {
    const newLine: LabelLine = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      bold: false,
      fontSize: 11,
      alignment: 'center'
    };
    setLines([...lines, newLine]);
    setActiveLineId(newLine.id);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
    if (activeLineId === id) setActiveLineId(null);
  };

  const duplicateLine = (id: string) => {
    const line = lines.find(l => l.id === id);
    if (!line) return;
    const newLine = { ...line, id: Math.random().toString(36).substr(2, 9) };
    const idx = lines.findIndex(l => l.id === id);
    const newLines = [...lines];
    newLines.splice(idx + 1, 0, newLine);
    setLines(newLines);
    setActiveLineId(newLine.id);
  };

  const updateLine = (id: string, updates: Partial<LabelLine>) => {
    setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const insertField = (id: string, field: string) => {
    const line = lines.find(l => l.id === id);
    if (line) {
      updateLine(id, { text: line.text + `{${field}}` });
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplate(templateName);
    setTemplateName('');
    setShowSaveModal(false);
  };

  const activeLine = lines.find(l => l.id === activeLineId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
      {/* Sidebar: Templates */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass p-5 border-indigo-500/10">
          <h3 className="text-sm font-black text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Layout size={16} /> Mẫu Thiết Kế
          </h3>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {savedTemplates.map((tpl, idx) => (
              <div key={idx} className="group relative">
                <button
                  onClick={() => loadTemplate(tpl)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-600/10 transition-all pr-14"
                >
                  <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate">
                    {tpl.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{tpl.lines.length} dòng</div>
                </button>
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTemplateIdx(idx);
                      setNewTplName(tpl.name);
                    }}
                    className="p-1.5 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
                    title="Đổi tên"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(idx);
                    }}
                    className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                    title="Xóa mẫu"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full mt-4 py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-black transition-all border border-indigo-500/20 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <Save size={14} /> Lưu thiết kế này
          </button>
        </div>

        {/* Global Settings */}
        <div className="glass p-5 border-amber-500/10">
          <h3 className="text-sm font-black text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Palette size={16} /> Cấu hình chung
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                <span>Giãn dòng</span>
                <span className="text-amber-400">{(lineSpacing / 240).toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="180" max="480" step="20"
                value={lineSpacing}
                onChange={(e) => setLineSpacing(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Designer - Interactive Editor */}
      <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-8 ring-1 ring-white/5 p-4 rounded-3xl bg-black/20">

        {/* Left: Input List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest">
              <Type className="w-5 h-5" /> Soạn thảo nội dung
            </h3>
            <button
              onClick={addLine}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-xs font-black transition-all border border-indigo-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> THÊM DÒNG
            </button>
          </div>

          <div className="pr-2 custom-scrollbar">
            <Reorder.Group axis="y" values={lines} onReorder={setLines} className="space-y-3 max-h-[550px] overflow-y-auto">
              {lines.map((line) => (
                <Reorder.Item
                  key={line.id}
                  value={line}
                  onClick={() => setActiveLineId(line.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeLineId === line.id
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-[#161B22] border-white/5 hover:border-white/10'
                    }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <div className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 transition-colors">
                        <GripVertical size={16} />
                      </div>
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => updateLine(line.id, { text: e.target.value })}
                        placeholder="Dữ liệu..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      
                      {/* Mapping / Field Inserter */}
                      <div className="relative group/map flex-shrink-0">
                        <button className="h-full flex items-center gap-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black transition-all border border-indigo-500/20 group/btn">
                          <ChevronsUpDown size={12} className="group-hover/btn:scale-110 transition-transform" />
                          ÁNH XẠ
                        </button>
                        <select
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.value) {
                              insertField(line.id, e.target.value);
                              e.target.value = ""; // Reset
                            }
                          }}
                        >
                          <option value="" className="bg-white text-black">-- Chọn trường --</option>
                          {columns.map(col => (
                            <option key={col} value={col} className="bg-white text-black">{col}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); removeLine(line.id); }}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>

        {/* Right: Docs-Style Interactive Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 uppercase tracking-widest pl-2">
            <Sparkles className="w-5 h-5" /> Trình bày trực quan (WYSIWYG)
          </h3>

          <div className="relative group min-h-[500px]">
            {/* Visual Toolbar - Follows selection */}
            <AnimatePresence>
              {activeLineId && activeLine && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#1C2128] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 flex items-center gap-1.5 backdrop-blur-xl ring-4 ring-black/50"
                  style={{ width: 'max-content' }}
                >
                  {/* Local Formatting */}
                  <div className="flex bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => updateLine(activeLine.id, { bold: !activeLine.bold })}
                      className={`p-2 rounded-lg transition-all ${activeLine.bold ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Bold size={16} />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1 my-auto" />
                    <button
                      onClick={() => updateLine(activeLine.id, { alignment: 'left' })}
                      className={`p-2 rounded-lg transition-all ${activeLine.alignment === 'left' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      onClick={() => updateLine(activeLine.id, { alignment: 'center' })}
                      className={`p-2 rounded-lg transition-all ${activeLine.alignment === 'center' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      onClick={() => updateLine(activeLine.id, { alignment: 'right' })}
                      className={`p-2 rounded-lg transition-all ${activeLine.alignment === 'right' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      <AlignRight size={16} />
                    </button>
                  </div>

                  <select
                    value={activeLine.fontSize}
                    onChange={(e) => updateLine(activeLine.id, { fontSize: parseInt(e.target.value) })}
                    className="bg-white/5 border border-white/5 rounded-xl px-2 py-2 text-xs font-black text-slate-300 focus:outline-none hover:bg-white/10 transition-colors"
                  >
                    {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 32].map(size => (
                      <option key={size} value={size} className="bg-white text-black">{size}pt</option>
                    ))}
                  </select>

                  <div className="w-px h-6 bg-white/10 mx-1" />

                  {/* Mapping / Field Inserter */}
                  <div className="relative group/map">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black transition-all border border-indigo-500/20 group/btn">
                      <ChevronsUpDown size={12} className="group-hover/btn:scale-110 transition-transform" />
                      ÁNH XẠ
                    </button>
                    {/* Hidden select for interaction */}
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.value) {
                          insertField(activeLine.id, e.target.value);
                          e.target.value = ""; // Reset
                        }
                      }}
                    >
                      <option value="" className="bg-white text-black">-- Chọn trường --</option>
                      {columns.map(col => (
                        <option key={col} value={col} className="bg-white text-black">{col}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-px h-6 bg-white/10 mx-1" />

                  <button
                    onClick={() => duplicateLine(activeLine.id)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all"
                    title="Nhân bản"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => removeLine(activeLine.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Visual Paper */}
            <div
              ref={previewRef}
              className="bg-white rounded-2xl shadow-2xl p-6 aspect-[3/4] w-full flex flex-col justify-start border-4 border-slate-900 overflow-hidden relative cursor-text transition-all hover:ring-8 hover:ring-indigo-500/5"
              onClick={() => setActiveLineId(null)}
            >
              <div className="absolute top-0 left-0 bg-slate-900 text-[10px] text-white px-4 py-1.5 font-black uppercase tracking-widest rounded-br-2xl shadow-lg z-10">MÔ PHỎNG PAGE</div>

              <div className="w-full border-2 border-dashed border-slate-100 p-8 flex flex-col justify-center min-h-[300px] mt-4 relative">
                {lines.map((line) => (
                  <div
                    key={line.id}
                    onClick={(e) => { e.stopPropagation(); setActiveLineId(line.id); }}
                    className={`relative cursor-pointer transition-all px-2 py-0.5 rounded-sm ${activeLineId === line.id
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white bg-indigo-50/50'
                        : 'hover:bg-slate-50'
                      }`}
                    style={{
                      textAlign: line.alignment,
                      fontWeight: line.bold ? 'bold' : 'normal',
                      fontSize: `${line.fontSize}pt`,
                      lineHeight: (lineSpacing / 240).toString(),
                      color: '#1e293b',
                      fontFamily: '"Times New Roman", Times, serif'
                    }}
                  >
                    {line.text === '' ? 'Nhấn để soạn thảo...' : line.text.replace(/\{([^}]+)\}/g, (match, p1) => `[${p1}]`)}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center opacity-50">
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Preview Interface</div>
                <div className="h-1 w-24 bg-slate-100 rounded-full" />
              </div>
            </div>
          </div>

          <button
            onClick={() => onSave(lines)}
            className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:tracking-widest text-white rounded-3xl font-black text-xl shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-4 group uppercase"
          >
            TIẾP TỤC XUẤT FILE <ChevronsUpDown className="group-hover:bounce" />
          </button>
        </div>
      </div>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowSaveModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1C2128] border border-white/10 rounded-[2rem] p-10 w-full max-w-md relative z-10 shadow-2xl"
            >
              <h4 className="text-2xl font-black text-white mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500 uppercase">Lưu Mẫu Thiết Kế</h4>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Tên mẫu</label>
                  <input
                    autoFocus
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Nhãn hồ sơ v1..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-indigo-500/30 transition-all outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-xs hover:bg-white/10 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim()}
                    className="flex-1 py-4 bg-indigo-600 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                  >
                    Lưu ngay
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Rename Template Modal */}
        {editingTemplateIdx !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#1C2128] p-8 w-full max-w-md border border-white/10 rounded-[2rem] space-y-6"
            >
              <div className="flex items-center gap-3 text-indigo-400">
                <Edit2 size={24} />
                <h3 className="text-2xl font-black uppercase tracking-tight">Đổi tên mẫu</h3>
              </div>
              <input 
                autoFocus
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (updateTemplateName(editingTemplateIdx, newTplName), setEditingTemplateIdx(null))}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setEditingTemplateIdx(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black uppercase transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    updateTemplateName(editingTemplateIdx, newTplName);
                    setEditingTemplateIdx(null);
                  }}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase shadow-xl shadow-indigo-600/30 transition-all"
                >
                  Lưu tên mới
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabelDesigner;
