import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Database, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { exportService } from '../services/api';

const EXPORT_TYPES = [
  { id: 'sources', name: 'Source Registry List', description: 'Complete list of mapped government gazettes, URL endpoints, reliability levels, and verification status.', icon: Database },
  { id: 'documents', name: 'Document Metadata List', description: 'Catalogue of ingested legal documents with titles, authorities, dates, and version identifiers.', icon: FileText },
  { id: 'questionable', name: 'Questionable Files List', description: 'Audit list of files flagged with quality issues, corruption warnings, or missing page indicators.', icon: ShieldAlert },
  { id: 'duplicates', name: 'Duplicate Match Logs', description: 'Resolution log of exact-binary SHA-256 and duplicate-title candidates.', icon: AlertCircle },
  { id: 'complete', name: 'Complete Combined Dataset', description: 'Comprehensive master sheet merging documents, quality audit checklist, and court case metadata.', icon: FileSpreadsheet }
];

const ExportsManager: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: string, format: string) => {
    const key = `${type}-${format}`;
    setDownloading(key);
    try {
      await exportService.download(type, format);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to download export spreadsheet.';
      alert(detail);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-8 font-sans">
      <PageHeader
        title="Telemetry Data Exports"
        description="Extract and download verified datasets, crawler mapping logs, and de-duplication warnings in CSV, Excel, or JSON formats."
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl font-sans">
        {EXPORT_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="glass-panel p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition bg-white select-none">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Icon size={24} className="stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{item.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                <button
                  disabled={downloading !== null}
                  onClick={() => handleDownload(item.id, 'csv')}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-55"
                >
                  {downloading === `${item.id}-csv` ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  <span>CSV</span>
                </button>
                <button
                  disabled={downloading !== null}
                  onClick={() => handleDownload(item.id, 'excel')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-55"
                >
                  {downloading === `${item.id}-excel` ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  <span>Excel</span>
                </button>
                <button
                  disabled={downloading !== null}
                  onClick={() => handleDownload(item.id, 'json')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-55"
                >
                  {downloading === `${item.id}-json` ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  <span>JSON</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExportsManager;
