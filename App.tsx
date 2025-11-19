import React, { useState, useCallback, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { DataGrid } from './components/DataGrid';
import { AnalysisPanel } from './components/AnalysisPanel';
import { parseExcelFile } from './services/excel';
import { ProductRow, ProcessingStatus, FileSession, Theme } from './types';
import { LayoutGrid, Moon, Sun, FileText, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('productTrack_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Data State
  const [files, setFiles] = useState<FileSession[]>(() => {
    try {
      const saved = localStorage.getItem('productTrack_files');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      
      // Robust validation to prevent crashes if storage is corrupted
      if (!Array.isArray(parsed)) return [];
      
      return parsed.map((f: any) => ({
        ...f,
        // Ensure data is always an array
        data: Array.isArray(f.data) ? f.data : [],
        // Ensure id and name exist
        id: f.id || `file-${Date.now()}-${Math.random()}`,
        name: f.name || 'Untitled'
      }));
    } catch (e) {
      console.error("Failed to load data from storage", e);
      return [];
    }
  });
  
  const [activeFileId, setActiveFileId] = useState<string | null>(
    files.length > 0 ? files[0].id : null
  );
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived State
  const activeFile = files.find(f => f.id === activeFileId);

  // Persist Theme
  useEffect(() => {
    localStorage.setItem('productTrack_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persist Files
  useEffect(() => {
    try {
      // Basic persistence - caution with large files in localStorage
      localStorage.setItem('productTrack_files', JSON.stringify(files));
    } catch (e) {
      console.error("Storage limit exceeded", e);
      setError("Warning: Data is too large to autosave. Export to keep your changes.");
    }
  }, [files]);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const rows = await parseExcelFile(file);
      
      const newSession: FileSession = {
        id: `file-${Date.now()}`,
        name: file.name,
        createdAt: Date.now(),
        data: rows
      };

      setFiles(prev => [...prev, newSession]);
      setActiveFileId(newSession.id);
    } catch (err) {
      setError("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleUpdateStatus = useCallback((id: string, newStatus: ProcessingStatus) => {
    if (!activeFileId) return;

    setFiles(prev => prev.map(file => {
      if (file.id !== activeFileId) return file;
      // Extra safety check for file.data
      const currentData = Array.isArray(file.data) ? file.data : [];
      return {
        ...file,
        data: currentData.map(row => row.id === id ? { ...row, processingStatus: newStatus } : row)
      };
    }));
  }, [activeFileId]);

  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    // Crucial: stop event from bubbling to the parent div which selects the file
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      setFiles(prev => {
        const newFiles = prev.filter(f => f.id !== fileId);
        return newFiles;
      });
      
      if (activeFileId === fileId) {
        setActiveFileId(null);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(curr => curr === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 h-16 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <LayoutGrid size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">
              ProductTrack Pro
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (File Tabs) */}
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Active Files
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {files.map(file => (
              <div 
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={clsx(
                  "group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 border",
                  activeFileId === file.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-sm"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                <div className="flex items-center min-w-0">
                  <FileText size={18} className={clsx(
                    "mr-3 flex-shrink-0",
                    activeFileId === file.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                  )} />
                  <div className="truncate">
                    <div className={clsx(
                      "text-sm font-medium truncate",
                      activeFileId === file.id ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {file.data?.length || 0} items
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleDeleteFile(e, file.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all focus:opacity-100"
                  title="Delete file"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {files.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm px-4">
                No files loaded. Upload a file to get started.
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <button 
              onClick={() => setActiveFileId(null)} // Null ID triggers upload view
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
                !activeFileId 
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <Plus size={16} />
              <span>New Upload</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center">
                <span className="font-semibold mr-2">Error:</span> {error}
              </div>
            )}

            {!activeFile ? (
              // Upload View
              <div className="mt-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8 max-w-md">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Import your inventory</h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Upload an Excel or CSV file. Your data will be automatically saved locally.
                  </p>
                </div>
                <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
              </div>
            ) : (
              // Data View
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{activeFile.name}</h2>
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    Uploaded {new Date(activeFile.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Stats Row */}
                {activeFile.data && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Items</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeFile.data.length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="text-amber-600 dark:text-amber-500 text-sm font-medium mb-1">Incomplete</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {activeFile.data.filter(r => r.processingStatus === ProcessingStatus.INCOMPLETE).length}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="text-green-600 dark:text-green-500 text-sm font-medium mb-1">Completed</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {activeFile.data.filter(r => r.processingStatus === ProcessingStatus.COMPLETED).length}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Analysis Section */}
                {activeFile.data && <AnalysisPanel data={activeFile.data} />}

                {/* Main Grid */}
                {activeFile.data && <DataGrid data={activeFile.data} onUpdateStatus={handleUpdateStatus} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}