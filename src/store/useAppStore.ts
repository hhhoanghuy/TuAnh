import { create } from 'zustand';
import { LabelLine } from '../components/LabelDesigner';

export interface LabelTemplate {
  name: string;
  lines: LabelLine[];
  lineSpacing: number;
}

export type SourceMode = 'excel' | 'image' | null;

export interface AppState {
  // Data
  excelData: any[];
  excelColumns: string[];
  labelDesign: LabelLine[];
  lineSpacing: number; 
  useCustomDesign: boolean;
  
  // Source Selection
  sourceMode: SourceMode;
  imageFiles: File[];
  isScanning: boolean;
  scanStatus: string;

  // Templates
  savedTemplates: LabelTemplate[];
  
  // Security & Files
  apiKey: string;
  excelFile: File | null;
  
  // Global State
  currentStep: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSourceMode: (mode: SourceMode) => void;
  setImageFiles: (files: File[]) => void;
  setScanning: (scanning: boolean, status?: string) => void;
  setExcelData: (data: any[], columns: string[]) => void;
  setLabelDesign: (design: LabelLine[]) => void;
  setLineSpacing: (spacing: number) => void;
  setUseCustomDesign: (use: boolean) => void;
  saveTemplate: (name: string) => void;
  deleteTemplate: (index: number) => void;
  updateTemplateName: (index: number, name: string) => void;
  loadTemplate: (template: LabelTemplate) => void;
  setExcelFile: (file: File | null) => void;
  setStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  removeColumn: (column: string) => void;
  renameColumn: (oldName: string, newName: string) => void;
  addColumn: (name: string) => void;
  reset: () => void;
  
  // Legacy cleanup
  setApiKey: (key: string) => void;
}

const getStoredTemplates = (): LabelTemplate[] => {
  const stored = localStorage.getItem('label_templates');
  return stored ? JSON.parse(stored) : [
    {
      name: "Mẫu Hồ Sơ Cơ Bản",
      lineSpacing: 240,
      lines: [
        { id: '1', text: 'UBND HUYỆN ĐÔNG ANH', bold: true, fontSize: 11, alignment: 'center' },
        { id: '2', text: 'VĂN PHÒNG', bold: true, fontSize: 11, alignment: 'center' },
        { id: '3', text: 'Quy hoạch chi tiết tỷ lệ 1/500', bold: true, fontSize: 14, alignment: 'center' },
        { id: '4', text: '{Tên dự án}', bold: false, fontSize: 11, alignment: 'center' },
        { id: '5', text: '(NGÀY 08/7)', bold: true, fontSize: 11, alignment: 'center' },
      ]
    },
    {
      name: "Mẫu Nhãn Gọn Nhẹ",
      lineSpacing: 180,
      lines: [
        { id: 'L1', text: '{Tên dự án}', bold: true, fontSize: 12, alignment: 'left' },
        { id: 'L2', text: 'Số: {Số hiệu}', bold: false, fontSize: 10, alignment: 'left' },
      ]
    }
  ];
};

export const useAppStore = create<AppState>((set, get) => ({
  excelData: [],
  excelColumns: [],
  labelDesign: [],
  lineSpacing: 240,
  useCustomDesign: false,
  
  sourceMode: null,
  imageFiles: [],
  isScanning: false,
  scanStatus: '',

  savedTemplates: getStoredTemplates(),
  // Read API Key from VITE env variable with type safety bypass for TS
  apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || '',
  excelFile: null,
  currentStep: 0,
  isLoading: false,
  error: null,

  setSourceMode: (mode) => set({ sourceMode: mode }),
  setImageFiles: (files) => set({ imageFiles: files }),
  setScanning: (isScanning, scanStatus = '') => set({ isScanning, scanStatus }),
  setExcelData: (data, columns) => set({ excelData: data, excelColumns: columns }),
  setLabelDesign: (design) => set({ labelDesign: design }),
  setLineSpacing: (spacing) => set({ lineSpacing: spacing }),
  setUseCustomDesign: (use) => set({ useCustomDesign: use }),
  
  saveTemplate: (name: string) => set((state) => ({
    savedTemplates: [...state.savedTemplates, { 
      name, 
      lines: JSON.parse(JSON.stringify(state.labelDesign)), // Deep clone
      lineSpacing: state.lineSpacing 
    }]
  })),
  deleteTemplate: (index: number) => set((state) => ({
    savedTemplates: state.savedTemplates.filter((_, i) => i !== index)
  })),
  updateTemplateName: (index: number, name: string) => set((state) => ({
    savedTemplates: state.savedTemplates.map((tpl, i) => i === index ? { ...tpl, name } : tpl)
  })),
  loadTemplate: (template: LabelTemplate) => set({ 
    labelDesign: [...template.lines], 
    lineSpacing: template.lineSpacing 
  }),

  setExcelFile: (file) => set({ excelFile: file }),
  setApiKey: (key) => set({ apiKey: key }),
  setStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  removeColumn: (column: string) => set((state) => ({
    excelColumns: state.excelColumns.filter(c => c !== column),
    excelData: state.excelData.map(row => {
      const newRow = { ...row };
      delete newRow[column];
      return newRow;
    })
  })),
  renameColumn: (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    set((state) => ({
      excelColumns: state.excelColumns.map(c => c === oldName ? newName : c),
      excelData: state.excelData.map(row => {
        const newRow = { ...row };
        newRow[newName] = newRow[oldName];
        delete newRow[oldName];
        return newRow;
      })
    }));
  },
  addColumn: (name: string) => {
    if (!name || get().excelColumns.includes(name)) return;
    set((state) => ({
      excelColumns: [...state.excelColumns, name],
      excelData: state.excelData.map(row => ({
        ...row,
        [name]: ''
      }))
    }));
  },
  reset: () => set({
    excelData: [],
    excelColumns: [],
    excelFile: null,
    imageFiles: [],
    sourceMode: null,
    currentStep: 0,
    error: null,
    isScanning: false,
    scanStatus: ''
  }),
}));
