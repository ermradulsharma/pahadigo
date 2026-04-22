'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Download, Columns, CheckSquare, Square, ChevronRight } from 'lucide-react';

export default function CyberTable({
  data = [],
  columns = [],
  itemsPerPage = 10,
  searchable = true,
  searchTerm = null,      // Allow passing external search
  searchPlaceholder = "Scan records...",
  searchKeys = [],
  emptyText = "NULL OUTPUT: No nodes found in current vector.",
  loading = false,
  loadingText = "Decrypting Data Stream...",
  sortable = true,
  selectable = true,
  onSelectionChange = null,
  exportable = true,
  exportFilename = "system_export",
  columnVisibility = true,
  expandable = true,
  renderExpandableRow = null,
  bulkActions = null,
  // External Pagination Support
  totalItems = null,
  externalCurrentPage = null,
  onPageChange = null
}) {
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = searchTerm !== null ? searchTerm : internalSearch;
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = externalCurrentPage !== null ? externalCurrentPage : internalPage;

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [hiddenColIndices, setHiddenColIndices] = useState(new Set());
  const [showColPicker, setShowColPicker] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Sync internal page if needed
  useEffect(() => {
    if (externalCurrentPage === null) setInternalPage(1);
  }, [searchQuery, externalCurrentPage]);

  const itemsCount = totalItems !== null ? totalItems : data.length;

  useEffect(() => {
    if (onSelectionChange) {
      const selectedData = data.filter((_, i) => selectedRows.has(i));
      onSelectionChange(selectedData);
    }
  }, [selectedRows, data, onSelectionChange]);

  // 1. Search & Filter (Only if client-side)
  const filteredData = useMemo(() => {
    // If we have totalItems, we assume filtering is done server-side
    if (totalItems !== null) return data.map((item, index) => ({ item, originalIndex: index }));

    if (!searchQuery) return data.map((item, index) => ({ item, originalIndex: index }));
    const lowerQuery = searchQuery.toLowerCase();

    return data.map((item, index) => ({ item, originalIndex: index })).filter(({ item }) => {
      return searchKeys.some(key => {
        const keys = key.split('.');
        let val = item;
        for (const k of keys) {
          if (val == null) break;
          val = val[k];
        }
        return String(val || '').toLowerCase().includes(lowerQuery);
      });
    });
  }, [data, searchQuery, searchKeys, totalItems]);

  // 2. Sort
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortable && sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const col = columns[sortConfig.key];
        const key = col.accessor || col.header;
        let aVal = a.item[col.accessor];
        let bVal = b.item[col.accessor];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig, columns, sortable]);

  // 3. Paginate
  const totalPages = Math.ceil(itemsCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // If totalItems is provided, we don't slice (assume it's already a page)
  const currentData = totalItems !== null ? sortedData : sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handlePageChange = (newPage) => {
    if (onPageChange) onPageChange(newPage);
    else setInternalPage(newPage);

    // Scroll to top of table if needed
    const tableElement = document.getElementById('cyber-table-container');
    if (tableElement) tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSort = (colIndex) => {
    if (!sortable) return;
    let direction = 'asc';
    if (sortConfig.key === colIndex && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key: colIndex, direction });
  };

  const toggleSelection = (originalIndex) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(originalIndex)) newSet.delete(originalIndex);
    else newSet.add(originalIndex);
    setSelectedRows(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === currentData.length && currentData.length > 0) {
      const newSet = new Set(selectedRows);
      currentData.forEach(({ originalIndex }) => newSet.delete(originalIndex));
      setSelectedRows(newSet);
    } else {
      const newSet = new Set(selectedRows);
      currentData.forEach(({ originalIndex }) => newSet.add(originalIndex));
      setSelectedRows(newSet);
    }
  };

  const isAllSelected = currentData.length > 0 && currentData.every(({ originalIndex }) => selectedRows.has(originalIndex));

  const toggleExpanded = (originalIndex) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(originalIndex)) newSet.delete(originalIndex);
    else newSet.add(originalIndex);
    setExpandedRows(newSet);
  };

  const toggleColumnVisibility = (colIndex) => {
    const newSet = new Set(hiddenColIndices);
    if (newSet.has(colIndex)) newSet.delete(colIndex);
    else newSet.add(colIndex);
    setHiddenColIndices(newSet);
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    const visibleCols = columns.filter((_, i) => !hiddenColIndices.has(i));
    const headers = visibleCols.map(c => c.header).join(',');
    const dataToExport = selectedRows.size > 0 ? data.filter((_, i) => selectedRows.has(i)) : filteredData.map(d => d.item);
    const rows = dataToExport.map(row => {
      return visibleCols.map(col => {
        let cellData = col.accessor ? row[col.accessor] : '';
        return `"${String(cellData || '').replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exportFilename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCols = columns.filter((_, i) => !hiddenColIndices.has(i));

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {selectable && selectedRows.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                {selectedRows.size} Selected
              </span>
              {bulkActions && bulkActions(Array.from(selectedRows).map(idx => data[idx]))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {searchable && searchTerm === null && (
            <div className="relative group w-full md:w-auto flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input type="text" placeholder={searchPlaceholder} className="w-full md:w-64 bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={internalSearch} onChange={(e) => setInternalSearch(e.target.value)} />
            </div>
          )}
          {columnVisibility && (
            <div className="relative">
              <button onClick={() => setShowColPicker(!showColPicker)} className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0c] border border-white/10 hover:border-indigo-500/50 rounded-lg text-slate-400 hover:text-indigo-300 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] text-sm font-mono">
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Columns</span>
              </button>
              {showColPicker && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-xl">
                  <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Toggle Fields</span>
                  </div>
                  <div className="p-2 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {columns.map((col, idx) => (
                      <label key={idx} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer group">
                        <input type="checkbox" className="accent-indigo-500 opacity-60 group-hover:opacity-100" checked={!hiddenColIndices.has(idx)} onChange={() => toggleColumnVisibility(idx)} />
                        <span className="text-xs text-slate-300 font-mono tracking-wide">{col.header}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {exportable && (
            <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)] text-sm font-mono" title="Export to CSV">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#0a0a0c]/80 backdrop-blur-xl rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden relative">

        {loading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0c]/80 backdrop-blur-sm">
            <div className="relative w-12 h-12 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500 animate-spin-reverse opacity-70"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
            </div>
            <div className="text-[10px] font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">{loadingText}</div>
          </div>
        ) : null}

        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/40 border-b border-white/5 text-slate-400 uppercase text-[10px] font-mono tracking-widest transition-colors">
              <tr>
                {selectable && (
                  <th className="p-4 w-12 text-center border-r border-white/5">
                    <button onClick={toggleAllSelection} className="text-slate-500 hover:text-indigo-400 transition-colors">
                      {isAllSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                )}
                {expandable && renderExpandableRow && (
                  <th className="p-4 w-10 text-center"></th>
                )}
                {columns.map((col, idx) => {
                  if (hiddenColIndices.has(idx)) return null;
                  const isSorted = sortConfig.key === idx;
                  return (
                    <th key={idx} className={`p-4 font-semibold ${col.className || ''} ${sortable && col.accessor ? 'cursor-pointer hover:bg-white/5 hover:text-indigo-300' : ''} transition-colors select-none`} onClick={() => col.accessor && handleSort(idx)}>
                      <div className={`flex items-center gap-2 ${col.headerClassName || ''}`}>
                        {col.header}
                        {sortable && col.accessor && (
                          <div className={`flex flex-col opacity-50 ${isSorted ? 'text-indigo-400 opacity-100' : ''}`}>
                            {(!isSorted || sortConfig.direction === 'asc') && <ChevronUp className="w-3 h-3 -mb-1" />}
                            {(!isSorted || sortConfig.direction === 'desc') && <ChevronDown className="w-3 h-3" />}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentData.length > 0 ? (
                currentData.map(({ item, originalIndex }) => {
                  const isSelected = selectedRows.has(originalIndex);
                  const isExpanded = expandedRows.has(originalIndex);
                  return (
                    <React.Fragment key={item._id || originalIndex}>
                      <tr className={`hover:bg-white/[0.04] transition-colors group ${isSelected ? 'bg-indigo-500/5' : ''}`}>

                        {/* Selectable Checkbox */}
                        {selectable && (
                          <td className="p-3 text-center border-r border-white/5">
                            <button onClick={() => toggleSelection(originalIndex)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                              {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                        )}

                        {/* Expandable Caret */}
                        {expandable && renderExpandableRow && (
                          <td className="p-3 text-center">
                            <button onClick={() => toggleExpanded(originalIndex)} className="text-slate-500 hover:text-indigo-400 transition-all p-1 hover:bg-white/5 rounded">
                              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          </td>
                        )}

                        {/* Main Column Data */}
                        {columns.map((col, colIndex) => {
                          if (hiddenColIndices.has(colIndex)) return null;
                          return (
                            <td key={colIndex} className={`p-3 ${col.tdClassName || ''}`}>
                              {col.render ? col.render(item, originalIndex) : item[col.accessor]}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Expanded Drawer Slot */}
                      {isExpanded && renderExpandableRow && (
                        <tr>
                          <td colSpan={(selectable ? 1 : 0) + (expandable ? 1 : 0) + activeCols.length} className="p-0 border-b-0">
                            <div className="bg-[#050508] border-y border-indigo-500/20 p-4 shadow-inner">
                              {renderExpandableRow(item)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={(selectable ? 1 : 0) + (expandable && renderExpandableRow ? 1 : 0) + activeCols.length} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Search className="w-8 h-8 opacity-20" />
                      <span className="font-mono text-sm tracking-widest uppercase">{emptyText}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Status Footer */}
        {sortedData.length > 0 && (
          <div className="p-4 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-[10px] sm:text-xs font-mono text-slate-500 tracking-widest uppercase flex items-center gap-3">
              <span className="text-indigo-400 font-bold">{currentPage}</span>
              <span className="opacity-40">OF</span>
              <span className="text-slate-300 font-bold">{totalPages}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{itemsCount} Nodes Integrated</span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-2 sm:px-3 py-1.5 bg-[#0a0a0c] hover:bg-white/5 disabled:opacity-20 border border-white/10 rounded-md text-slate-300 font-mono text-[10px] sm:text-xs uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (totalPages > 7) {
                      if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                        if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-600 px-1">...</span>;
                        return null;
                      }
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md font-mono text-[10px] sm:text-xs flex items-center justify-center transition-all ${page === currentPage ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-white/10 text-slate-400 border border-transparent bg-[#0a0a0c]'}`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1.5 bg-[#0a0a0c] hover:bg-white/5 disabled:opacity-20 border border-white/10 rounded-md text-slate-300 font-mono text-[10px] sm:text-xs uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
