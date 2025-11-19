import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { searchProductImages } from '../services/ai';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({ isOpen, onClose, productName }) => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && productName) {
      handleSearch();
    } else {
      // Reset state when closed
      setImages([]);
      setError(null);
      setSelectedImage(null);
    }
  }, [isOpen, productName]);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchProductImages(productName);
      if (results.length === 0) {
        setError("No specific images found. Try checking the Google Images tab.");
      }
      setImages(results);
    } catch (err) {
      setError("Failed to search for images.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      // Try to guess extension or default to jpg
      const ext = url.split('.').pop()?.split(/[?#]/)[0] || 'jpg';
      link.download = `${productName.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback for CORS issues
      window.open(url, '_blank');
    }
  };

  const openGoogleImages = () => {
    const query = encodeURIComponent(productName);
    window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon size={20} className="text-blue-600 dark:text-blue-400" />
              Image Search
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">
              Results for: <span className="font-medium text-slate-700 dark:text-slate-300">{productName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-100 dark:bg-slate-950">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-slate-500 dark:text-slate-400">Searching Google for images...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
              <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">{error}</p>
                <p className="text-sm text-slate-500">Try the direct link below instead.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((url, idx) => (
                <div 
                  key={idx}
                  className={`group relative aspect-square bg-white dark:bg-slate-800 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === url ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}
                  onClick={() => setSelectedImage(url)}
                >
                  <img 
                    src={url} 
                    alt={`Result ${idx + 1}`}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.classList.add('hidden');
                    }}
                  />
                  
                  {/* Overlay on Hover / Selection */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-200 ${selectedImage === url ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(url);
                      }}
                      className="p-2 bg-white text-slate-900 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-lg"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(url, '_blank');
                      }}
                      className="p-2 bg-white text-slate-900 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-lg"
                      title="Open Original"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback / External Link */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={openGoogleImages}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium"
            >
              <ExternalLink size={16} />
              View more results on Google Images
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};