import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { sourceService } from '../services/api';
import type { Source } from '../types';

const CATEGORIES = ['Acts', 'Rules', 'Judgments', 'Court Metadata'];
const SOURCE_TYPES = ['Official', 'Repository'];
const AVAILABLE_LANGUAGES = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Odia', 'Punjabi', 'Malayalam'];

const Sources: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [websiteName, setWebsiteName] = useState('');
  const [authority, setAuthority] = useState('');
  const [category, setCategory] = useState<Source['category']>('Acts');
  const [sourceType, setSourceType] = useState<Source['source_type']>('Official');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [downloadAvailable, setDownloadAvailable] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [organization, setOrganization] = useState('');
  const [legalInformationType, setLegalInformationType] = useState('');
  const [reliabilityLevel, setReliabilityLevel] = useState('Needs Review');
  const [verificationStatus, setVerificationStatus] = useState('Pending');
  const [description, setDescription] = useState('');

  const fetchSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sourceService.getAll(search, categoryFilter, sourceTypeFilter);
      setSources(data);
      setCurrentPage(1); // Reset to page 1 on filter
    } catch (err) {
      console.error(err);
      setError('Could not load mapped source databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [search, categoryFilter, sourceTypeFilter]);

  // Reset form fields
  const resetForm = () => {
    setWebsiteName('');
    setAuthority('');
    setCategory('Acts');
    setSourceType('Official');
    setLanguages(['English']);
    setDownloadAvailable(true);
    setWebsiteUrl('');
    setNotes('');
    setOrganization('');
    setLegalInformationType('');
    setReliabilityLevel('Needs Review');
    setVerificationStatus('Pending');
    setDescription('');
    setFormError(null);
  };

  // Open Edit Dialog
  const openEdit = (source: Source) => {
    setSelectedSource(source);
    setWebsiteName(source.website_name);
    setAuthority(source.authority);
    setCategory(source.category);
    setSourceType(source.source_type);
    setLanguages(source.languages);
    setDownloadAvailable(source.download_available);
    setWebsiteUrl(source.website_url);
    setNotes(source.notes || '');
    setOrganization(source.organization || '');
    setLegalInformationType(source.legal_information_type || '');
    setReliabilityLevel(source.reliability_level || 'Needs Review');
    setVerificationStatus(source.verification_status || 'Pending');
    setDescription(source.description || '');
    setIsEditOpen(true);
  };

  // Open View Dialog
  const openView = (source: Source) => {
    setSelectedSource(source);
    setIsViewOpen(true);
  };

  // Open Delete Confirmation
  const openDelete = (source: Source) => {
    setSelectedSource(source);
    setIsDeleteOpen(true);
  };

  // Handle Add Source Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteName || !authority || !websiteUrl) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await sourceService.create({
        website_name: websiteName,
        authority,
        category,
        source_type: sourceType,
        languages,
        download_available: downloadAvailable,
        website_url: websiteUrl,
        notes,
        organization,
        legal_information_type: legalInformationType,
        reliability_level: reliabilityLevel,
        verification_status: verificationStatus,
        description,
      });
      setIsAddOpen(false);
      resetForm();
      fetchSources();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to map new source.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Edit Source Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource) return;
    if (!websiteName || !authority || !websiteUrl) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await sourceService.update(selectedSource.id, {
        website_name: websiteName,
        authority,
        category,
        source_type: sourceType,
        languages,
        download_available: downloadAvailable,
        website_url: websiteUrl,
        notes,
        organization,
        legal_information_type: legalInformationType,
        reliability_level: reliabilityLevel,
        verification_status: verificationStatus,
        description,
      });
      setIsEditOpen(false);
      resetForm();
      fetchSources();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to update source.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Source
  const handleDeleteConfirm = async () => {
    if (!selectedSource) return;
    setFormLoading(true);
    try {
      await sourceService.delete(selectedSource.id);
      setIsDeleteOpen(false);
      fetchSources();
    } catch (err) {
      console.error(err);
      alert('Failed to delete mapped source.');
    } finally {
      setFormLoading(false);
    }
  };

  // Language multi-select toggling
  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSources = sources.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sources.length / itemsPerPage);

  return (
    <div className="p-8">
      <PageHeader
        title="Sources Management"
        description="Catalog, verify, and monitor website endpoints for Indian legal databases."
        actions={
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-600/10 active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Map New Source</span>
          </button>
        }
      />

      {/* Filters Panel */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Website Name, Authority, Notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Source Type */}
          <select
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter(e.target.value)}
            className="border border-slate-200 bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Source Types</option>
            {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Sources Table panel */}
      <div className="glass-panel rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={28} />
            <span className="text-xs font-semibold text-slate-400 uppercase">Updating source directories...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500 text-sm font-semibold flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        ) : currentSources.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium">
            <Database size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No mapped source registries found matching the filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6">Website Name</th>
                    <th className="py-3 px-6">Authority</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Languages</th>
                    <th className="py-3 px-6 text-center">DL Support</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {currentSources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 tracking-tight">{source.website_name}</div>
                        <a
                          href={source.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Visit Registry Endpoint
                        </a>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{source.authority}</td>
                      <td className="py-4 px-6">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                          {source.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          source.source_type === 'Official' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200/50' 
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200/50'
                        }`}>
                          {source.source_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {source.languages.map(lang => (
                            <span key={lang} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center justify-center p-1 rounded-full ${
                          source.download_available 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {source.download_available ? <Check size={12} className="stroke-[3]" /> : <X size={12} className="stroke-[3]" />}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <button
                          onClick={() => openView(source)}
                          className="p-1.5 border border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-colors inline-flex"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(source)}
                          className="p-1.5 border border-slate-100 hover:bg-slate-100 text-blue-500 hover:text-blue-700 rounded-lg transition-colors inline-flex"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => openDelete(source)}
                          className="p-1.5 border border-slate-100 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors inline-flex"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sources.length)} of {sources.length} sources
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- ADD SOURCE DIALOG --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="text-blue-600" size={18} />
                <span>Map Legal Source Registry</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl text-xs flex gap-2 items-center">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website Name *</label>
                  <input
                    type="text"
                    required
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Allahabad High Court Judgments"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority *</label>
                  <input
                    type="text"
                    required
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. High Court of Judicature at Allahabad"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Source['category'])}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as Source['source_type'])}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organization / Department</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Ministry of Law & Justice"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legal Information Type</label>
                  <input
                    type="text"
                    value={legalInformationType}
                    onChange={(e) => setLegalInformationType(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Acts, Statutes, Rules"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reliability Level</label>
                  <select
                    value={reliabilityLevel}
                    onChange={(e) => setReliabilityLevel(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Authoritative">Authoritative</option>
                    <option value="Recognized">Recognized</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Needs Review">Needs Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Status</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none"
                  placeholder="Provide details about crawler endpoints, data publication schedule, and limitations..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website URL *</label>
                <input
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://allahabadhighcourt.in/judgments"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Languages</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LANGUAGES.map(lang => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-semibold ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Direct File Downloads</h4>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wide">Registry supports automated scraper downloads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downloadAvailable}
                    onChange={(e) => setDownloadAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Research Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder="Record credentials, crawler parameters, frequency, audit issues here..."
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/10"
                >
                  {formLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>Map Registry Node</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT SOURCE DIALOG --- */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="text-blue-600" size={18} />
                <span>Edit Source Registry Config</span>
              </h3>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website Name *</label>
                  <input
                    type="text"
                    required
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority *</label>
                  <input
                    type="text"
                    required
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Source['category'])}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as Source['source_type'])}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organization / Department</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Ministry of Law & Justice"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legal Information Type</label>
                  <input
                    type="text"
                    value={legalInformationType}
                    onChange={(e) => setLegalInformationType(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Acts, Statutes, Rules"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reliability Level</label>
                  <select
                    value={reliabilityLevel}
                    onChange={(e) => setReliabilityLevel(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Authoritative">Authoritative</option>
                    <option value="Recognized">Recognized</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Needs Review">Needs Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Status</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none"
                  placeholder="Provide details about crawler endpoints, data publication schedule, and limitations..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website URL *</label>
                <input
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Languages</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LANGUAGES.map(lang => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-semibold ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Direct File Downloads</h4>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wide">Registry supports automated scraper downloads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downloadAvailable}
                    onChange={(e) => setDownloadAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Research Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/10"
                >
                  {formLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>Save Config</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW DETAILS DIALOG --- */}
      {isViewOpen && selectedSource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Source Registry Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <div className="flex gap-4 items-center">
                <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                  <Database size={24} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">{selectedSource.website_name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: SRC-{selectedSource.id.toString().padStart(3, '0')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedSource.authority}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedSource.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Type</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedSource.source_type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File DL Support</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedSource.download_available ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Languages Mapped</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSource.languages.map(l => (
                    <span key={l} className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md font-semibold">
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Website URL</span>
                <a
                  href={selectedSource.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline font-semibold break-all inline-block mt-0.5"
                >
                  {selectedSource.website_url}
                </a>
              </div>

              {selectedSource.notes && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Internal Research Notes</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl mt-1 font-medium italic">
                    "{selectedSource.notes}"
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsViewOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {isDeleteOpen && selectedSource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-slate-200/80 p-6 flex flex-col text-center">
            <AlertCircle className="text-red-500 mx-auto mb-3" size={36} />
            <h3 className="text-base font-bold text-slate-950">Remove Mapped Source?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 px-2">
              Are you sure you want to delete <b className="text-slate-800">'{selectedSource.website_name}'</b>? This action will break references and cascade delete related documents.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 bg-white"
              >
                Keep Source
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={formLoading}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-red-600/15"
              >
                {formLoading ? 'Deleting...' : 'Delete Node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sources;
