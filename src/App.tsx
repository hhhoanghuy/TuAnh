import React from 'react';
import { useAppStore } from './store/useAppStore';
import {
  Table as TableIcon,
  Paintbrush,
  FileDown,
  ChevronRight,
  Settings,
  AlertCircle,
  ImageIcon,
  Upload
} from 'lucide-react';
import UploadSection from './components/UploadSection';
import DataTable from './components/DataTable';
import { LabelDesigner } from './components/LabelDesigner';
import GenerationPanel from './components/GenerationPanel';
import { AnimatePresence, motion } from 'framer-motion';

const steps = [
  { id: 0, name: 'Nhập Dữ Liệu', icon: Upload },
  { id: 1, name: 'Dữ Liệu', icon: TableIcon },
  { id: 2, name: 'Thiết Kế', icon: Paintbrush },
  { id: 3, name: 'Xuất File', icon: FileDown },
];

function App() {
  const { currentStep, setStep, error, setError, excelColumns, setLabelDesign, labelDesign } = useAppStore();

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <UploadSection />;
      case 1: return <DataTable />;
      case 2: return (
        <LabelDesigner
          columns={excelColumns}
          onSave={(design) => {
            setLabelDesign(design);
            setStep(3);
          }}
          initialLines={labelDesign}
        />
      );
      case 3: return <GenerationPanel />;
      default: return null;
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar flex flex-col gap-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/10 border border-white/5">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="text-indigo-500 font-black text-xl italic">TA</div>';
              }}
            />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase italic">Tú Anh Xinh Gái</h1>
        </div>

        <nav className="flex flex-col gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id;

            return (
              <button
                key={step.id}
                onClick={() => isPast && setStep(step.id)}
                className={`btn flex items-center justify-between w-full text-left px-4 py-3 rounded-lg transition-all ${isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                  : isPast
                    ? 'text-slate-400 hover:bg-white/5'
                    : 'text-slate-600 cursor-not-allowed'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span>{step.name}</span>
                </div>
                {isPast && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 glass rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Settings size={14} />
            <span>Trạng thái</span>
          </div>
          <div className="text-xs text-slate-500">
            Hệ thống: Sẵn sàng
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white">{steps[currentStep].name}</h2>
            <p className="text-slate-400 mt-1">Hoàn thành bước này để sang bước tiếp theo.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">Bước {currentStep + 1} / 4</div>
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-100 animate-fade-in shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <AlertCircle size={20} className="text-red-400" />
            <div className="flex-1 text-sm">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
