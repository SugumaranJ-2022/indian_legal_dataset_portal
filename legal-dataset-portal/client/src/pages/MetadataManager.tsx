import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Edit, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { documentService, reportService } from '../services/api';
import type { Document } from '../types';

const CATEGORIES = ['Acts / Statutes', 'Rules & Regulations', 'Court Judgments', 'Court Metadata'];
const STATUSES = ['Verified', 'Verified (Content-Level)', 'Needs Review', 'Questionable', 'Duplicate', 'Incomplete'];

const MetadataManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Sort State
  const [sortField, setSortField] = useState<keyof Document>('document_code');
  const [sortAsc, setSortAsc] = useState(true);

  // Inline Editing States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYear, setEditYear] = useState<number>(2000);
  const [editAuthority, setEditAuthority] = useState('');
  const [editCategory, setEditCategory] = useState<Document['category']>('Acts / Statutes');
  const [editLanguage, setEditLanguage] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editStatus, setEditStatus] = useState<Document['status']>('Needs Review');
  
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getAll(search, categoryFilter);
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError('Could not load metadata list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, categoryFilter]);

  // Start Inline Editing for a row
  const startEditing = (doc: Document) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditYear(doc.year);
    setEditAuthority(doc.authority);
    setEditCategory(doc.category);
    setEditLanguage(doc.language);
    setEditSourceUrl(doc.source_url);
    setEditStatus(doc.status);
  };

  // Cancel Editing
  const cancelEditing = () => {
    setEditingId(null);
  };

  // Save Inline Editing
  const saveRow = async (id: number) => {
    if (!editTitle || !editAuthority || !editLanguage || !editSourceUrl) {
      alert('Please fill in all standard metadata fields.');
      return;
    }
    setSaveLoading(true);
    try {
      const updated = await documentService.update(id, {
        title: editTitle,
        year: editYear,
        category: editCategory,
        authority: editAuthority,
        language: editLanguage,
        source_url: editSourceUrl,
        status: editStatus,
      });
      
      // Update local state list
      setDocuments(prev => prev.map(d => d.id === id ? updated : d));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save metadata update.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Sort
  const handleSort = (field: keyof Document) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sort and Filter documents locally
  const sortedDocuments = [...documents].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Metadata Manager"
        description="Spreadsheet layout for batch reviewing and inline editing indexed metadata values."
        actions={
          <button
            onClick={() => reportService.downloadExcel()}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <Download size={15} />
            <span>Export Excel</span>
          </button>
        }
      />

      {/* Quick Filters */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Document Title, Code, Authority..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Filter size={14} />
            <span>Category:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Spreadsheet grid panel */}
      <div className="glass-panel rounded-2xl shadow-md overflow-hidden select-none">
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500 text-sm font-semibold flex items-center justify-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium">
            <FileSpreadsheet size={36} className="mx-auto mb-2 opacity-55" />
            <p className="text-sm">No documents found matching search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('document_code')}>
                    <div className="flex items-center gap-1">
                      <span>Doc Code</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1">
                      <span>Title</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('year')}>
                    <div className="flex items-center gap-1">
                      <span>Year</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('authority')}>
                    <div className="flex items-center gap-1">
                      <span>Authority</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('language')}>
                    <div className="flex items-center gap-1">
                      <span>Language</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('source_url')}>
                    <div className="flex items-center gap-1">
                      <span>Source URL</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {sortedDocuments.map((doc) => {
                  const isEditing = editingId === doc.id;
                  return (
                    <tr key={doc.id} className={`hover:bg-slate-50/40 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                      {/* Doc Code */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 tracking-tight">{doc.document_code}</td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">{doc.title}</span>
                        )}
                      </td>

                      {/* Year */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editYear}
                            onChange={(e) => setEditYear(parseInt(e.target.value) || 2000)}
                            className="w-16 px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span>{doc.year}</span>
                        )}
                      </td>

                      {/* Authority */}
                      <td className="py-3.5 px-4 truncate max-w-[150px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editAuthority}
                            onChange={(e) => setEditAuthority(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span>{doc.authority}</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as Document['category'])}
                            className="px-2 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                            {doc.category}
                          </span>
                        )}
                      </td>

                      {/* Language */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editLanguage}
                            onChange={(e) => setEditLanguage(e.target.value)}
                            className="w-20 px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span>{doc.language}</span>
                        )}
                      </td>

                      {/* Source URL */}
                      <td className="py-3.5 px-4 max-w-[150px] truncate text-blue-600">
                        {isEditing ? (
                          <input
                            type="url"
                            value={editSourceUrl}
                            onChange={(e) => setEditSourceUrl(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {doc.source_url}
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as Document['status'])}
                            className="px-2 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            doc.status === 'Verified (Content-Level)' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20' :
                            doc.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                            doc.status === 'Duplicate' ? 'bg-slate-500/10 text-slate-600 border border-slate-500/20' :
                            'bg-red-500/10 text-red-600 border border-red-500/20'
                          }`}>
                            {doc.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => saveRow(doc.id)}
                              disabled={saveLoading}
                              className="p-1 border border-emerald-200 hover:bg-emerald-50 text-emerald-600 rounded"
                            >
                              <Check size={14} className="stroke-[2.5]" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 border border-slate-200 hover:bg-slate-50 text-slate-400 rounded"
                            >
                              <X size={14} className="stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(doc)}
                            className="p-1.5 border border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg inline-flex"
                          >
                            <Edit size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetadataManager;
