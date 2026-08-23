import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Search, 
  Loader2, 
  FileText,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { documentService, courtMetadataService } from '../services/api';
import type { Document, CourtMetadata } from '../types';

const STATES = ['Delhi', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Kerala', 'Rajasthan'];
const CASE_STATUSES = ['Pending', 'Disposed', 'Decided', 'Adjourned', 'Dismissed'];

const CourtMetadataPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Doc Court Metadata Form States
  const [metadata, setMetadata] = useState<Partial<CourtMetadata>>({});
  const [metaLoading, setMetaLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch only documents under "Court Metadata" category
      const allDocs = await documentService.getAll(search, 'Court Metadata');
      setDocuments(allDocs);

      if (selectedDoc) {
        const updated = allDocs.find(d => d.id === selectedDoc.id);
        if (updated) setSelectedDoc(updated);
      } else if (allDocs.length > 0) {
        setSelectedDoc(allDocs[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load court documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search]);

  // Fetch court metadata values for selected document
  const fetchCourtMetadata = async (docId: number) => {
    setMetaLoading(true);
    try {
      const data = await courtMetadataService.getByDocId(docId);
      setMetadata(data);
    } catch (err) {
      console.error(err);
      setMetadata({
        cnr_number: '',
        case_number: '',
        case_type: '',
        court: '',
        state: '',
        district: '',
        petitioner: '',
        respondent: '',
        filing_date: '',
        hearing_date: '',
        disposal_date: '',
        judge: '',
        case_status: 'Pending',
      });
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoc) {
      fetchCourtMetadata(selectedDoc.id);
    } else {
      setMetadata({});
    }
  }, [selectedDoc]);

  // Form Field Change handler
  const handleFieldChange = (field: keyof CourtMetadata, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Form Submit Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setSaveLoading(true);
    try {
      const updated = await courtMetadataService.update(selectedDoc.id, metadata);
      setMetadata(updated);
      alert('Court case metadata successfully updated.');
    } catch (err) {
      console.error(err);
      alert('Failed to save court case metadata.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Filter documents locally by state, court, and status (which are properties of metadata, but we can query them)
  const filteredDocuments = documents.filter(doc => {
    // If local filters are active, check if document's metadata matches
    // Note: since documents fetch returns nested court_metadata, we check there
    if (stateFilter && doc.court_metadata?.state !== stateFilter) return false;
    if (courtFilter && !doc.court_metadata?.court?.toLowerCase().includes(courtFilter.toLowerCase())) return false;
    if (statusFilter && doc.court_metadata?.case_status !== statusFilter) return false;
    return true;
  });

  const currentDocs = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  return (
    <div className="p-8">
      <PageHeader
        title="Court Metadata Module"
        description="Verify CNR index filings, petitioner-respondent data, case categories, hearing schedules, and district records."
      />

      {/* Filters Panel */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search Case File..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
          >
            <option value="">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            type="text"
            placeholder="Filter Court..."
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none placeholder-slate-400 max-w-[120px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
        {/* Left Column: List (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
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
                <Scale size={30} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No court documents match query.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentDocs.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 border-l-4 ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-600'
                          : 'border-transparent hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="p-2 bg-slate-100 border border-slate-200 text-slate-500 mt-0.5 rounded-lg shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">CNR: {doc.court_metadata?.cnr_number || 'UNASSIGNED'}</span>
                        <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5 leading-tight">{doc.title}</h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-1">
                          <span>{doc.court_metadata?.court || 'High Court'}</span>
                          <span>{doc.court_metadata?.case_status || 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

        {/* Right Column: Court Metadata Editor Form (8 columns) */}
        <div className="lg:col-span-8">
          {selectedDoc ? (
            <div className="glass-panel rounded-2xl shadow-md p-6 flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File: {selectedDoc.document_code}</span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5 leading-tight">{selectedDoc.title}</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">CNR Number: {metadata.cnr_number || 'Not Registered'}</p>
              </div>

              {metaLoading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CNR Number</label>
                      <input
                        type="text"
                        value={metadata.cnr_number || ''}
                        onChange={(e) => handleFieldChange('cnr_number', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        placeholder="e.g. URUP010001232026"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Number</label>
                      <input
                        type="text"
                        value={metadata.case_number || ''}
                        onChange={(e) => handleFieldChange('case_number', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. WP 1234/2026"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Type</label>
                      <input
                        type="text"
                        value={metadata.case_type || ''}
                        onChange={(e) => handleFieldChange('case_type', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Writ Petition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</label>
                      <select
                        value={metadata.state || ''}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose State</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District</label>
                      <input
                        type="text"
                        value={metadata.district || ''}
                        onChange={(e) => handleFieldChange('district', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Lucknow"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Court</label>
                      <input
                        type="text"
                        value={metadata.court || ''}
                        onChange={(e) => handleFieldChange('court', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        placeholder="e.g. Allahabad High Court"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Petitioner</label>
                      <input
                        type="text"
                        value={metadata.petitioner || ''}
                        onChange={(e) => handleFieldChange('petitioner', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Union of India"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Respondent</label>
                      <input
                        type="text"
                        value={metadata.respondent || ''}
                        onChange={(e) => handleFieldChange('respondent', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. State of Uttar Pradesh"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filing Date</label>
                      <input
                        type="date"
                        value={metadata.filing_date || ''}
                        onChange={(e) => handleFieldChange('filing_date', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hearing Date</label>
                      <input
                        type="date"
                        value={metadata.hearing_date || ''}
                        onChange={(e) => handleFieldChange('hearing_date', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disposal Date</label>
                      <input
                        type="date"
                        value={metadata.disposal_date || ''}
                        onChange={(e) => handleFieldChange('disposal_date', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judge(s)</label>
                      <input
                        type="text"
                        value={metadata.judge || ''}
                        onChange={(e) => handleFieldChange('judge', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Hon'ble Justice D.Y. Chandrachud"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Status</label>
                      <select
                        value={metadata.case_status || 'Pending'}
                        onChange={(e) => handleFieldChange('case_status', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wide flex items-center gap-1">
                      <Info size={12} />
                      <span>Data maps to PostgreSQL `court_metadata`</span>
                    </span>
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/10 transition"
                    >
                      {saveLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>Save Case Records</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl shadow-md h-[50vh] flex flex-col justify-center items-center text-center p-6 border-dashed border-slate-200 select-none">
              <Scale size={48} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Court Document Selected</h3>
              <p className="text-xs text-slate-400 font-medium max-w-xs mt-1 leading-normal">
                Select a court file from the left index list to review CNR identifiers, state jurisdiction, and judge panels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtMetadataPage;
