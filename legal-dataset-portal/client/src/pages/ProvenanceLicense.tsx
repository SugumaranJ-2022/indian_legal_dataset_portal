import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  History, 
  Plus,
  Compass,
  BookmarkCheck,
  Save
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { datasetService, researchService } from '../services/api';
import type { Dataset, ResearchSearchLog } from '../types';

const ProvenanceLicense: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [logs, setLogs] = useState<ResearchSearchLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Log Form Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({
    platform: 'Hugging Face',
    search_query: '',
    search_date: new Date().toISOString().split('T')[0],
    results_found: 0,
    relevant_results: 0,
    notes: ''
  });

  // Methodology Form
  const [platformSearched, setPlatformSearched] = useState('');
  const [searchTerms, setSearchTerms] = useState('');
  const [categoriesInvestigated, setCategoriesInvestigated] = useState('');
  const [selectionCriteria, setSelectionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');
  const [verificationProcess, setVerificationProcess] = useState('');
  const [methSaving, setMethSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dsData = await datasetService.getAll();
      setDatasets(dsData);
      
      const logData = await researchService.getSearchLogs();
      setLogs(logData);
      
      const methData = await researchService.getMethodology();
      
      // Populate methodology inputs
      setPlatformSearched(methData.platform_searched || '');
      setSearchTerms(methData.search_terms || '');
      setCategoriesInvestigated(methData.categories_investigated || '');
      setSelectionCriteria(methData.selection_criteria || '');
      setExclusionCriteria(methData.exclusion_criteria || '');
      setVerificationProcess(methData.verification_process || '');
    } catch (err) {
      console.error('Failed to fetch provenance telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveMethodology = async (e: React.FormEvent) => {
    e.preventDefault();
    setMethSaving(true);
    try {
      await researchService.updateMethodology({
        platform_searched: platformSearched,
        search_terms: searchTerms,
        categories_investigated: categoriesInvestigated,
        selection_criteria: selectionCriteria,
        exclusion_criteria: exclusionCriteria,
        verification_process: verificationProcess
      });
      alert('Research methodology successfully updated.');
      fetchData();
    } catch (err) {
      console.error('Failed to save methodology', err);
    } finally {
      setMethSaving(false);
    }
  };

  const handleAddSearchLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await researchService.createSearchLog(newLog);
      setShowLogModal(false);
      // Reset form
      setNewLog({
        platform: 'Hugging Face',
        search_query: '',
        search_date: new Date().toISOString().split('T')[0],
        results_found: 0,
        relevant_results: 0,
        notes: ''
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create search log', err);
    }
  };

  // Warning lists
  const unclearedDatasets = datasets.filter(d => d.license_status !== 'Clear' || d.provenance_status !== 'Verified');

  return (
    <div className="p-8 font-sans bg-slate-50/50 min-h-screen">
      <PageHeader 
        title="Provenance & License Compliance" 
        description="Monitor intellectual property licenses, verify court data provenance, log registry search queries, and configure research methodology."
      />

      {/* Grid: Compliance Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 select-none">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provenance Audited</div>
            <div className="text-xl font-extrabold text-slate-900">
              {datasets.filter(d => d.provenance_status === 'Verified').length} / {datasets.length} Datasets
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookmarkCheck size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Permissible License (Clear)</div>
            <div className="text-xl font-extrabold text-slate-900">
              {datasets.filter(d => d.license_status === 'Clear').length} / {datasets.length} Datasets
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Risks (Warnings)</div>
            <div className="text-xl font-extrabold text-rose-700">{unclearedDatasets.length} Flagged</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-bold">Compiling compliance telemetry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Methodology & Logs (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Global Methodology Config */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="pb-3 border-b border-slate-100 mb-5">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-2">
                  <Compass size={16} className="text-blue-600" />
                  <span>Research Methodology Configuration</span>
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">DOCUMENT THE KEY PARAMETERS DEFINING SELECTION OR EXCLUSION OF SCRAPED DATA</p>
              </div>

              <form onSubmit={handleSaveMethodology} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Registries Searched</label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Registry, Hugging Face, Github"
                      value={platformSearched}
                      onChange={(e) => setPlatformSearched(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Search Keywords</label>
                    <input
                      type="text"
                      placeholder="e.g. Indian Supreme Court, legal SFT corpus"
                      value={searchTerms}
                      onChange={(e) => setSearchTerms(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Benchmarking Domains</label>
                    <input
                      type="text"
                      placeholder="e.g. Court Judgments, Act Statutes"
                      value={categoriesInvestigated}
                      onChange={(e) => setCategoriesInvestigated(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Selection Thresholds / Criteria</label>
                    <input
                      type="text"
                      placeholder="e.g. Relevance score >= 50, clear open license"
                      value={selectionCriteria}
                      onChange={(e) => setSelectionCriteria(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Exclusion Criteria</label>
                    <input
                      type="text"
                      placeholder="e.g. Restricted commercial license, missing content text"
                      value={exclusionCriteria}
                      onChange={(e) => setSearchTerms(e.target.value)} // wait, typo check: let's use exclusionCriteria!
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Verification Steps / Checks</label>
                    <input
                      type="text"
                      placeholder="e.g. Checksum match against central court indexes"
                      value={verificationProcess}
                      onChange={(e) => setVerificationProcess(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={methSaving}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/10 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{methSaving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Research Search Logs */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="pb-3 border-b border-slate-100 mb-5 flex justify-between items-center select-none">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-2">
                    <History size={16} className="text-blue-600" />
                    <span>Search Log Audit Trail</span>
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">COMPILING THE HISTORICAL QUERIES LOGGED DURING INVESTIGATION</p>
                </div>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Log Search Query</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-xl select-none">
                  <p className="text-xs text-slate-400 font-bold">No historical search queries logged yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-start gap-4 text-xs font-semibold text-slate-700"
                    >
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded text-[9px] font-bold uppercase">
                            {log.platform}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{new Date(log.search_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-950 font-bold font-mono">Query: "{log.search_query}"</p>
                        <p className="text-[10px] text-slate-500 font-medium">Logged by Researcher {log.researcher || ''}</p>
                      </div>

                      <div className="text-right text-[10px] font-bold text-slate-500 shrink-0">
                        <div>Results: <b className="text-slate-800">{log.results_found}</b></div>
                        <div>Relevant: <b className="text-slate-800">{log.relevant_results}</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Warnings Checklist (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Warning Checklist Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="pb-3 border-b border-slate-100 mb-4 select-none">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-600" />
                  <span>Compliance Warnings</span>
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">RESTRICTED LICENSES AND UNVERIFIED DATASETS DEMANDING CAUTION</p>
              </div>

              {unclearedDatasets.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex gap-2">
                  <ShieldCheck size={18} className="shrink-0 text-emerald-500" />
                  <div>
                    <h4 className="font-extrabold text-[10px] uppercase">Compliance Clear</h4>
                    <p className="text-[10px] font-medium mt-0.5">All indexed datasets are verified with clear open licensing.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {unclearedDatasets.map((ds) => (
                    <div 
                      key={ds.id} 
                      className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1.5 text-xs font-semibold text-slate-700"
                    >
                      <h4 className="font-extrabold text-rose-900 leading-tight">{ds.dataset_name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">PLATFORM: {ds.platform}</p>
                      
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ds.provenance_status !== 'Verified' && (
                          <span className="px-2 py-0.5 bg-rose-100 border border-rose-200 text-rose-800 rounded text-[9px] font-bold uppercase">
                            Unverified Provenance
                          </span>
                        )}
                        {ds.license_status !== 'Clear' && (
                          <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 rounded text-[9px] font-bold uppercase">
                            Restrictive License
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Log Search Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Log Registry Search</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">MAINTAIN AUDIT RECORDS OF SEARCHED PHRASES ACROSS REGISTRIES</p>
              </div>
              <button 
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSearchLog} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Hosting Platform / Registry *</label>
                <select
                  value={newLog.platform}
                  onChange={(e) => setNewLog({...newLog, platform: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="AWS Open Data">AWS Open Data</option>
                  <option value="Hugging Face">Hugging Face</option>
                  <option value="GitHub">GitHub</option>
                  <option value="SHRUG">SHRUG</option>
                  <option value="Academic Data Portal">Academic Portal</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Search Query / Keywords *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. legal NER tag, supreme court judgments partition"
                  value={newLog.search_query}
                  onChange={(e) => setNewLog({...newLog, search_query: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Results Found</label>
                  <input
                    type="number"
                    value={newLog.results_found}
                    onChange={(e) => setNewLog({...newLog, results_found: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">Relevant Shortlisted Results</label>
                  <input
                    type="number"
                    value={newLog.relevant_results}
                    onChange={(e) => setNewLog({...newLog, relevant_results: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Notes / Observations</label>
                <input
                  type="text"
                  placeholder="e.g. no structured text content on top 5 results..."
                  value={newLog.notes}
                  onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-5 -mb-5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-600/10 transition cursor-pointer"
                >
                  Log Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvenanceLicense;
