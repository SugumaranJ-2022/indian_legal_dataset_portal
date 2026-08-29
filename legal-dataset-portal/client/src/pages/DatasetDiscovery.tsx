import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Award, 
  Compass, 
  Bookmark, 
  BookmarkCheck,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { datasetService } from '../services/api';
import type { Dataset } from '../types';
import { useNavigate } from 'react-router-dom';

const DatasetDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [shortlistedOnly, setShortlistedOnly] = useState<boolean | undefined>(undefined);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState<Dataset | null>(null);
  const [shortlistReason, setShortlistReason] = useState('');
  const [shortlistRank, setShortlistRank] = useState(1);
  
  // Form states
  const [newDataset, setNewDataset] = useState({
    dataset_name: '',
    short_name: '',
    description: '',
    platform: 'Hugging Face',
    dataset_url: '',
    creator: '',
    organization: '',
    category: 'Court Judgments',
    subcategory: '',
    record_count: 0,
    time_period_start: '',
    time_period_end: '',
    languages: 'English',
    format: 'JSON',
    text_available: true,
    metadata_available: true,
    original_documents_available: false,
    license_name: 'MIT',
    license_status: 'License Unclear'
  });

  const [formError, setFormError] = useState('');

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await datasetService.getAll(search, platform, category, shortlistedOnly);
      setDatasets(data);
    } catch (err) {
      console.error('Error fetching datasets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [search, platform, category, shortlistedOnly]);

  const handleAddDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newDataset.dataset_name || !newDataset.short_name || !newDataset.dataset_url) {
      setFormError('Dataset name, short name, and URL are required.');
      return;
    }
    
    // Quick validation check on url
    if (!newDataset.dataset_url.startsWith('http://') && !newDataset.dataset_url.startsWith('https://')) {
      setFormError('URL must be a valid link starting with http:// or https://');
      return;
    }

    try {
      await datasetService.create(newDataset);
      setShowAddModal(false);
      // Reset form
      setNewDataset({
        dataset_name: '',
        short_name: '',
        description: '',
        platform: 'Hugging Face',
        dataset_url: '',
        creator: '',
        organization: '',
        category: 'Court Judgments',
        subcategory: '',
        record_count: 0,
        time_period_start: '',
        time_period_end: '',
        languages: 'English',
        format: 'JSON',
        text_available: true,
        metadata_available: true,
        original_documents_available: false,
        license_name: 'MIT',
        license_status: 'License Unclear'
      });
      fetchDatasets();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to register dataset.');
    }
  };

  const handleToggleShortlist = async (dataset: Dataset) => {
    if (dataset.shortlisted) {
      // Remove from shortlist
      try {
        await datasetService.update(dataset.id, {
          shortlisted: false,
          shortlist_reason: '',
          shortlist_rank: undefined
        });
        fetchDatasets();
      } catch (err) {
        console.error('Failed to update shortlist status', err);
      }
    } else {
      // Show reason modal
      setShortlistReason('');
      setShortlistRank(datasets.filter(d => d.shortlisted).length + 1);
      setShowShortlistModal(dataset);
    }
  };

  const submitShortlist = async () => {
    if (!showShortlistModal) return;
    try {
      await datasetService.update(showShortlistModal.id, {
        shortlisted: true,
        shortlist_reason: shortlistReason,
        shortlist_rank: shortlistRank
      });
      setShowShortlistModal(null);
      fetchDatasets();
    } catch (err) {
      console.error('Failed to submit shortlist details', err);
    }
  };

  // Get score color
  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="p-8 font-sans bg-slate-50/50 min-h-screen">
      <PageHeader 
        title="Dataset Discovery & Inventory" 
        description="Index and analyze existing external datasets, legal archives, and academic repositories for model training benchmarks."
      />

      {/* Discovery Hub Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Compass size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Indexed Datasets</div>
            <div className="text-xl font-extrabold text-slate-900">{datasets.length}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BookmarkCheck size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shortlisted (Benchmark)</div>
            <div className="text-xl font-extrabold text-slate-900">{datasets.filter(d => d.shortlisted).length}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Relevance (&gt;75)</div>
            <div className="text-xl font-extrabold text-slate-900">{datasets.filter(d => d.research_relevance_score >= 75).length}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Relevance Score</div>
            <div className="text-xl font-extrabold text-slate-900">
              {datasets.length ? Math.round(datasets.reduce((acc, d) => acc + d.research_relevance_score, 0) / datasets.length) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search datasets, platforms, registries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          {/* Platform filter */}
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 appearance-none cursor-pointer font-medium"
            >
              <option value="">All Registries / Platforms</option>
              <option value="AWS Open Data">AWS Open Data</option>
              <option value="Hugging Face">Hugging Face</option>
              <option value="GitHub">GitHub</option>
              <option value="SHRUG">SHRUG</option>
              <option value="Academic Data Portal">Academic Portal</option>
            </select>
            <Filter size={10} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 appearance-none cursor-pointer font-medium"
            >
              <option value="">All Legal Domains</option>
              <option value="Acts / Statutes">Acts / Statutes</option>
              <option value="Rules & Regulations">Rules & Regulations</option>
              <option value="Court Judgments">Court Judgments</option>
              <option value="Court Metadata">Court Metadata</option>
            </select>
            <Filter size={10} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Shortlisted filter */}
          <button
            onClick={() => setShortlistedOnly(prev => prev === undefined ? true : prev === true ? false : undefined)}
            className={`px-3 py-2 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              shortlistedOnly === true 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : shortlistedOnly === false 
                  ? 'bg-slate-100 text-slate-600 border-slate-300' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={12} />
            <span>
              {shortlistedOnly === true ? 'Benchmark Only' : shortlistedOnly === false ? 'Unlisted Only' : 'All Shortlist Statuses'}
            </span>
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/10 cursor-pointer w-full md:w-auto justify-center"
        >
          <Plus size={14} />
          <span>Register Dataset</span>
        </button>
      </div>

      {/* Dataset Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-bold">Compiling discovered datasets inventory...</p>
        </div>
      ) : datasets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center select-none flex flex-col justify-center items-center gap-4">
          <AlertCircle size={40} className="text-slate-300 stroke-[1.5]" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase">No Datasets Found</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Try resetting search filters or register a new legal dataset.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {datasets.map((ds) => (
            <div 
              key={ds.id} 
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition relative group"
            >
              {/* Header block */}
              <div className="p-6 pb-4 border-b border-slate-100 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500 tracking-wide uppercase">
                    {ds.platform}
                  </span>
                  
                  {/* Score badge */}
                  <div className={`px-2 py-0.5 border rounded text-[10px] font-extrabold flex items-center gap-1 ${getScoreBadgeClass(ds.research_relevance_score)}`}>
                    <TrendingUp size={10} />
                    <span>Score: {ds.research_relevance_score}%</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition tracking-tight leading-tight">
                    {ds.dataset_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">
                    CODE: {ds.short_name} | CATEGORY: {ds.category}
                  </p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-3 line-clamp-3">
                    {ds.description}
                  </p>
                </div>

                {/* Scope items */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50 text-[10px] font-semibold text-slate-500">
                  <div>Records: <b className="text-slate-800">{ds.record_count ? ds.record_count.toLocaleString() : 'Unknown'}</b></div>
                  <div>License: <b className="text-slate-800">{ds.license_name || 'Unspecified'}</b></div>
                  <div>Provenance: <b className="text-slate-800">{ds.provenance_status}</b></div>
                  <div>Reuse: <b className="text-slate-800">{ds.reuse_classification}</b></div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 px-6 py-4 flex gap-4 items-center justify-between border-t border-slate-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleShortlist(ds)}
                    className={`p-2 rounded-lg border transition cursor-pointer ${
                      ds.shortlisted 
                        ? 'bg-blue-50 text-blue-600 border-blue-200' 
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                    }`}
                    title={ds.shortlisted ? 'Remove from benchmark shortlist' : 'Add to benchmark shortlist'}
                  >
                    {ds.shortlisted ? <BookmarkCheck size={14} className="fill-blue-600" /> : <Bookmark size={14} />}
                  </button>
                  <a
                    href={ds.dataset_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white text-slate-400 border border-slate-200 hover:text-slate-600 rounded-lg transition"
                    title="Visit official registry page"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                <button
                  onClick={() => navigate(`/datasets/${ds.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition active:scale-[0.98] cursor-pointer"
                >
                  <Eye size={12} />
                  <span>Inspect Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dataset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Register Discovered Dataset</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">MAP EXTERNAL LEGAL DATASETS FOR PIPELINE COMPLIANCE AUDITS</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddDataset} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold text-slate-700">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Dataset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian High Court Judgments 2025"
                    value={newDataset.dataset_name}
                    onChange={(e) => setNewDataset({...newDataset, dataset_name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HC-Judgments-25"
                    value={newDataset.short_name}
                    onChange={(e) => setNewDataset({...newDataset, short_name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summarize dataset contents, target domain coverage, and data curation details..."
                  value={newDataset.description}
                  onChange={(e) => setNewDataset({...newDataset, description: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Registry/Platform *</label>
                  <select
                    value={newDataset.platform}
                    onChange={(e) => setNewDataset({...newDataset, platform: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="AWS Open Data">AWS Open Data</option>
                    <option value="Hugging Face">Hugging Face</option>
                    <option value="GitHub">GitHub</option>
                    <option value="SHRUG">SHRUG</option>
                    <option value="Academic Data Portal">Academic Portal</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Dataset URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://huggingface.co/datasets/..."
                    value={newDataset.dataset_url}
                    onChange={(e) => setNewDataset({...newDataset, dataset_url: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Legal Domain Category</label>
                  <select
                    value={newDataset.category}
                    onChange={(e) => setNewDataset({...newDataset, category: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Acts / Statutes">Acts / Statutes</option>
                    <option value="Rules & Regulations">Rules & Regulations</option>
                    <option value="Court Judgments">Court Judgments</option>
                    <option value="Court Metadata">Court Metadata</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Subcategory (e.g. Criminal, High Court)</label>
                  <input
                    type="text"
                    placeholder="e.g. High Court / Civil"
                    value={newDataset.subcategory}
                    onChange={(e) => setNewDataset({...newDataset, subcategory: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">Record Count</label>
                  <input
                    type="number"
                    value={newDataset.record_count}
                    onChange={(e) => setNewDataset({...newDataset, record_count: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">Start Year</label>
                  <input
                    type="text"
                    placeholder="1950"
                    value={newDataset.time_period_start}
                    onChange={(e) => setNewDataset({...newDataset, time_period_start: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">End Year</label>
                  <input
                    type="text"
                    placeholder="2025"
                    value={newDataset.time_period_end}
                    onChange={(e) => setNewDataset({...newDataset, time_period_end: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">License Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CC-BY-4.0"
                    value={newDataset.license_name}
                    onChange={(e) => setNewDataset({...newDataset, license_name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">License Status</label>
                  <select
                    value={newDataset.license_status}
                    onChange={(e) => setNewDataset({...newDataset, license_status: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Clear">Clear (Commercial/Academic permissible)</option>
                    <option value="License Unclear">License Unclear / Restrictive</option>
                    <option value="No License Found">No License Found</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6 items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDataset.text_available}
                    onChange={(e) => setNewDataset({...newDataset, text_available: e.target.checked})}
                    className="rounded text-blue-600"
                  />
                  <span>Extracted Text Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDataset.metadata_available}
                    onChange={(e) => setNewDataset({...newDataset, metadata_available: e.target.checked})}
                    className="rounded text-blue-600"
                  />
                  <span>Metadata Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDataset.original_documents_available}
                    onChange={(e) => setNewDataset({...newDataset, original_documents_available: e.target.checked})}
                    className="rounded text-blue-600"
                  />
                  <span>Original Source Docs Available</span>
                </label>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-600/10 transition cursor-pointer"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shortlist Explanation Modal */}
      {showShortlistModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Shortlist for Benchmark</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">EXPLAIN WHY THIS DATASET IS SUITABLE FOR SFT BENCHMARKING</p>
              </div>
              <button 
                onClick={() => setShowShortlistModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Target Rank (Position in shortlist comparison list)</label>
                <input
                  type="number"
                  min={1}
                  value={shortlistRank}
                  onChange={(e) => setShortlistRank(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Research Suitability Explanation *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this dataset has been shortlisted (e.g. contains clean high-density entity labels, covers central high court statutes, has clear verified open-source licensing)..."
                  value={shortlistReason}
                  onChange={(e) => setShortlistReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-5 -mb-5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowShortlistModal(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!shortlistReason}
                  onClick={submitShortlist}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-600/10 transition disabled:opacity-50 cursor-pointer"
                >
                  Shortlist Dataset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetDiscovery;
