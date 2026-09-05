import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon,
  CheckCircle,
  Edit2,
  ListFilter,
  Grid,
  List,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { gapService } from '../services/api';
import type { GapAnalysis } from '../types';

const GapAnalysisPage: React.FC = () => {
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'table'>('matrix');
  const [filterPriority, setFilterPriority] = useState('');

  // Modal edit states
  const [editGap, setEditGap] = useState<GapAnalysis | null>(null);
  const [priority, setPriority] = useState('Medium');
  const [availability, setAvailability] = useState('Medium');
  const [gapText, setGapText] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [evidence, setEvidence] = useState('');
  const [currentState, setCurrentState] = useState('');

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await gapService.getAll();
      setGaps(data);
    } catch (err) {
      console.error('Failed to fetch gaps', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  const handleOpenEdit = (gap: GapAnalysis) => {
    setEditGap(gap);
    setPriority(gap.priority);
    setAvailability(gap.availability);
    setGapText(gap.gap || '');
    setRecommendation(gap.recommendation || '');
    setEvidence(gap.evidence || '');
    setCurrentState(gap.current_state || '');
  };

  const handleSaveGap = async () => {
    if (!editGap) return;
    try {
      await gapService.update(editGap.id, {
        priority,
        availability,
        gap: gapText,
        recommendation,
        evidence,
        current_state: currentState
      });
      setEditGap(null);
      fetchGaps();
    } catch (err) {
      console.error('Failed to save gap update', err);
    }
  };

  const getPriorityBadgeClass = (level: string) => {
    if (level === 'Critical') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (level === 'High') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (level === 'Medium') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const getAvailabilityClass = (level: string) => {
    if (level === 'High') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (level === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const filteredGaps = gaps.filter(g => !filterPriority || g.priority === filterPriority);

  return (
    <div className="p-8 font-sans bg-slate-50/50 min-h-screen">
      <PageHeader 
        title="Coverage Gap Matrix & Guidance" 
        description="Comprehensive 15-category evaluation comparing existing public dataset availability against unmet research collection requirements."
      />

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 select-none">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertOctagon size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Priority Gaps</div>
            <div className="text-xl font-extrabold text-slate-900">{gaps.filter(g => g.priority === 'Critical').length}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Priority Gaps</div>
            <div className="text-xl font-extrabold text-slate-900">{gaps.filter(g => g.priority === 'High').length}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Availability Areas</div>
            <div className="text-xl font-extrabold text-slate-900">{gaps.filter(g => g.availability === 'High').length}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluated Categories</div>
            <div className="text-xl font-extrabold text-slate-900">{gaps.length}</div>
          </div>
        </div>
      </div>

      {/* "What We Should NOT Collect" Guidance Banner (Requirement 29) */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 bg-amber-600 text-white rounded-lg">
            <AlertTriangle size={16} />
          </span>
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">
            Authoritative Directive: What We Should NOT Collect
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-extrabold ml-auto">
            RESOURCE OPTIMIZATION
          </span>
        </div>
        
        <p className="text-xs text-amber-900/90 font-medium leading-relaxed mb-4">
          To prevent redundant engineering effort, avoid scraping risks, and respect legal terms of service, the following datasets are considered fully covered by existing open repositories and MUST NOT be collected from scratch:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200/70 shadow-2xs">
            <span className="font-extrabold text-amber-950 block">1. High Court Judgment Archives</span>
            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-normal">
              <b>13M+ judgment records (1950–2024)</b> already indexed in the AWS Open Data High Court Judgments corpus. Re-crawling High Court portals wastes bandwidth.
            </p>
          </div>

          <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200/70 shadow-2xs">
            <span className="font-extrabold text-amber-950 block">2. Supreme Court Historical Cases</span>
            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-normal">
              <b>100K+ Supreme Court records (1950–2024)</b> exist in AWS Open Data with structured JSON and clean English text. Direct reuse is recommended.
            </p>
          </div>

          <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200/70 shadow-2xs">
            <span className="font-extrabold text-amber-950 block">3. Baseline NLP Tasks</span>
            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-normal">
              Legal classification (ILDC), summarization (IN-Abs, CivilSum), and QA benchmarks (IndicLegalQA) already exist in Hugging Face. Re-benchmarking should use established datasets.
            </p>
          </div>

          <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200/70 shadow-2xs">
            <span className="font-extrabold text-amber-950 block">4. Central Acts Full-Text</span>
            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-normal">
              Open India Law and India Code already provide 1,200+ Central Acts. Only amended enactments and state statutes need custom attention.
            </p>
          </div>

          <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200/70 shadow-2xs">
            <span className="font-extrabold text-amber-950 block">5. Ambiguous Commercial Portals</span>
            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-normal">
              Do NOT scrape commercial aggregators with unclear licensing (e.g. KanoonGPT / IndianKanoon) without explicit written licensing clearance.
            </p>
          </div>

          <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200/70 shadow-2xs">
            <span className="font-extrabold text-amber-950 block">6. Unverified Arbitrary Scrapes</span>
            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-normal">
              Never ingest PDF collections lacking CNR numbers, source hashes, or verifiable provenance chains back to court registry servers.
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm select-none">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid size={14} />
            <span>Category Gap Matrix (15 Rows)</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List size={14} />
            <span>Card Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter size={14} />
            <span>Compact Audit Table</span>
          </button>
        </div>

        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 appearance-none cursor-pointer font-medium"
          >
            <option value="">All Gap Priorities ({gaps.length})</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <ListFilter size={10} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Main Panel */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-bold">Compiling coverage assessments...</p>
        </div>
      ) : viewMode === 'matrix' ? (
        /* 15-Row Category Gap Matrix Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-xs font-semibold text-slate-700 border-collapse table-auto min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-800">
                <th className="p-4 text-left font-extrabold w-48">Legal Category</th>
                <th className="p-4 text-center font-extrabold w-28">Availability</th>
                <th className="p-4 text-center font-extrabold w-28">Gap Priority</th>
                <th className="p-4 text-left font-extrabold w-64">Current Public State</th>
                <th className="p-4 text-left font-extrabold w-72">Identified Gaps / Deficits</th>
                <th className="p-4 text-left font-extrabold">Actionable Strategy</th>
                <th className="p-4 text-center font-extrabold w-16">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGaps.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900 align-top">
                    {g.category}
                  </td>
                  <td className="p-4 text-center align-top">
                    <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold ${getAvailabilityClass(g.availability)}`}>
                      {g.availability}
                    </span>
                  </td>
                  <td className="p-4 text-center align-top">
                    <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold ${getPriorityBadgeClass(g.priority)}`}>
                      {g.priority}
                    </span>
                  </td>
                  <td className="p-4 leading-relaxed text-slate-600 font-medium align-top">
                    {g.current_state || 'Not specified'}
                  </td>
                  <td className="p-4 leading-relaxed text-slate-800 font-medium align-top">
                    {g.gap || 'None reported'}
                  </td>
                  <td className="p-4 leading-relaxed text-blue-700 font-semibold align-top bg-blue-50/30">
                    {g.recommendation || 'Evaluate for potential collection.'}
                  </td>
                  <td className="p-4 text-center align-top">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition cursor-pointer shadow-2xs"
                      title="Edit assessment"
                    >
                      <Edit2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredGaps.map((g) => (
            <div 
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition"
            >
              <div className="p-6 pb-4 border-b border-slate-100 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-center gap-4">
                  <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold uppercase tracking-wide ${getAvailabilityClass(g.availability)}`}>
                    Availability: {g.availability}
                  </span>
                  <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold uppercase tracking-wide ${getPriorityBadgeClass(g.priority)}`}>
                    Priority: {g.priority}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition tracking-tight leading-tight">
                    {g.category}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2.5 line-clamp-3">
                    <b>Gap details:</b> {g.gap || 'No critical gaps mapped.'}
                  </p>
                  
                  {g.recommendation && (
                    <p className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100/50 p-2.5 rounded-lg mt-3 leading-normal font-semibold">
                      <b>Rec:</b> {g.recommendation}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-3.5 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(g)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Edit2 size={11} />
                  <span>Update Assessment</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-xs font-semibold text-slate-700 border-collapse table-auto min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-800">
                <th className="p-4 text-left font-extrabold">Category</th>
                <th className="p-4 text-center font-extrabold">Priority</th>
                <th className="p-4 text-center font-extrabold">Availability</th>
                <th className="p-4 text-left font-extrabold">Current State Details</th>
                <th className="p-4 text-left font-extrabold">Problems / Gaps</th>
                <th className="p-4 text-left font-extrabold">Actionable Recommendation</th>
                <th className="p-4 text-center font-extrabold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGaps.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/50 last:border-b-0">
                  <td className="p-4 font-bold text-slate-900">{g.category}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold ${getPriorityBadgeClass(g.priority)}`}>
                      {g.priority}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold ${getAvailabilityClass(g.availability)}`}>
                      {g.availability}
                    </span>
                  </td>
                  <td className="p-4 max-w-[200px] truncate leading-relaxed font-medium">{g.current_state || 'N/A'}</td>
                  <td className="p-4 max-w-[200px] truncate leading-relaxed font-medium">{g.gap || 'N/A'}</td>
                  <td className="p-4 max-w-[250px] truncate leading-relaxed font-medium">{g.recommendation || 'N/A'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-md transition cursor-pointer"
                    >
                      <Edit2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Gap Modal */}
      {editGap && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Update Gap Assessment</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">CATEGORY: {editGap.category.toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setEditGap(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Gap Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Critical">Critical Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Current Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="High">High Availability (Sufficient open sources)</option>
                    <option value="Medium">Medium Availability (Partially open/indexed)</option>
                    <option value="Low">Low Availability (Severely missing or paywalled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Current State Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. centralized High Court PDF registries exist, but they lack structured search..."
                  value={currentState}
                  onChange={(e) => setCurrentState(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Problems / Gaps Identified</label>
                <textarea
                  rows={2}
                  placeholder="Describe exact gaps (e.g. no regional language translations, missing PDF text layers, OCR is poor)..."
                  value={gapText}
                  onChange={(e) => setGapText(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Actionable Recommendation</label>
                <textarea
                  rows={2}
                  placeholder="e.g. implement custom High Court scrapy crawls, set up OCR pipelines..."
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Evidence Reference Citations</label>
                <input
                  type="text"
                  placeholder="e.g. Central HC registry link, SHRUG documentation..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-5 -mb-5 mt-5">
                <button
                  type="button"
                  onClick={() => setEditGap(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGap}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-600/10 transition cursor-pointer"
                >
                  Save Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GapAnalysisPage;
