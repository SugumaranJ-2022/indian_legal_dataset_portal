import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  CheckCircle, 
  RefreshCw, 
  Loader2, 
  Filter, 
  Edit3
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { documentService } from '../services/api';
import type { Document } from '../types';

const ISSUE_REASONS = [
  { value: '', label: 'All Issue Reasons (12)' },
  { value: 'DUPLICATE', label: 'Duplicate / Redundant Document' },
  { value: 'BROKEN_FILE', label: 'Broken File / Corrupt PDF' },
  { value: 'MISSING_PAGES', label: 'Missing Pages / Incomplete' },
  { value: 'OCR_ERROR', label: 'OCR Extraction Failure' },
  { value: 'WRONG_DOCUMENT_TYPE', label: 'Wrong Document Type' },
  { value: 'WRONG_COURT', label: 'Wrong Court / Jurisdiction' },
  { value: 'WRONG_DATE', label: 'Incorrect Publication Date' },
  { value: 'UNKNOWN_SOURCE', label: 'Unknown Source / No Provenance' },
  { value: 'LICENSE_UNCLEAR', label: 'License Unclear / Restrictive' },
  { value: 'METADATA_ERROR', label: 'Metadata Incomplete / CNR Missing' },
  { value: 'LOW_QUALITY', label: 'Low Quality / Unreadable Scan' },
  { value: 'UNVERIFIED', label: 'Unverified Third-Party File' }
];

const QuestionableReviews: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [issueReasonFilter, setIssueReasonFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Review Modal states
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [reviewStatus, setReviewStatus] = useState('Needs Review');
  const [reviewNotes, setReviewNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const fetchQuestionableDocs = async (isSync = false) => {
    if (isSync) setRefreshing(true);
    else setLoading(true);
    try {
      const allDocs = await documentService.getAll(search);
      // Filter questionable: status is Needs Review, Rejected, Duplicate, Incomplete, or has quality flags
      const questionable = allDocs.filter(d => 
        d.status === 'Needs Review' || 
        d.status === 'Rejected' || 
        d.status === 'Duplicate' || 
        d.status === 'Incomplete' || 
        d.status === 'Questionable' ||
        d.quality_status === 'Needs Review' ||
        d.duplicate_status === 'Duplicate' ||
        d.readability_status === 'Needs Review' ||
        d.corruption_status === 'Corrupted'
      );
      setDocs(questionable);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestionableDocs();
  }, [search]);

  // Determine doc primary issue reason
  const getDocIssue = (doc: Document): { code: string; label: string; color: string } => {
    if (doc.duplicate_status === 'Duplicate') {
      return { code: 'DUPLICATE', label: 'Potential Duplicate', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (doc.corruption_status === 'Corrupted') {
      return { code: 'BROKEN_FILE', label: 'Broken / Corrupt File', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (doc.missing_pages_status === 'Missing Pages') {
      return { code: 'MISSING_PAGES', label: 'Missing Pages', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (doc.readability_status === 'Needs Review') {
      return { code: 'OCR_ERROR', label: 'OCR / Readability Issue', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (!doc.court_name && doc.category === 'Court Judgments') {
      return { code: 'WRONG_COURT', label: 'Court Unassigned', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (!doc.document_date && !doc.year) {
      return { code: 'WRONG_DATE', label: 'Date Missing / Invalid', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    if (!doc.source_url) {
      return { code: 'UNKNOWN_SOURCE', label: 'Unknown Source Origin', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    return { code: 'METADATA_ERROR', label: 'Metadata Incomplete', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  // Filtered by dropdowns
  const filteredDocs = docs.filter((doc) => {
    if (statusFilter && doc.status !== statusFilter) return false;
    if (issueReasonFilter) {
      const issue = getDocIssue(doc);
      if (issue.code !== issueReasonFilter) return false;
    }
    return true;
  });

  const handleOpenReview = (doc: Document) => {
    setSelectedDoc(doc);
    setReviewStatus(doc.status);
    setReviewNotes(doc.notes || '');
  };

  const handleSaveReview = async () => {
    if (!selectedDoc) return;
    setSavingReview(true);
    try {
      await documentService.update(selectedDoc.id, {
        status: reviewStatus,
        notes: reviewNotes
      });
      setSelectedDoc(null);
      fetchQuestionableDocs();
    } catch (err) {
      console.error('Failed to update review status', err);
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="p-8 font-sans bg-slate-50/50 min-h-screen">
      <PageHeader
        title="Questionable Files & Anomaly Review"
        description="Review collected documents flagged across 12 issue categories including corruption, OCR extraction errors, duplicates, and missing metadata."
        actions={
          <button
            onClick={() => fetchQuestionableDocs(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Anomaly Index</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search flagged files by document code, title, category, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Issue Reason Filter (12 Reasons) */}
          <div className="relative">
            <select
              value={issueReasonFilter}
              onChange={(e) => setIssueReasonFilter(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-semibold text-slate-700 appearance-none cursor-pointer"
            >
              {ISSUE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <Filter size={11} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-semibold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="">All Review Statuses</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Incomplete">Incomplete</option>
              <option value="Rejected">Rejected</option>
              <option value="Verified">Verified / Resolved</option>
            </select>
            <Filter size={11} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3 select-none">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="text-xs font-bold text-slate-500">Checking document anomaly registers...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl m-6 select-none">
            <CheckCircle className="text-emerald-500 mx-auto mb-3" size={40} />
            <h4 className="text-sm font-extrabold text-slate-900 uppercase">No Matching Flagged Documents</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All documents are healthy or no records match the selected issue reason filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-medium text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Doc Code</th>
                  <th className="py-3 px-5">Document Title</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Flagged Anomaly Reason</th>
                  <th className="py-3 px-5">Current Status</th>
                  <th className="py-3 px-5">Audit Notes</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const issue = getDocIssue(doc);

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{doc.document_code}</td>
                      <td className="py-3.5 px-5 max-w-xs truncate font-semibold text-slate-800" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${issue.color}`}>
                          <AlertTriangle size={11} />
                          <span>{issue.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          doc.status === 'Needs Review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          doc.status === 'Duplicate' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 max-w-xs truncate text-[11px] text-slate-500 italic">
                        {doc.notes || 'No notes attached.'}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleOpenReview(doc)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs mx-auto"
                        >
                          <Edit3 size={11} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Review Flagged Document</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">CODE: {selectedDoc.document_code}</p>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Document Title</label>
                <p className="text-slate-900 font-bold text-sm mt-0.5">{selectedDoc.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Year / Publication</label>
                  <p className="text-slate-900 font-bold mt-0.5">{selectedDoc.year}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Category</label>
                  <p className="text-slate-900 font-bold mt-0.5">{selectedDoc.category}</p>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Set Resolution Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="Needs Review">Needs Review (Under ongoing investigation)</option>
                  <option value="Verified">Verified / Resolved (Cleared after manual check)</option>
                  <option value="Duplicate">Confirmed Duplicate (Mark for merge/removal)</option>
                  <option value="Rejected">Rejected (Corrupt, illegible or invalid document)</option>
                  <option value="Incomplete">Incomplete (Missing pages or truncated text)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Resolution & Audit Notes *</label>
                <textarea
                  rows={3}
                  placeholder="Record why this document was cleared or rejected (e.g. matched against court portal, verified hash, confirmed duplicate)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingReview}
                  onClick={handleSaveReview}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-600/10 transition cursor-pointer disabled:opacity-50"
                >
                  {savingReview ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionableReviews;
