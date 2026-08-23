import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { documentService } from '../services/api';
import type { Document } from '../types';

const QuestionableReviews: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuestionableDocs = async (isSync = false) => {
    if (isSync) setRefreshing(true);
    else setLoading(true);
    try {
      const allDocs = await documentService.getAll(search);
      // Filter questionable: status is Needs Review, Rejected, Duplicate, or Incomplete
      const questionable = allDocs.filter(d => 
        d.status === 'Needs Review' || 
        d.status === 'Rejected' || 
        d.status === 'Duplicate' || 
        d.status === 'Incomplete' || 
        d.quality_status === 'Needs Review' ||
        d.duplicate_status === 'Duplicate'
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

  return (
    <div className="p-8 font-sans">
      <PageHeader
        title="Questionable Files Panel"
        description="Review collected documents flagged as incomplete, corrupt, unreadable, or potential duplicates."
        actions={
          <button
            onClick={() => fetchQuestionableDocs(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Panel</span>
          </button>
        }
      />

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search flagged documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
      </div>

      <div className="glass-panel rounded-2xl shadow-md overflow-hidden bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-20 select-none">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl m-4 select-none">
            <CheckCircle className="text-emerald-500 mx-auto mb-3" size={40} />
            <h4 className="text-sm font-bold text-slate-800 uppercase">All Files Healthy</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">No questionable, duplicate, or unverified files currently require action.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6">Doc Code</th>
                  <th className="py-3 px-6">Title</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Quality Issue</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/40 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">{doc.document_code}</td>
                    <td className="py-4 px-6 max-w-xs truncate">{doc.title}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                        <AlertTriangle size={14} />
                        <span>
                          {doc.duplicate_status === 'Duplicate' ? 'Potential Duplicate' : 
                           doc.corruption_status === 'Corrupted' ? 'File Corrupt' : 
                           doc.readability_status === 'Needs Review' ? 'Layout Unreadable' : 
                           'Metadata Incomplete'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        doc.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        doc.status === 'Duplicate' ? 'bg-slate-500/10 text-slate-600 border border-slate-500/20' :
                        'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate italic">
                      {doc.notes || 'No notes attached.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionableReviews;
