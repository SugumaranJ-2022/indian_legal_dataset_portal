import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  FileText, 
  FileSpreadsheet, 
  Loader2, 
  BookOpen, 
  AlertCircle, 
  CheckCircle,
  Database,
  ShieldAlert,
  Gavel,
  BookOpenCheck
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { reportService } from '../services/api';
import type { ReportTelemetry } from '../types';

const Reports: React.FC = () => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<ReportTelemetry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const data = await reportService.getTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error('Failed to fetch report telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);
  
  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try {
      await reportService.downloadPdf();
    } catch (err) {
      console.error(err);
      alert('Could not download PDF report.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExcelDownload = async () => {
    setExcelLoading(true);
    try {
      await reportService.downloadExcel();
    } catch (err) {
      console.error(err);
      alert('Could not export Excel database.');
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="p-8 font-sans">
      <PageHeader
        title="Reports Compiler"
        description="Compile comprehensive data audits, statistics sheets, and verification indexes for legal research teams."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Compiler controls (4 columns) */}
        <div className="lg:col-span-4 space-y-6 select-none">
          {/* PDF Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-md border border-slate-200/80 flex flex-col gap-4 bg-white">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl shrink-0">
                <FileText size={24} className="stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight uppercase">PDF Ingestion Audit</h3>
                <p className="text-[9px] text-slate-400 font-bold tracking-wide mt-0.5">A4 PORTRAIT FORMAT</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Generates a printable PDF publication mapping mapped sources, collection lists, verification checklists, duplicates detection, and findings.
            </p>
            <button
              onClick={handlePdfDownload}
              disabled={pdfLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition active:scale-[0.98] cursor-pointer"
            >
              {pdfLoading ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
              <span>Compile PDF Report</span>
            </button>
          </div>

          {/* Excel Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-md border border-slate-200/80 flex flex-col gap-4 bg-white">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl shrink-0">
                <FileSpreadsheet size={24} className="stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight uppercase">Excel Spreadsheet</h3>
                <p className="text-[9px] text-slate-400 font-bold tracking-wide mt-0.5">MULTI-SHEET WORKBOOK</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Downloads a raw data workbook containing sheets for Sources, Documents, Metadata, Quality verification checks, and Duplicates resolution lists.
            </p>
            <button
              onClick={handleExcelDownload}
              disabled={excelLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/10 transition active:scale-[0.98] cursor-pointer"
            >
              {excelLoading ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
              <span>Export Excel Database</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Live Report Preview (8 columns) */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="glass-panel p-12 rounded-2xl shadow-md bg-white flex flex-col items-center justify-center select-none">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
              <span className="text-xs font-bold text-slate-500">Generating live report preview...</span>
            </div>
          ) : telemetry ? (
            <div className="glass-panel p-8 rounded-3xl border border-slate-200/80 shadow-lg bg-white space-y-6">
              {/* Report Cover Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center select-none">
                <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest">TASK 1 INTERNSHIP STUDY</span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1 font-sans">Indian Legal Dataset Ingestion & Research Report</h2>
                <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleDateString('en-IN')} • Confidential Ingestion Node</p>
              </div>

              {/* 1. Research Objective */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <BookOpenCheck size={14} className="text-blue-600" />
                  <span>1. Research Objective</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {telemetry.objective}
                </p>
              </div>

              {/* 2. Sources Identified */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <Database size={14} className="text-blue-600" />
                  <span>2. Sources Identified</span>
                </h4>
                <div className="overflow-hidden border border-slate-200/60 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Source Type</th>
                        <th className="py-2 px-3">Reliability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {telemetry.sources.map((s, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">
                              {s.name}
                            </a>
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-500">{s.type}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                              {s.reliability}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Ingestion Timeline Timeline & Density */}
              <div className="grid grid-cols-2 gap-4">
                {/* 4. Collected Documents */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <Gavel size={14} className="text-blue-600" />
                    <span>3. Initial Collection</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                      <span className="block text-lg font-black text-slate-900">{telemetry.total_documents}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Collected</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="block text-lg font-black text-emerald-700">{telemetry.verified_documents}</span>
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Verified</span>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                      <span className="block text-lg font-black text-amber-700">{telemetry.needs_review}</span>
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">Reviewing</span>
                    </div>
                    <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                      <span className="block text-lg font-black text-blue-700">{telemetry.pending_documents}</span>
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">Pending</span>
                    </div>
                  </div>
                </div>

                {/* 5. Documents per Category */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <BookOpen size={14} className="text-blue-600" />
                    <span>4. Category Distribution</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(telemetry.category_counts).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/40">
                        <span className="font-semibold text-slate-600">{cat}</span>
                        <span className="font-bold text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Questionable Logs */}
              <div className="grid grid-cols-3 gap-4 select-none">
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center text-xs">
                  <span className="block text-md font-black text-red-700">{telemetry.duplicates_count}</span>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Duplicates</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center text-xs">
                  <span className="block text-md font-black text-amber-700">{telemetry.incomplete_count}</span>
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">Incomplete</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs">
                  <span className="block text-md font-black text-slate-700">{telemetry.corrupt_count}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Corrupt Files</span>
                </div>
              </div>

              {/* Findings Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <ShieldAlert size={14} className="text-blue-600" />
                  <span>5. Key Findings</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5 font-medium leading-relaxed">
                  {telemetry.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Recommendations Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <CheckCircle size={14} className="text-blue-600" />
                  <span>6. Recommendations</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5 font-medium leading-relaxed">
                  {telemetry.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl shadow-md bg-white flex flex-col items-center justify-center select-none text-center">
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <span className="text-xs font-bold text-slate-800">Failed to generate preview.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
