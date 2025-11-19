import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="w-full max-w-2xl mx-auto p-12 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border-4 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer text-center group"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        accept=".xlsx, .xls, .csv"
        onChange={handleChange}
      />
      
      <div className="flex flex-col items-center space-y-6">
        <div className="p-6 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-slate-600 transition-colors duration-300">
          {isProcessing ? (
             <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 dark:border-blue-400"></div>
          ) : (
            <FileSpreadsheet size={48} />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            {isProcessing ? 'Processing File...' : 'Upload Inventory File'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
            Click to browse or drag and drop your Excel (.xlsx) or CSV files here
          </p>
        </div>
      </div>
    </div>
  );
};
