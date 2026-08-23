import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  CheckSquare, 
  Square,
  FileText,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { documentService, qualityService } from '../services/api';
import type { Document, QualityCheck } from '../types';

const STATUS_VALUES = [
  'Verified',
  'Verified (Content-Level)',
  'Needs Review',
  'Questionable',
  'Duplicate',
  'Incomplete'
];

interface ChecklistItem {
  key: keyof Omit<QualityCheck, 'id' | 'document_id' | 'verification_status'>;
  label: string;
  description: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: 'official_source', label: 'Official Source Mapped', description: 'File sourced from official government gazette or registry node.' },
  { key: 'correct_title', label: 'Correct Title Verified', description: 'Title is correct and doesn\'t contain typos or wrong acts/sections.' },
  { key: 'correct_authority', label: 'Correct Authority Verified', description: 'The publishing Ministry, Department, or Court matches official records.' },
  { key: 'correct_year', label: 'Correct Year Verified', description: 'The publication or enactment year matches the document contents.' },
  { key: 'correct_language', label: 'Correct Language Verified', description: 'Document language is marked correctly.' },
  { key: 'complete_content', label: 'Complete Content Pack', description: 'Verify no schedules, tables, pages, or sections are missing.' },
  { key: 'no_missing_pages', label: 'No Missing Pages', description: 'All pages are present and readable from start to finish.' },
  { key: 'readable', label: 'Readable PDF File', description: 'PDF text layer is extractable and passes layout checks.' },
  { key: 'pdf_opens_correctly', label: 'PDF Opens Correctly', description: 'File binary opens without rendering errors or missing parts.' },
  { key: 'no_obvious_corruption', label: 'No Obvious Corruption', description: 'No binary corruption, broken fonts, or unreadable artifacts.' },
  { key: 'not_duplicate', label: 'Not Duplicate', description: 'Verified that this document is not a duplicate of another existing record.' },
  { key: 'metadata_complete', label: 'Metadata Complete', description: 'All mandatory citation fields are fully populated.' },
  { key: 'exact_source_url_recorded', label: 'Exact Source URL Recorded', description: 'The exact URL where the document was originally published is saved.' },
  { key: 'duplicate_checked', label: 'Deduplication Checked', description: 'Deduplication warnings verified.' },
  { key: 'version_verified', label: 'Version Control Active', description: 'Version number and amendment dates are verified.' },
];

const QualityVerification: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = localStorage.getItem('override_role') || user.role || 'researcher';
  const isLocked = userRole === 'researcher';

  // Filters & Search
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Doc Checklist State
  const [qc, setQc] = useState<QualityCheck | null>(null);
  const [qcLoading, setQcLoading] = useState(false);
  const [statusVal, setStatusVal] = useState<QualityCheck['verification_status']>('Needs Review');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getAll(search);
      setDocuments(data);
      
      // Update selected doc references
      if (selectedDoc) {
        const updated = data.find(d => d.id === selectedDoc.id);
        if (updated) {
          setSelectedDoc(updated);
        }
      } else if (data.length > 0) {
        setSelectedDoc(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load documents list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search]);

  // Fetch quality check status for the selected document
  const fetchQcStatus = async (docId: number) => {
    setQcLoading(true);
    try {
      const statusData = await qualityService.getStatus(docId);
      setQc(statusData);
      setStatusVal(statusData.verification_status);
    } catch (err) {
      console.error(err);
      setQc(null);
    } finally {
      setQcLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoc) {
      fetchQcStatus(selectedDoc.id);
    } else {
      setQc(null);
    }
  }, [selectedDoc]);

  // Toggle Checklist item checkbox
  const toggleCheck = (key: ChecklistItem['key']) => {
    if (!qc) return;
    setQc({
      ...qc,
      [key]: !qc[key]
    });
  };

  // Save quality checklist updates
  const handleSave = async () => {
    if (!selectedDoc || !qc) return;
    setSaveLoading(true);
    try {
      // Calculate automated status if all checks pass
      const allChecksPass = CHECKLIST_ITEMS.every(item => qc[item.key] === true);
      let nextStatus = statusVal;
      if (allChecksPass && statusVal === 'Needs Review') {
        nextStatus = 'Verified';
      }
      
      const updatedQc = await qualityService.update(selectedDoc.id, {
        official_source: qc.official_source,
        correct_title: qc.correct_title,
        correct_authority: qc.correct_authority,
        correct_year: qc.correct_year,
        correct_language: qc.correct_language,
        complete_content: qc.complete_content,
        no_missing_pages: qc.no_missing_pages,
        readable: qc.readable,
        pdf_opens_correctly: qc.pdf_opens_correctly,
        no_obvious_corruption: qc.no_obvious_corruption,
        not_duplicate: qc.not_duplicate,
        metadata_complete: qc.metadata_complete,
        exact_source_url_recorded: qc.exact_source_url_recorded,
        duplicate_checked: qc.duplicate_checked,
        version_verified: qc.version_verified,
        verification_status: nextStatus,
      });

      setQc(updatedQc);
      setStatusVal(updatedQc.verification_status);
      
      // Update local documents list to reflect the status change
      setDocuments(prev => prev.map(d => {
        if (d.id === selectedDoc.id) {
          return { ...d, status: nextStatus };
        }
        return d;
      }));
      
      // Keep selected doc state in sync
      setSelectedDoc(prev => prev ? { ...prev, status: nextStatus } : null);
      
      alert('Verification checklist successfully saved.');
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to save checklist audits.';
      alert(detail);
    } finally {
      setSaveLoading(false);
    }
  };

  // Helper: calculate completed check count
  const getChecksProgress = (checkObj: QualityCheck | null) => {
    if (!checkObj) return 0;
    return CHECKLIST_ITEMS.reduce((count, item) => checkObj[item.key] ? count + 1 : count, 0);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocs = documents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(documents.length / itemsPerPage);

  const completedChecks = getChecksProgress(qc);
  const progressPercent = Math.round((completedChecks / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="p-8">
      <PageHeader
        title="Quality Verification"
        description="Run manual checklists on documents to verify source integrity, read OCR texts, and compile data quality indexes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
        {/* Left Column: Documents List (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-xl shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search Title, Code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

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
                <ShieldCheck size={30} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No documents mapped yet.</p>
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
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-0.5 border border-slate-200">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{doc.document_code}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            doc.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                            'bg-red-500/10 text-red-600 border border-red-500/20'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5 leading-tight">{doc.title}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-1 uppercase">{doc.category}</p>
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

        {/* Right Column: Verification checklist panel (7 columns) */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <div className="glass-panel rounded-2xl shadow-md p-6 flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedDoc.document_code}</span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5 leading-tight">{selectedDoc.title}</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">{selectedDoc.category} • Year {selectedDoc.year}</p>
              </div>

              {qcLoading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              ) : qc ? (
                <div className="space-y-6">
                  {isLocked && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-3.5 rounded-xl text-xs flex gap-2.5 items-start">
                      <Info size={16} className="shrink-0 mt-0.5" />
                      <span>
                        <strong>Access Restricted:</strong> You are currently logged in with a <strong>Researcher</strong> role. Upgrades or modifications to verification audits are restricted to <strong>Reviewer</strong> and <strong>Admin</strong> privileges.
                      </span>
                    </div>
                  )}

                  {/* Progress Display */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className="flex justify-between items-center text-xs font-semibold mb-2">
                      <span className="text-slate-600">Checklist Audit Progress</span>
                      <span className="text-blue-700">{completedChecks} of {CHECKLIST_ITEMS.length} passed ({progressPercent}%)</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-teal-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist Items list */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quality Audits Checklist</h4>
                    <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-xl overflow-hidden bg-white">
                      {CHECKLIST_ITEMS.map((item) => {
                        const checked = qc[item.key] as boolean;
                        return (
                          <div 
                            key={item.key}
                            onClick={() => {
                              if (!isLocked) toggleCheck(item.key);
                            }}
                            className={`p-4 flex gap-3.5 items-start transition-all ${
                              isLocked 
                                ? 'opacity-75 cursor-not-allowed bg-slate-50/30' 
                                : 'hover:bg-slate-50/50 cursor-pointer'
                            }`}
                          >
                            <span className={`p-0.5 rounded transition ${checked ? 'text-blue-600' : 'text-slate-300'}`}>
                              {checked ? <CheckSquare size={18} className="stroke-[2.5]" /> : <Square size={18} className="stroke-[2.5]" />}
                            </span>
                            <div className="leading-tight">
                              <h5 className="text-xs font-bold text-slate-800 tracking-tight">{item.label}</h5>
                              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">{item.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Verification Status selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Info size={13} className="text-slate-400" />
                        <span>Audit Classification</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select final review status designation</p>
                    </div>
                    <select
                      value={statusVal}
                      disabled={isLocked}
                      onChange={(e) => setStatusVal(e.target.value as QualityCheck['verification_status'])}
                      className={`border border-slate-200 bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${
                        isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {STATUS_VALUES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Save Trigger Button */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saveLoading || isLocked}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all ${
                        isLocked 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {saveLoading && <Loader2 size={12} className="animate-spin" />}
                      <span>Save Verification Audits</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-red-500 font-medium">Checklist could not be loaded for this document.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl shadow-md h-[50vh] flex flex-col justify-center items-center text-center p-6 border-dashed border-slate-200 select-none">
              <ShieldCheck size={48} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Document Selected</h3>
              <p className="text-xs text-slate-400 font-medium max-w-xs mt-1 leading-normal">
                Select a document from the left list index to run checklist tests and commit audit classifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityVerification;
