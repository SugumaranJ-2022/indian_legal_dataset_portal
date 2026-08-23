import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { auditService } from '../services/api';
import type { AuditLog } from '../types';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (isSync = false) => {
    if (isSync) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await auditService.getAll();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-8 font-sans">
      <PageHeader
        title="Action Audit Logs"
        description="Verify the chronological log of all ingestion, metadata changes, and quality review events."
        actions={
          <button
            onClick={() => fetchLogs(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Logs</span>
          </button>
        }
      />

      <div className="glass-panel rounded-2xl shadow-md overflow-hidden bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-20 select-none">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl m-4 select-none">
            <AlertCircle className="text-slate-400 mx-auto mb-3" size={40} />
            <h4 className="text-sm font-bold text-slate-800 uppercase">No Logs Recorded</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">All historical user audit logs will display here as events trigger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">User Email</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Previous State</th>
                  <th className="py-3 px-6">New State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition">
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{log.user_email}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">
                      {log.entity} {log.entity_id ? `(ID: ${log.entity_id})` : ''}
                    </td>
                    <td className="py-4 px-6 text-xs text-red-600 font-medium max-w-xs truncate italic">
                      {log.previous_value || 'None'}
                    </td>
                    <td className="py-4 px-6 text-xs text-emerald-600 font-medium max-w-xs truncate">
                      {log.new_value || 'None'}
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

export default AuditLogs;
