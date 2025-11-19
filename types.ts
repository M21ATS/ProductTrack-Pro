export enum ProcessingStatus {
  INCOMPLETE = 'Incomplete',
  COMPLETED = 'Completed',
}

export interface ProductRow {
  id: string;
  [key: string]: any; // Allow flexible columns from Excel
  processingStatus: ProcessingStatus;
}

export interface AnalysisResult {
  summary: string;
  recommendations: string[];
}

export interface FileSession {
  id: string;
  name: string;
  createdAt: number;
  data: ProductRow[];
}

export type Theme = 'light' | 'dark';
