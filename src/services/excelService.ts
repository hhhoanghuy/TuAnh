import * as XLSX from 'xlsx';

export interface ExcelRow {
  [key: string]: string | number;
}

export const excelService = {
  /**
   * Parse an Excel file and return a JSON array of rows.
   * Normalizes keys by trimming and converting to uppercase.
   */
  async parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          // --- SMART SPLIT LOGIC ---
          // Analyze data and add virtual columns for ranges, e.g. "01-05"
          const processedData = jsonData.map((row: any) => {
            const newRow: any = { ...row };
            Object.keys(row).forEach(key => {
              const val = String(row[key] || '').trim();
              // Regex matches "01-05", "112 - 113", etc.
              const rangeMatch = val.match(/^(\d+)\s*[-_]\s*(\d+)$/);
              if (rangeMatch) {
                // Avoid using parentheses () as docxtemplater will treat them as function calls!
                newRow[`${key}_Từ`] = rangeMatch[1];
                newRow[`${key}_Đến`] = rangeMatch[2];
              }
            });
            return newRow;
          });
          
          resolve(processedData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Extract columns from parsed data
   */
  getColumns(data: any[]): string[] {
    if (!data || data.length === 0) return [];
    
    // We want the columns in a predictable order, and virtual columns after their parent
    const baseCols = new Set<string>();
    const virtualCols = new Set<string>();
    
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key.endsWith('_Từ') || key.endsWith('_Đến')) {
          virtualCols.add(key);
        } else {
          baseCols.add(key);
        }
      });
    });
    
    return [...Array.from(baseCols), ...Array.from(virtualCols)];
  }
};
