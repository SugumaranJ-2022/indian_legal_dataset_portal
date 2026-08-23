import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  Globe,
  Download,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { documentService, sourceService, annotationService } from '../services/api';
import type { Document, Source } from '../types';

const CATEGORIES = ['Acts / Statutes', 'Rules & Regulations', 'Court Judgments', 'Court Metadata'];
const STATUSES = ['Verified', 'Verified (Content-Level)', 'Needs Review', 'Questionable', 'Duplicate', 'Incomplete'];

const DocumentCollection: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs & Annotations State
  const [activeTab, setActiveTab] = useState<'preview' | 'summary' | 'annotations'>('preview');
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [newAnnotationPage, setNewAnnotationPage] = useState<number | ''>('');
  
  // User Role Settings
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = localStorage.getItem('override_role') || user.role || 'researcher';


  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Dialogs
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Upload Form Fields
  const [docCode, setDocCode] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [category, setCategory] = useState<Document['category']>('Acts / Statutes');
  const [authority, setAuthority] = useState('');
  const [language, setLanguage] = useState('English');
  const [sourceId, setSourceId] = useState<number | ''>('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [version, setVersion] = useState('1.0');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docsData = await documentService.getAll(search, categoryFilter, undefined, statusFilter);
      setDocuments(docsData);
      
      // Keep selected doc in sync if it is currently displayed
      if (selectedDoc) {
        const updatedDoc = docsData.find(d => d.id === selectedDoc.id);
        if (updatedDoc) setSelectedDoc(updatedDoc);
      } else if (docsData.length > 0) {
        setSelectedDoc(docsData[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch collected documents.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const sourcesData = await sourceService.getAll();
      setSources(sourcesData);
    } catch (err) {
      console.error('Could not fetch sources for selector', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchSources();
  }, []);

  // Fetch annotations on document select
  const fetchAnnotations = async (docId: number) => {
    try {
      const data = await annotationService.getByDocumentId(docId);
      setAnnotations(data);
    } catch (err) {
      console.error('Failed to fetch annotations', err);
    }
  };

  useEffect(() => {
    if (selectedDoc) {
      fetchAnnotations(selectedDoc.id);
    }
  }, [selectedDoc]);

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !newAnnotationText.trim()) return;
    try {
      await annotationService.create(selectedDoc.id, {
        page_number: newAnnotationPage === '' ? null : Number(newAnnotationPage),
        text: newAnnotationText
      });
      setNewAnnotationText('');
      setNewAnnotationPage('');
      fetchAnnotations(selectedDoc.id);
    } catch (err) {
      console.error('Failed to create annotation', err);
    }
  };

  const handleDeleteAnnotation = async (annotationId: number) => {
    if (!selectedDoc) return;
    try {
      await annotationService.delete(selectedDoc.id, annotationId);
      fetchAnnotations(selectedDoc.id);
    } catch (err) {
      console.error('Failed to delete annotation', err);
    }
  };

  const renderBoldText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      return index % 2 === 1 ? <strong key={index} className="font-bold text-slate-900">{part}</strong> : part;
    });
  };

  const renderSummary = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-sm font-bold text-slate-900 mt-4 mb-2 uppercase tracking-wide border-b border-slate-200 pb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={i} className="text-xs font-bold text-slate-800 mt-3 mb-1">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('- ')) {
        const cleanLine = line.replace('- ', '');
        return (
          <li key={i} className="ml-4 list-disc text-slate-600 mt-1 pl-1 leading-normal">
            {renderBoldText(cleanLine)}
          </li>
        );
      }
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <p key={i} className="text-slate-600 leading-relaxed mt-1 text-xs">{renderBoldText(line)}</p>;
    });
  };


  const resetUploadForm = () => {
    setDocCode('');
    setTitle('');
    setYear(new Date().getFullYear());
    setCategory('Acts / Statutes');
    setAuthority('');
    setLanguage('English');
    setSourceId('');
    setSourceUrl('');
    setVersion('1.0');
    setNotes('');
    setSelectedFile(null);
    setFormError(null);
  };

  // Open Edit Metadata Form
  const openEdit = (doc: Document) => {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setYear(doc.year);
    setCategory(doc.category);
    setAuthority(doc.authority);
    setLanguage(doc.language);
    setSourceId(doc.source_id || '');
    setSourceUrl(doc.source_url);
    setVersion(doc.version);
    setNotes(doc.notes || '');
    setIsEditOpen(true);
  };

  // Handle PDF Upload Form
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docCode || !title || !year || !authority || !language || !sourceUrl || !selectedFile) {
      setFormError('Please fill in all mandatory fields and select a PDF file.');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('document_code', docCode);
    formData.append('title', title);
    formData.append('year', year.toString());
    formData.append('category', category);
    formData.append('authority', authority);
    formData.append('language', language);
    if (sourceId !== '') {
      formData.append('source_id', sourceId.toString());
    }
    formData.append('source_url', sourceUrl);
    formData.append('version', version);
    formData.append('notes', notes);

    try {
      const newDoc = await documentService.upload(formData);
      setIsUploadOpen(false);
      resetUploadForm();
      await fetchDocuments();
      setSelectedDoc(newDoc);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Metadata Update Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!title || !year || !authority || !language || !sourceUrl) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const updated = await documentService.update(selectedDoc.id, {
        title,
        year,
        category,
        authority,
        language,
        source_id: sourceId === '' ? undefined : sourceId,
        source_url: sourceUrl,
        version,
        notes,
      });
      setIsEditOpen(false);
      await fetchDocuments();
      setSelectedDoc(updated);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to update document metadata.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;
    setFormLoading(true);
    try {
      await documentService.delete(selectedDoc.id);
      setIsDeleteOpen(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document from index.');
    } finally {
      setFormLoading(false);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocs = documents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(documents.length / itemsPerPage);

  return (
    <div className="p-8">
      <PageHeader
        title="Document Collection"
        description="Verify raw legal materials and metadata checklists side-by-side with file previews."
        actions={
          userRole !== 'reviewer' ? (
            <button
              onClick={() => {
                resetUploadForm();
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-600/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus size={16} />
              <span>Upload Document PDF</span>
            </button>
          ) : undefined
        }
      />

      {/* Main split-screen panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Documents List (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Quick Filters */}
          <div className="glass-panel p-4 rounded-xl shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search Title, Code, Filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* List panel */}
          <div className="glass-panel rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-500 text-xs font-semibold">
                <span>{error}</span>
              </div>
            ) : currentDocs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium">
                <FolderOpen size={30} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No documents uploaded matching filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 border-l-4 ${
                      selectedDoc?.id === doc.id
                        ? 'bg-blue-50/50 border-blue-600'
                        : 'border-transparent hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-0.5 border border-slate-200">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{doc.document_code}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' :
                          doc.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600' :
                          doc.status === 'Duplicate' ? 'bg-slate-500/10 text-slate-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5 leading-tight">{doc.title}</h4>
                      {doc.snippet && (
                        <div className="mt-1 bg-blue-50/70 text-[9px] text-blue-700 p-1.5 rounded-lg border border-blue-100 font-mono italic break-words line-clamp-2">
                          {doc.snippet}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-1">
                        <span>{doc.category}</span>
                        <span>{doc.year}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 bg-slate-50/40 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-slate-200 rounded-md hover:bg-white text-slate-600 transition disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1 border border-slate-200 rounded-md hover:bg-white text-slate-600 transition disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PDF Preview & Details Drawer (7 columns) */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <div className="glass-panel rounded-2xl shadow-md overflow-hidden flex flex-col h-[76vh]">
              {/* Toolbar */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate leading-tight max-w-xs md:max-w-md">{selectedDoc.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedDoc.document_code} • Version {selectedDoc.version}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {userRole !== 'reviewer' && (
                    <button
                      onClick={() => openEdit(selectedDoc)}
                      className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition"
                      title="Edit Metadata"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {userRole === 'admin' && (
                    <button
                      onClick={() => setIsDeleteOpen(true)}
                      className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-red-50 text-red-500 hover:text-red-700 transition"
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Detail list and iframe container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Metadatas grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedDoc.authority}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedDoc.category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year / Version</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedDoc.year} (v{selectedDoc.version})</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Language</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedDoc.language}</p>
                  </div>
                </div>

                {/* File Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page Count</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedDoc.page_count ? `${selectedDoc.page_count} pages` : 'Pending calculation'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Size</span>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {selectedDoc.file_size ? `${(selectedDoc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Pending upload'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MIME Type</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{selectedDoc.file_type || 'PDF'}</p>
                  </div>
                </div>

                {selectedDoc.file_hash && (
                  <div className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SHA-256 Binary Checksum</span>
                    <p className="font-mono text-slate-700 mt-0.5 break-all select-all">{selectedDoc.file_hash}</p>
                  </div>
                )}

                {/* URL and source */}
                <div className="text-xs space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <Globe size={12} />
                    <span>Source Endpoint URL:</span>
                  </div>
                  <a
                    href={selectedDoc.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold break-all"
                  >
                    {selectedDoc.source_url}
                  </a>
                </div>

                {selectedDoc.notes && (
                  <div className="text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scraper / Verification Notes</span>
                    <p className="text-slate-600 italic bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 mt-1 font-medium">
                      "{selectedDoc.notes}"
                    </p>
                  </div>
                )}

                {/* Tabs Bar */}
                <div className="flex border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 pb-2.5 text-center border-b-2 transition ${
                      activeTab === 'preview'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    🔍 PDF Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 pb-2.5 text-center border-b-2 transition ${
                      activeTab === 'summary'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    🤖 AI Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('annotations')}
                    className={`flex-1 pb-2.5 text-center border-b-2 transition ${
                      activeTab === 'annotations'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    📌 Sticky Notes ({annotations.length})
                  </button>
                </div>

                {/* Preview Tab Content */}
                {activeTab === 'preview' && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden h-[400px] bg-slate-100 flex flex-col animate-fade-in">
                    <div className="bg-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-300">
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        <span>PDF Viewer: {selectedDoc.filename}</span>
                      </span>
                      <a
                        href={`http://localhost:8000/uploads/${selectedDoc.filename}`}
                        download
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                      >
                        <Download size={12} />
                        <span>Download File</span>
                      </a>
                    </div>
                    <iframe
                      src={`http://localhost:8000/uploads/${selectedDoc.filename}`}
                      className="w-full flex-1 border-none"
                      title="PDF Preview"
                    />
                  </div>
                )}

                {/* AI Summary Tab Content */}
                {activeTab === 'summary' && (
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-xs space-y-2 max-h-[400px] overflow-y-auto animate-fade-in font-sans">
                    {selectedDoc.ai_summary ? (
                      <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {renderSummary(selectedDoc.ai_summary)}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-xs">No AI legal summary generated for this document yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sticky Notes Tab Content */}
                {activeTab === 'annotations' && (
                  <div className="space-y-4 animate-fade-in text-xs flex flex-col h-[400px]">
                    <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60 max-h-[280px]">
                      {annotations.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <Plus size={20} className="mx-auto mb-2 opacity-50" />
                          <p className="font-semibold text-xs">No sticky research notes attached yet.</p>
                        </div>
                      ) : (
                        annotations.map((ann) => (
                          <div key={ann.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow transition relative group">
                            <div className="flex justify-between items-center mb-1 text-[9px] text-slate-400 font-bold uppercase">
                              <span>{ann.author} • {new Date(ann.created_at).toLocaleDateString('en-IN')}</span>
                              {ann.page_number && (
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Page {ann.page_number}</span>
                              )}
                            </div>
                            <p className="text-slate-700 leading-relaxed break-words pr-6 font-medium text-xs">{ann.text}</p>
                            <button
                              onClick={() => handleDeleteAnnotation(ann.id)}
                              className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete note"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddAnnotation} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex gap-2 items-center">
                      <input
                        type="number"
                        placeholder="Pg #"
                        value={newAnnotationPage}
                        onChange={(e) => setNewAnnotationPage(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        min={1}
                      />
                      <input
                        type="text"
                        placeholder="Add a legal research note or sticky comment..."
                        required
                        value={newAnnotationText}
                        onChange={(e) => setNewAnnotationText(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all text-xs shadow-sm hover:shadow"
                      >
                        Add Note
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl shadow-md h-[70vh] flex flex-col justify-center items-center text-center p-6 border-dashed border-slate-200 select-none">
              <FolderOpen size={48} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Document Selected</h3>
              <p className="text-xs text-slate-400 font-medium max-w-xs mt-1 leading-normal">
                Select a document from the left list index to verify properties and launch the PDF visualizer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- UPLOAD PDF DIALOG --- */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[92vh] flex flex-col animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="text-blue-600" size={18} />
                <span>Upload Law Document PDF</span>
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl text-xs flex gap-2 items-center">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {documents.filter(d => d.filename === 'pending_upload.pdf').length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 text-xs">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Fulfill Seeded Candidate Act? (Optional)
                  </label>
                  <select
                    onChange={(e) => {
                      const docId = e.target.value;
                      if (!docId) {
                        setDocCode('');
                        setTitle('');
                        setYear(new Date().getFullYear());
                        setCategory('Acts / Statutes');
                        setAuthority('');
                        setLanguage('English');
                        setSourceUrl('');
                        setSourceId('');
                        return;
                      }
                      const candidate = documents.find(d => d.id === Number(docId));
                      if (candidate) {
                        setDocCode(candidate.document_code);
                        setTitle(candidate.title);
                        setYear(candidate.year);
                        setCategory(candidate.category);
                        setAuthority(candidate.authority);
                        setLanguage(candidate.language);
                        setSourceUrl(candidate.source_url);
                        setSourceId(candidate.source_id || '');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Candidate to Auto-fill Form --</option>
                    {documents.filter(d => d.filename === 'pending_upload.pdf').map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Code / ID *</label>
                  <input
                    type="text"
                    required
                    value={docCode}
                    onChange={(e) => setDocCode(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. DOC-001"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Information Technology Act, 2000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year *</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Language *</label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. English"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Document['category'])}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority / Government Agency *</label>
                  <input
                    type="text"
                    required
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Ministry of Electronics and IT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Registry Node</label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unlinked / Independent</option>
                    {sources.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source URL *</label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.meity.gov.in/content/it-act"
                  />
                </div>
              </div>

              {/* File Upload Selector */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500/80 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="mx-auto text-slate-400 mb-2" size={32} />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-emerald-600">{selectedFile.name}</p>
                    <span className="text-[10px] text-slate-400 font-medium">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Drag and drop or click to choose PDF file</p>
                    <span className="text-[10px] text-slate-400">PDF standard format only (Max 25MB)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes / Metadata Context</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none"
                  placeholder="Notes about quality, amendments, missing schedules..."
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/10"
                >
                  {formLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>Index PDF Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT METADATA DIALOG --- */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[92vh] flex flex-col animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Edit Document Metadata</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl text-xs flex gap-2 items-center">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year *</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Language *</label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Document['category'])}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority / Government Agency *</label>
                  <input
                    type="text"
                    required
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Registry Node</label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unlinked / Independent</option>
                    {sources.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source URL *</label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes / Metadata Context</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/10"
                >
                  {formLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>Save Metadata</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {isDeleteOpen && selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 border border-slate-200/80 text-center animate-scale-up">
            <AlertCircle className="text-red-500 mx-auto mb-3" size={36} />
            <h3 className="text-base font-bold text-slate-950">Remove Document Index?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 px-2">
              Are you sure you want to delete <b className="text-slate-800">'{selectedDoc.title}'</b>? This will permanently delete the PDF file and remove its verification history.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 bg-white"
              >
                Keep File
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={formLoading}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-red-600/15"
              >
                {formLoading ? 'Deleting...' : 'Delete File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCollection;
