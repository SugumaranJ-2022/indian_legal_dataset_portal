import React, { useState } from 'react';
import { 
  FileDown, 
  FileText, 
  FileSpreadsheet, 
  Loader2, 
  BookOpen
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { reportService } from '../services/api';

const Reports: React.FC = () => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  
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

  const pdfDeliverables = [
    { title: 'Official Cover Page', desc: 'A4 Portrait corporate title layout with date and metadata classifications.' },
    { title: 'Table of Contents', desc: 'Dynamic navigation indexes matching all report sections.' },
    { title: 'Executive Summary', desc: 'Narrative summary explaining portal objectives and mapping status.' },
    { title: 'Source Registries Mapped', desc: 'Table indexing mapped websites, authority and URL links.' },
    { title: 'Compiled Legal Documents', desc: 'Listing of collected Acts, Rules and Judgments.' },
    { title: 'Quality Check Audits', desc: 'Checker checklist summary displaying passes / failures.' },
    { title: 'Duplicates Warning Report', desc: 'Flagged duplicates list and conflict resolution records.' },
    { title: 'Analytics Statistics & Findings', desc: 'Telemetry counts summary and manual data Recommendations.' }
  ];

  return (
    <div className="p-8">
      <PageHeader
        title="Reports Compiler"
        description="Compile comprehensive data audits, statistics sheets, and verification indexes for legal research teams."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
        {/* Left Column: Compiler controls (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* PDF Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-md border border-slate-200/80 flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl shrink-0">
              <FileText size={32} className="stroke-[2]" />
            </div>
            <div className="flex-1 space-y-3.5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">PDF Audit Report Compiler</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">A4 PORTRAIT FORMAT • CONFIDENTIAL DATA AUDIT STANDARD</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Generates a printable PDF publication mapping mapped sources, collection lists, verification checklists, duplicates detection, and findings.
              </p>
              <button
                onClick={handlePdfDownload}
                disabled={pdfLoading}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 transition active:scale-[0.98]"
              >
                {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                <span>Compile PDF Report</span>
              </button>
            </div>
          </div>

          {/* Excel Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-md border border-slate-200/80 flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl shrink-0">
              <FileSpreadsheet size={32} className="stroke-[2]" />
            </div>
            <div className="flex-1 space-y-3.5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">Excel Spreadsheet Exporter</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">XLSX MULTI-SHEET WORKBOOK • FULL SCHEMA EXPORT</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Downloads a raw data workbook containing sheets for Sources, Documents, Metadata, Quality verification checks, and Duplicates resolution lists.
              </p>
              <button
                onClick={handleExcelDownload}
                disabled={excelLoading}
                className="flex items-center gap-2 px-5 py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-700/10 transition active:scale-[0.98]"
              >
                {excelLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                <span>Export Data Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: PDF Deliverables list (5 columns) */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="text-slate-400" size={16} />
              <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">PDF Report Table of Contents</h4>
            </div>

            <div className="space-y-3">
              {pdfDeliverables.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs leading-tight">
                  <span className="bg-blue-50 border border-blue-100 text-blue-600 p-0.5 rounded-full font-bold text-[9px] shrink-0 mt-0.5 h-4 w-4 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-800 tracking-tight">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
