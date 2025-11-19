import * as XLSX from 'xlsx';
import { ProcessingStatus, ProductRow } from '../types';

export const parseExcelFile = (file: File): Promise<ProductRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        // Transform to ProductRow
        const processedData: ProductRow[] = jsonData.map((row, index) => ({
          ...row,
          id: `row-${Date.now()}-${index}`,
          processingStatus: ProcessingStatus.INCOMPLETE, // Default status
        }));

        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
