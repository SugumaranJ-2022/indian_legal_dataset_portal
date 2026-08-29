import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Check, 
  X, 
  Award,
  Layers
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { datasetService } from '../services/api';
import type { Dataset } from '../types';

const DatasetComparison: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await datasetService.getAll(undefined, undefined, undefined, undefined);
      // Filter to shortlisted by default, or just show all but pre-select shortlisted
      const shortlisted = data.filter(d => d.shortlisted);
      setDatasets(data);
      setSelectedIds(shortlisted.slice(0, 3).map(d => d.id)); // Pre-select first 3 shortlisted
    } catch (err) {
      console.error('Error fetching datasets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert('You can select a maximum of 4 datasets to compare side-by-side.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const comparedDatasets = datasets.filter(d => selectedIds.includes(d.id));

  // Specs helper for table rows
  const comparisonRows = [
    { label: 'Platform / Registry', key: 'platform' },
    { label: 'Category / Domain', key: 'category' },
    { label: 'Subcategory', key: 'subcategory' },
    { label: 'Record Count', render: (d: Dataset) => d.record_count ? d.record_count.toLocaleString() : 'Unknown' },
    { label: 'Time Period', render: (d: Dataset) => `${d.time_period_start || 'N/A'} – ${d.time_period_end || 'N/A'}` },
    { label: 'License Status', key: 'license_status' },
    { label: 'License Name', key: 'license_name' },
    { label: 'Provenance Verification', key: 'provenance_status' },
    { label: 'Freshness Status', key: 'freshness_status' },
    { label: 'Relevance Score', render: (d: Dataset) => `${d.research_relevance_score}%` },
    { label: 'Reuse Classification', key: 'reuse_classification' },
    { label: 'Text Available', render: (d: Dataset) => d.text_available ? <Check className="text-emerald-500 mx-auto" size={16} /> : <X className="text-slate-300 mx-auto" size={16} /> },
    { label: 'Metadata Available', render: (d: Dataset) => d.metadata_available ? <Check className="text-emerald-500 mx-auto" size={16} /> : <X className="text-slate-300 mx-auto" size={16} /> },
    { label: 'Original Source PDFs', render: (d: Dataset) => d.original_pdf_available ? <Check className="text-emerald-500 mx-auto" size={16} /> : <X className="text-slate-300 mx-auto" size={16} /> },
    { label: 'Known Limitations', key: 'limitations' },
    { label: 'Why Selected / Recommendation', key: 'why_selected' }
  ];

  return (
    <div className="p-8 font-sans bg-slate-50/50 min-h-screen">
      <PageHeader 
        title="Dataset Comparison Matrix" 
        description="Select and evaluate external legal datasets side-by-side across coverage, metadata quality, licenses, and benchmark scores."
      />

      {/* Dataset Selection panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8 select-none">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight mb-3 flex items-center gap-2">
          <Layers size={16} className="text-blue-600" />
          <span>Select Datasets to Compare (Max 4)</span>
        </h3>
        
        {loading ? (
          <p className="text-xs text-slate-400 font-bold">Loading selection list...</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {datasets.map((ds) => {
              const selected = selectedIds.includes(ds.id);
              return (
                <button
                  key={ds.id}
                  onClick={() => handleToggleSelect(ds.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selected 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {ds.shortlisted && <Award size={12} className={selected ? 'text-white' : 'text-amber-500'} />}
                  <span>{ds.short_name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison table */}
      {selectedIds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center select-none flex flex-col justify-center items-center gap-4">
          <GitCompare size={40} className="text-slate-300 stroke-[1.5]" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase">No Datasets Selected</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Select one or more datasets from the selection panel above to run comparison metrics.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-xs font-semibold text-slate-700 border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {/* Column header */}
                <th className="p-4 text-left font-extrabold text-slate-900 border-r border-slate-100 w-[200px]">Specification</th>
                
                {comparedDatasets.map((ds) => (
                  <th key={ds.id} className="p-4 text-center font-extrabold text-slate-900 border-r border-slate-100 last:border-r-0">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs leading-tight">{ds.dataset_name}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{ds.platform}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 last:border-b-0">
                  {/* Row title */}
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/30 border-r border-slate-100">{row.label}</td>
                  
                  {comparedDatasets.map((ds) => {
                    let cellVal: any = '';
                    if (row.render) {
                      cellVal = row.render(ds);
                    } else if (row.key) {
                      cellVal = (ds as any)[row.key];
                    }
                    
                    return (
                      <td key={ds.id} className="p-4 text-center border-r border-slate-100 last:border-r-0 leading-relaxed font-medium">
                        {cellVal || <span className="text-slate-300">N/A</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DatasetComparison;
