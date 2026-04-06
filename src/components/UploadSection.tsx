import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/useAppStore';
import { excelService } from '../services/excelService';
import { aiService } from '../services/aiService';
import { FileSpreadsheet, Image as ImageIcon, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Zap, Layers, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const UploadSection: React.FC = () => {
  const { 
    setExcelData, setExcelFile, setImageFiles,
    setStep, setLoading, setScanning, 
    sourceMode, setSourceMode,
    isLoading, isScanning, scanStatus, setError,
    excelFile, imageFiles, apiKey
  } = useAppStore();

  const onDropExcel = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const data = await excelService.parseFile(file);
      const cols = excelService.getColumns(data);
      setExcelData(data, cols);
      setExcelFile(file);
      setError(null);
    } catch (err) {
      setError("Không thể đọc file Excel. Vui lòng kiểm tra định dạng.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDropImages = useCallback((acceptedFiles: File[]) => {
    setImageFiles([...(imageFiles || []), ...acceptedFiles]);
  }, [imageFiles]);

  const handleAiScan = async () => {
    if ((imageFiles || []).length === 0) return;
    try {
      const { data } = await aiService.extractTableFromImages(
        imageFiles, 
        apiKey, 
        (model) => setScanning(true, `Đang quét bằng ${model.toUpperCase()}...`)
      );
      
      if (data && data.length > 0) {
        const cols = Object.keys(data[0]);
        setExcelData(data, cols);
        setStep(1); // Move to DataTable
      } else {
        setError("AI không tìm thấy dữ liệu bảng trong ảnh.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi AI OCR.");
    } finally {
      setScanning(false, "");
    }
  };

  const { getRootProps: getExcelProps, getInputProps: getExcelInput } = useDropzone({
    onDrop: onDropExcel,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false
  });

  const { getRootProps: getImageProps, getInputProps: getImageInput } = useDropzone({
    onDrop: onDropImages,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }
  });

  if (!sourceMode) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
        <h2 className="text-3xl font-black text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 uppercase tracking-widest">
          Bạn muốn nhập dữ liệu từ đâu?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setSourceMode('excel')}
            className="glass p-10 flex flex-col items-center justify-center cursor-pointer border-indigo-500/10 hover:border-indigo-500/50 hover:bg-indigo-600/5 transition-all group"
          >
            <div className="p-8 bg-indigo-600/10 rounded-[2.5rem] mb-6 group-hover:bg-indigo-600/20 transition-all">
              <FileSpreadsheet className="text-indigo-400 group-hover:scale-110 transition-transform" size={72} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Nhập từ Excel</h3>
            <p className="text-slate-500 text-center text-sm">Sử dụng file .xlsx có sẵn của bạn</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setSourceMode('image')}
            className="glass p-10 flex flex-col items-center justify-center cursor-pointer border-amber-500/10 hover:border-amber-500/50 hover:bg-amber-600/5 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded-full animate-pulse shadow-lg">AI POWERED</div>
            <div className="p-8 bg-amber-600/10 rounded-[2.5rem] mb-6 group-hover:bg-amber-600/20 transition-all">
              <ImageIcon className="text-amber-400 group-hover:scale-110 transition-transform" size={72} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Quét từ Ảnh</h3>
            <p className="text-slate-500 text-center text-sm">Chụp ảnh tài liệu, AI sẽ tự bóc tách</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 py-8 px-4">
      <button 
        onClick={() => setSourceMode(null)}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Quay lại chọn nguồn
      </button>

      {sourceMode === 'excel' ? (
        <div className="space-y-8">
          <div 
            {...getExcelProps()} 
            className={`glass min-h-[400px] flex flex-col items-center justify-center p-8 border-4 border-dashed transition-all cursor-pointer group relative ${
              excelFile ? 'border-green-500/40 bg-green-500/5' : 'border-indigo-500/10 hover:border-indigo-500/40'
            }`}
          >
            <input {...getExcelInput()} />
            <div className={`p-8 rounded-[2.5rem] mb-6 shadow-2xl transition-all ${excelFile ? 'bg-green-600/20' : 'bg-indigo-600/10 group-hover:scale-110'}`}>
              <FileSpreadsheet className={excelFile ? 'text-green-400' : 'text-indigo-400'} size={80} />
            </div>
            <h3 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">Kéo thả File Excel</h3>
            <p className="text-slate-500 text-center text-sm max-w-[300px]">Chỉ hỗ trợ định dạng .xlsx tiêu chuẩn</p>
            
            {excelFile && (
              <div className="mt-8 flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl animate-scale-in">
                <CheckCircle2 className="text-green-400" size={20} />
                <span className="text-green-300 font-bold">{excelFile.name}</span>
              </div>
            )}
          </div>

          {excelFile && (
            <button
              onClick={() => setStep(1)}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-4 group"
            >
              XEM DỮ LIỆU EXCEL <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div 
            {...getImageProps()} 
            className="glass min-h-[400px] flex flex-col items-center justify-center p-8 border-4 border-dashed border-amber-500/10 hover:border-amber-500/40 transition-all cursor-pointer group relative"
          >
            <input {...getImageInput()} />
            {(imageFiles || []).length === 0 ? (
              <>
                <div className="p-8 bg-amber-600/10 rounded-[2.5rem] mb-6 group-hover:scale-110 transition-all">
                  <ImageIcon className="text-amber-400" size={80} />
                </div>
                <h3 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">Chọn Ảnh Tài Liệu</h3>
                <p className="text-slate-500 text-center text-sm max-w-[300px]">Có thể chọn nhiều ảnh cùng lúc</p>
              </>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 w-full">
                {(imageFiles || []).map((file, i) => (
                  <div key={i} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 group/img">
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <Layers size={20} className="text-white" />
                    </div>
                  </div>
                ))}
                <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                  <Plus size={24} className="text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-bold mt-1">THÊM ẢNH</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
             {!apiKey && (
               <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
                 <p className="text-red-400 text-xs font-black uppercase mb-1">Cảnh báo: Thiếu API Key</p>
                 <p className="text-slate-500 text-[10px]">Vui lòng cài đặt VITE_GEMINI_API_KEY trong file .env</p>
               </div>
             )}
             
            <button
              disabled={(imageFiles || []).length === 0 || isLoading || isScanning || !apiKey}
              onClick={handleAiScan}
              className="w-full py-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-amber-500/30 disabled:opacity-30 text-white rounded-[2rem] font-black text-xl shadow-2xl transition-all flex flex-col items-center justify-center gap-2 group"
            >
              {(isLoading || isScanning) ? (
                <>
                  <div className="flex items-center gap-4">
                    <Loader2 className="animate-spin" size={28} /> 
                    <span>{scanStatus || "ĐANG PHÂN TÍCH..."}</span>
                  </div>
                  <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest animate-pulse">
                    AI đang bóc tách bảng dữ liệu...
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Zap size={28} className="fill-white" /> BẮT ĐẦU QUÉT AI
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
