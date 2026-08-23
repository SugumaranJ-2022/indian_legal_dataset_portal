import React, { useState, useEffect } from 'react';
import { 
  CopyMinus, 
  Loader2, 
  AlertCircle,
  FileText,
  Check,
  RefreshCw
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { duplicateService } from '../services/api';
import type { Duplicate } from '../types';

const DuplicateDetection: React.FC = () => {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tracking action loaders for specific duplicate IDs
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const fetchDuplicates = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await duplicateService.getAll();
      setDuplicates(data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch potential duplicates list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleAction = async (id: number, action: 'Keep' | 'Mark Duplicate' | 'Needs Review') => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await duplicateService.updateAction(id, action);
      
      // Update local state list
      setDuplicates(prev => prev.map(d => d.id === id ? updated : d));
    } catch (err) {
      console.error(err);
      alert('Failed to update duplicate decision action.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Duplicate Detection"
        description="Verify potential duplicates identified by Title mapping and identical file hashes. Resolve conflict actions."
        actions={
          <button
            onClick={() => fetchDuplicates(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition"
          >
            <RefreshCw size={14} />
            <span>Sync Conflicts</span>
          </button>
        }
      />

      {/* Duplicate list panel */}
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
        ) : duplicates.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-medium">
            <CopyMinus size={40} className="mx-auto mb-2 opacity-50 text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-700">Duplicate Check Clear</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">No conflicts or overlapping files identified in current index directories.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-6">File Conflict Details</th>
                  <th className="py-3.5 px-6">Flagged Match Pair</th>
                  <th className="py-3.5 px-6">Overlapping Match Reason</th>
                  <th className="py-3.5 px-6 text-center">Conflict Status</th>
                  <th className="py-3.5 px-6 text-right">Deduplication Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {duplicates.map((dup) => {
                  const isProcessing = actionLoading[dup.id];
                  return (
                    <tr key={dup.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Original File */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg shrink-0 mt-0.5">
                            <FileText size={16} />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dup.document_code}</span>
                            <h5 className="text-xs font-bold text-slate-900 leading-tight mt-0.5 max-w-[200px] truncate">{dup.document_title}</h5>
                          </div>
                        </div>
                      </td>

                      {/* Duplicate File */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-lg shrink-0 mt-0.5">
                            <FileText size={16} />
                          </div>
                          <div>
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{dup.duplicate_document_code}</span>
                            <h5 className="text-xs font-bold text-slate-900 leading-tight mt-0.5 max-w-[200px] truncate">{dup.duplicate_document_title}</h5>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-6 text-slate-500 leading-relaxed max-w-[250px] truncate font-medium">
                        {dup.reason}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          dup.status === 'Resolved' 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {dup.status}
                        </span>
                      </td>

                      {/* Decision buttons */}
                      <td className="py-4 px-6 text-right space-x-1.5 shrink-0">
                        {dup.status === 'Resolved' ? (
                          <div className="flex justify-end items-center gap-1.5 text-slate-500 pr-2">
                            <Check size={14} className="text-emerald-500 stroke-[3]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Resolved: {dup.action}</span>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleAction(dup.id, 'Keep')}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-lg transition text-[10px] uppercase tracking-wider"
                              title="Keep both files in system"
                            >
                              Keep Both
                            </button>
                            <button
                              onClick={() => handleAction(dup.id, 'Mark Duplicate')}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition text-[10px] uppercase tracking-wider shadow-sm shadow-red-600/15"
                              title="Mark first file as duplicate of second"
                            >
                              Mark Duplicate
                            </button>
                          </div>
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

export default DuplicateDetection;
