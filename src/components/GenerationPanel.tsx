import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { wordService } from '../services/wordService';
import { FileDown, FileCheck, Loader2, Settings2, Columns, Eye, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GenerationPanel: React.FC = () => {
  const { 
    excelData, labelDesign, lineSpacing, isLoading, setLoading, setError 
  } = useAppStore();

  const [columns, setColumns] = useState(2);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-reset success state after 5 seconds to allow re-export
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => setIsSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await (wordService as any).generateFromDesign(labelDesign || [], excelData || [], 'single', columns, lineSpacing);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError("Có lỗi xảy ra khi tạo tài liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Safety Guard against empty data
  if (!excelData || excelData.length === 0) {
    return (
      <div className="glass p-12 text-center animate-fade-in">
        <p className="text-slate-400 text-lg mb-4">Chưa có dữ liệu bảng để xuất file.</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary">Quay lại bắt đầu</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in w-full max-w-7xl mx-auto pb-20">
      {/* Settings Side */}
      <div className="flex-1 space-y-6">
        <div className="glass p-8 flex flex-col gap-8 relative overflow-hidden border-indigo-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
          
          <h3 className="text-2xl font-black flex items-center gap-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            <Settings2 className="text-indigo-400" /> CÀI ĐẶT XUẤT FILE
          </h3>

          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <label className="flex items-center gap-2 text-sm font-bold text-indigo-300 mb-6 uppercase tracking-widest">
                <Columns size={16} /> Số cột trên một trang
              </label>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setColumns(num)}
                    className={`py-4 rounded-xl text-lg font-black transition-all ${
                      columns === num 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 ring-2 ring-indigo-400' 
                        : 'bg-black/40 text-slate-500 hover:text-slate-300 hover:bg-black/60'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Tổng số nhãn sẽ in</span>
                <span className="text-2xl font-black text-indigo-400">{excelData.length}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Định dạng</span>
                <span className="text-sm font-bold text-white">Word (.docx)</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-16 left-0 right-0 bg-green-500 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl z-20"
                >
                  <FileCheck size={20} /> XUẤT FILE THÀNH CÔNG!
                  <button onClick={() => setIsSuccess(false)} className="ml-auto hover:bg-white/20 p-1 rounded">
                    <RotateCcw size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              disabled={isLoading || excelData.length === 0}
              onClick={handleGenerate}
              className={`w-full py-8 text-white rounded-2xl font-black text-xl tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 group relative overflow-hidden ${
                isSuccess 
                  ? 'bg-green-600/80 hover:bg-indigo-600' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={32} /> ĐANG XỬ LÝ...
                </>
              ) : (
                <>
                  <FileDown size={32} className="group-hover:bounce" /> 
                  {isSuccess ? "BẮT ĐẦU XUẤT LẠI" : "BẮT ĐẦU TẠO FILE"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Side */}
      <div className="w-full lg:w-[450px] flex flex-col gap-4">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest pl-2">
          <Eye size={18} className="text-amber-400" /> Preview Bố Cục Trang
        </div>
        
        <div className="glass border-white/5 bg-slate-900/50 aspect-[1/1.414] w-full p-4 overflow-hidden relative group">
          <div className="w-full h-full bg-white rounded shadow-2xl relative flex flex-col p-2 gap-2 overflow-y-auto custom-scrollbar">
            <div className={`grid gap-1 w-full`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: 24 }).map((_, idx) => (
                <div key={idx} className="border-[0.5px] border-slate-200 p-1.5 flex flex-col justify-start bg-slate-50/10 min-h-[40px]">
                  {(labelDesign || []).map((line, lIdx) => (
                    <div key={lIdx} style={{ 
                      textAlign: line.alignment, 
                      fontWeight: line.bold ? 'bold' : 'normal',
                      fontSize: `${Math.max(line.fontSize / 4, 3)}px`,
                      lineHeight: (lineSpacing / 240).toFixed(1),
                      color: idx < (excelData || []).length ? '#334155' : '#cbd5e1'
                    }}>
                      {line.text.replace(/\{([^}]+)\}/g, '...') }
                    </div>
                  ))}
                  <div className="mt-1 h-0.5 w-full border-t border-dashed border-slate-200 opacity-50" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tighter shadow-sm">
              Trang 1 / {Math.ceil((excelData || []).length / (columns * 12)) || 1}
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 italic text-center px-4 leading-relaxed bg-black/20 py-3 rounded-xl border border-white/5">
          * Hình ảnh mô phỏng. Bố cục thực tế sẽ tự động giãn nở theo độ dài văn bản của bạn.
        </p>
      </div>
    </div>
  );
};

export default GenerationPanel;
