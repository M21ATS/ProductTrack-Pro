import React, { useState, useMemo, useEffect } from 'react';
import { ProductRow, ProcessingStatus } from '../types';
import { StatusToggle } from './StatusToggle';
import { Search, Copy, Check, Filter, Tag, X, ChevronDown, Type, Image as ImageIcon, ChevronRight, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { ImageSearchModal } from './ImageSearchModal';

interface DataGridProps {
  data: ProductRow[];
  onUpdateStatus: (id: string, status: ProcessingStatus) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({ data, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classifyCol, setClassifyCol] = useState<string>('');
  const [userSelectedNameCol, setUserSelectedNameCol] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Image Search Modal State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchProductName, setSearchProductName] = useState('');

  // Validate data prop
  if (!data || !Array.isArray(data) || data.length === 0 || !data[0]) return null;

  // Get headers excluding internal fields
  const headers = useMemo(() => 
    Object.keys(data[0]).filter(k => k !== 'id' && k !== 'processingStatus'),
  [data]);
  
  // Robust Heuristic to identify the "Product Description/Name" column
  const detectedNameCol = useMemo(() => {
    if (headers.length === 0) return '';

    const scores = headers.map(header => {
      let score = 0;
      const lowerH = header.toLowerCase();

      if (lowerH.includes('classification data')) score += 100;
      else if (lowerH.includes('description') || lowerH.includes('desc')) score += 80;
      else if (lowerH.includes('product name') || lowerH.includes('item name')) score += 70;
      else if (lowerH === 'name') score += 60;
      else if (lowerH.includes('title')) score += 50;
      
      if (lowerH.includes('id') || lowerH.includes('code') || lowerH.includes('sku') || lowerH.includes('number') || lowerH.includes('no.')) score -= 50;
      if (lowerH.includes('price') || lowerH.includes('cost') || lowerH.includes('qty') || lowerH.includes('quantity')) score -= 100;

      let numberCount = 0;
      let shortStringCount = 0;
      let longStringCount = 0;
      let hasSpacesCount = 0;

      const sampleSize = Math.min(data.length, 5);
      for (let i = 0; i < sampleSize; i++) {
        const val = data[i][header];
        
        if (typeof val === 'number') {
          numberCount++;
        } else if (typeof val === 'string') {
          if (/^\d+$/.test(val.trim())) {
            numberCount++;
          } else {
             if (val.length < 3) shortStringCount++;
             if (val.length > 5) longStringCount++;
             if (val.includes(' ')) hasSpacesCount++;
          }
        }
      }

      if (numberCount > sampleSize * 0.6) score -= 200;
      if (hasSpacesCount > 0) score += 50; 
      if (longStringCount > 0) score += 30;

      return { header, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].header;
  }, [headers, data]);

  const nameColumn = userSelectedNameCol || detectedNameCol;

  // Heuristic to set a default classification column
  useEffect(() => {
    if (headers.includes(classifyCol)) return;

    if (headers.length > 0) {
      const candidate = headers.find(h => /unit|measure|packaging|material|type|cat|group|classification code/i.test(h));
      if (candidate) setClassifyCol(candidate);
      else setClassifyCol('');
    }
  }, [headers, classifyCol]);

  // Generate classification tags
  const tags = useMemo(() => {
    if (!classifyCol) return [];
    const counts = new Map<string, number>();
    
    data.forEach(row => {
        const rawVal = row[classifyCol];
        const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : 'N/A';
        if (val) {
          counts.set(val, (counts.get(val) || 0) + 1);
        }
    });

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count }));
  }, [data, classifyCol]);

  // Filter data
  const filteredData = data.filter(row => {
    const matchesSearch = Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    let matchesTag = true;
    if (activeTag) {
      const rawVal = row[classifyCol];
      const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : 'N/A';
      matchesTag = val === activeTag;
    }

    return matchesSearch && matchesTag;
  });

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(err => console.error('Failed to copy:', err));
    } else {
       setCopiedId(id);
       setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleImageSearch = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchProductName(name);
    setIsSearchModalOpen(true);
  };

  return (
    <>
      <ImageSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        productName={searchProductName} 
      />
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full transition-colors duration-300">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-4 bg-white dark:bg-slate-800 rounded-t-xl">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            
            {/* Search */}
            <div className="relative w-full xl:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Settings Group */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              
              {/* Name Column Selector */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700 flex-1 sm:flex-none">
                <div className="flex items-center gap-2 px-2 text-slate-600 dark:text-slate-400" title="Select the column containing the Product Description">
                  <Type size={16} />
                  <span className="text-sm font-medium whitespace-nowrap">Name Col:</span>
                </div>
                <div className="relative flex-1 sm:w-40">
                  <select 
                    value={nameColumn}
                    onChange={(e) => setUserSelectedNameCol(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>

              {/* Classification Selector */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700 flex-1 sm:flex-none">
                <div className="flex items-center gap-2 px-2 text-slate-600 dark:text-slate-400" title="Select column to group by">
                  <Filter size={16} />
                  <span className="text-sm font-medium whitespace-nowrap">Group by:</span>
                </div>
                <div className="relative flex-1 sm:w-40">
                  <select 
                    value={classifyCol}
                    onChange={(e) => {
                      setClassifyCol(e.target.value);
                      setActiveTag(null);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="" disabled>Select Group</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>

            </div>
          </div>

          {/* Classification Chips */}
          {classifyCol && tags.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mask-linear-fade">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2 flex-shrink-0">
                  {classifyCol}
                </span>
                
                {activeTag && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors shadow-sm"
                  >
                    <X size={12} strokeWidth={3} />
                    <span>All</span>
                  </button>
                )}
                
                {tags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={clsx(
                      "flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                      activeTag === tag
                        ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm"
                    )}
                  >
                    <span>{tag}</span>
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded-full text-[10px] min-w-[1.25rem] text-center",
                      activeTag === tag ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300"
                    )}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto flex-grow custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                <th className="px-6 py-4 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 w-32">
                  Status
                </th>
                <th className="px-6 py-4 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
                   Product Name
                </th>
                <th className="px-6 py-4 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 w-32 text-right">
                   Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {filteredData.map((row) => {
                const isExpanded = expandedRows[row.id];
                const productName = row[nameColumn];
                
                return (
                  <React.Fragment key={row.id}>
                    <tr 
                      onClick={() => toggleExpand(row.id)}
                      className={clsx(
                        "hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group",
                        isExpanded && "bg-blue-50/20 dark:bg-blue-900/5"
                      )}
                    >
                      {/* Status Column */}
                      <td className="px-6 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <StatusToggle 
                          status={row.processingStatus} 
                          onChange={(newStatus) => onUpdateStatus(row.id, newStatus)}
                        />
                      </td>

                      {/* Product Name Column */}
                      <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900 dark:text-white break-all max-w-xl">
                            {productName || <span className="text-slate-400 italic">No Name</span>}
                          </span>
                          
                          {/* Actions */}
                          {productName && (
                            <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                               {/* Image Search */}
                               <button
                                onClick={(e) => handleImageSearch(String(productName), e)}
                                className="flex items-center justify-center p-1.5 rounded-md text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm transition-all"
                                title="Search Image"
                              >
                                <ImageIcon size={14} />
                              </button>

                              {/* Copy Button */}
                              <button
                                onClick={(e) => handleCopy(String(productName), row.id, e)}
                                className={clsx(
                                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 border shadow-sm",
                                  copiedId === row.id 
                                    ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                                    : "text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                )}
                              >
                                {copiedId === row.id ? <Check size={12} /> : <Copy size={12} />}
                                <span className="hidden sm:inline">{copiedId === row.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Show Details Button */}
                      <td className="px-6 py-3 text-right">
                        <button className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50 dark:bg-slate-900/30 animate-in slide-in-from-top-2 duration-200">
                        <td colSpan={3} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                             {headers.filter(h => h !== nameColumn).map(header => (
                               <div key={header} className="flex flex-col">
                                 <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                                   {header}
                                 </span>
                                 <span className="text-sm text-slate-700 dark:text-slate-200 font-medium break-words">
                                   {row[header] !== undefined && row[header] !== null && row[header] !== '' ? row[header] : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                 </span>
                               </div>
                             ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button 
                              onClick={() => toggleExpand(row.id)}
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Close details
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-24 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                        <Tag className="text-slate-300 dark:text-slate-600" size={32} />
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No products found</p>
                      <p className="text-sm">Adjust your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2 rounded-b-xl">
          <div className="flex items-center gap-4">
            <span>Total <strong>{data.length}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>Filtered <strong>{filteredData.length}</strong></span>
          </div>
          {activeTag && (
             <div className="flex items-center gap-2">
               <Filter size={12} />
               <span>Group: <strong>{activeTag}</strong></span>
             </div>
          )}
        </div>
      </div>
    </>
  );
};