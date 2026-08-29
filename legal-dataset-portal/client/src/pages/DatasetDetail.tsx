import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert,
  Percent, 
  FileCheck,
  AlertTriangle,
  ExternalLink,
  Plus,
  CheckCircle2,
  Layers,
  FileCode,
  Lock,
  UserCheck
} from 'lucide-react';
import { datasetService } from '../services/api';
import type { Dataset, DatasetEvidence } from '../types';

const DatasetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [evidenceList, setEvidenceList] = useState<DatasetEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'provenance' | 'score' | 'evidence'>('overview');
  
  // Current user role from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = localStorage.getItem('override_role') || user?.role || 'researcher';
  const isReviewerOrAdmin = userRole === 'reviewer' || userRole === 'admin';

  // Evidence Form Modal
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [newEvidence, setNewEvidence] = useState({
    source_type: 'Official Source',
    source_title: '',
    source_url: '',
    source_description: '',
    evidence_text: '',
    verified: false,
    notes: ''
  });
  
  // Update verification status notes
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('Approved');

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await datasetService.getById(parseInt(id));
      setDataset(data);
      const evData = await datasetService.getEvidence(parseInt(id));
      setEvidenceList(evData);
    } catch (err) {
      console.error('Error fetching dataset details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await datasetService.createEvidence(parseInt(id), newEvidence);
      setShowEvidenceModal(false);
      // Reset form
      setNewEvidence({
        source_type: 'Official Source',
        source_title: '',
        source_url: '',
        source_description: '',
        evidence_text: '',
        verified: false,
        notes: ''
      });
      fetchDetails();
    } catch (err) {
      console.error('Error adding evidence citation', err);
    }
  };

  const handleToggleVerifyEvidence = async (evidence: DatasetEvidence) => {
    if (!id) return;
    if (!isReviewerOrAdmin) {
      alert('Forbidden: Only Reviewers and Admins can verify evidence.');
      return;
    }

    try {
      await datasetService.updateEvidence(parseInt(id), evidence.id, {
        verified: !evidence.verified
      });
      fetchDetails();
    } catch (err) {
      console.error('Failed to verify evidence citation', err);
    }
  };

  const handleApproveDataset = async () => {
    if (!id || !dataset) return;
    if (!isReviewerOrAdmin) {
      alert('Forbidden: Only Reviewers and Admins can approve/verify datasets.');
      return;
    }

    try {
      await datasetService.update(parseInt(id), {
        status: approvalStatus,
        verification_notes: verificationNotes
      });
      setShowApprovalModal(false);
      fetchDetails();
    } catch (err) {
      console.error('Failed to verify dataset', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-40 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-bold">Retrieving dataset details...</p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl m-8">
        <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
        <h3 className="text-sm font-extrabold text-slate-900 uppercase">Dataset Not Found</h3>
        <button 
          onClick={() => navigate('/datasets')} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          Return to Discovery
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 font-sans bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/datasets')}
          className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dataset Landscape Detail</span>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none mt-0.5">{dataset.dataset_name}</h2>
        </div>
      </div>

      {/* Overview stats block */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
              {dataset.platform}
            </span>
            <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${
              dataset.status === 'Verified' || dataset.status === 'Approved'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-amber-50 border-amber-100 text-amber-700'
            }`}>
              {dataset.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-xl leading-relaxed">
            {dataset.description}
          </p>
        </div>

        {/* Action button */}
        <div className="flex gap-3 shrink-0">
          {isReviewerOrAdmin ? (
            <button
              onClick={() => {
                setVerificationNotes(dataset.verification_notes || '');
                setApprovalStatus(dataset.status === 'Approved' ? 'Verified' : 'Approved');
                setShowApprovalModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <UserCheck size={14} />
              <span>Verify / Approve Dataset</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold select-none">
              <Lock size={12} />
              <span>Safety Lock Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 select-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer -mb-[1px] ${
            activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={14} />
          <span>General Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('provenance')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer -mb-[1px] ${
            activeTab === 'provenance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Provenance & Licensing</span>
        </button>
        <button
          onClick={() => setActiveTab('score')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer -mb-[1px] ${
            activeTab === 'score' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent size={14} />
          <span>Relevance Score Analysis</span>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer -mb-[1px] ${
            activeTab === 'evidence' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck size={14} />
          <span>Verified Citations ({evidenceList.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-semibold text-slate-700">
            {/* Left Col: Specs */}
            <div className="space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 uppercase flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                <span>Dataset Specifications</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Short Name / Code</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.short_name}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Record Count</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.record_count ? dataset.record_count.toLocaleString() : 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Record Count Source</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.record_count_source || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Temporal Scope</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.time_period_start} – {dataset.time_period_end}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Courts Covered</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.courts || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Languages</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.languages || 'English'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Format</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.format || 'JSON'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Creator / Organization</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.creator} {dataset.organization ? `(${dataset.organization})` : ''}</p>
                </div>
              </div>
            </div>

            {/* Right Col: Scope */}
            <div className="space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 uppercase flex items-center gap-2">
                <FileCode size={16} className="text-blue-600" />
                <span>Scope Coverage Details</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Legal Domain Category</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.category} {dataset.subcategory ? `— ${dataset.subcategory}` : ''}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Jurisdictions</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.jurisdictions || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Metadata Fields Available</label>
                  <p className="text-slate-950 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[10px] mt-1 break-all">
                    {dataset.metadata_fields || 'No metadata fields documented.'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Coverage Scope Description</label>
                  <p className="text-slate-700 leading-relaxed font-medium mt-1">
                    {dataset.coverage_description || 'No detailed coverage description recorded.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'provenance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-semibold text-slate-700">
            {/* Left Col: Provenance */}
            <div className="space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 uppercase flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Source Provenance Verification</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Original Source</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.original_source || 'Not Documented'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Original Source URL</label>
                  <p className="text-slate-900 font-bold mt-0.5 truncate">
                    {dataset.original_source_url ? (
                      <a href={dataset.original_source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <span>Link</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : 'None'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection Method</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.collection_method || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Provenance Audit Status</label>
                  <p className={`text-slate-900 font-extrabold mt-0.5 ${dataset.provenance_status === 'Verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {dataset.provenance_status}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection / Curation Details</label>
                <p className="text-slate-700 leading-relaxed font-medium mt-1">
                  {dataset.collection_description || 'No description recorded.'}
                </p>
              </div>
            </div>

            {/* Right Col: License */}
            <div className="space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 uppercase flex items-center gap-2">
                <ShieldAlert size={16} className="text-blue-600" />
                <span>Licensing & Reuse Terms</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">License Name</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.license_name || 'Unspecified'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">License Status</label>
                  <p className={`text-slate-900 font-extrabold mt-0.5 ${dataset.license_status === 'Clear' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {dataset.license_status}
                  </p>
                </div>
              </div>

              {/* License permission checkboxes */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-[10px] font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Commercial Use Permissible</span>
                  <span className={dataset.commercial_use ? 'text-emerald-600' : 'text-rose-600'}>{dataset.commercial_use ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Redistribution Allowed</span>
                  <span className={dataset.redistribution_allowed ? 'text-emerald-600' : 'text-rose-600'}>{dataset.redistribution_allowed ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attribution Required</span>
                  <span className="text-slate-800">{dataset.attribution_required ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Derivative Works Allowed</span>
                  <span className={dataset.derivative_use ? 'text-emerald-600' : 'text-rose-600'}>{dataset.derivative_use ? 'YES' : 'NO'}</span>
                </div>
              </div>

              {dataset.license_status !== 'Clear' && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex gap-3 leading-relaxed">
                  <AlertTriangle size={18} className="shrink-0 text-rose-500" />
                  <div>
                    <h4 className="font-extrabold text-[10px] uppercase">Compliance Warning</h4>
                    <p className="text-[10px] font-medium mt-0.5">
                      This dataset has licensing constraints or lacks a verified open license. Commercial model fine-tuning may violate source Terms of Service.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'score' && (
          <div className="space-y-6 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-600 flex justify-center items-center font-extrabold text-lg text-blue-600 shrink-0">
                {dataset.research_relevance_score}%
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Calculated Research Relevance Score</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                  Relevance scores measure a dataset's compliance with model fine-tuning targets. Weightings: 
                  Provenance (25%), Coverage (20%), Metadata (15%), Document Availability (15%), Freshness (10%), License (10%), Documentation (5%).
                </p>
              </div>
            </div>

            {/* Score weights list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Attribute Score Breakdown</h4>
                
                {/* 1. Provenance */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span>Original Source Provenance (25% weight)</span>
                    <span className="font-extrabold">{dataset.provenance_status === 'Verified' ? '25%' : '0%'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: dataset.provenance_status === 'Verified' ? '100%' : '0%' }}></div>
                  </div>
                </div>

                {/* 2. License */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span>License Clarity (10% weight)</span>
                    <span className="font-extrabold">{dataset.license_status === 'Clear' ? '10%' : '0%'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: dataset.license_status === 'Clear' ? '100%' : '0%' }}></div>
                  </div>
                </div>

                {/* 3. Availability */}
                <div className="space-y-1">
                  {
                    (() => {
                      let avScore = 0;
                      if (dataset.text_available) avScore += 10;
                      if (dataset.original_documents_available) avScore += 5;
                      return (
                        <>
                          <div className="flex justify-between text-[10px]">
                            <span>Document Availability (15% weight)</span>
                            <span className="font-extrabold">{avScore}% / 15%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(avScore / 15) * 100}%` }}></div>
                          </div>
                        </>
                      );
                    })()
                  }
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Reuse Decision</h4>
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classification</div>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{dataset.reuse_classification}</p>
                  
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3">Why Selected / Action Plan</div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                    {dataset.why_selected || 'No recommendations recorded yet.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Citations & Verification Evidence</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">EVIDENCE ATTACHED BY RESEARCHERS AND CERTIFIED BY REVIEWERS</p>
              </div>
              <button
                onClick={() => setShowEvidenceModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Citation</span>
              </button>
            </div>

            {evidenceList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 select-none">
                <p className="text-xs text-slate-400 font-bold">No evidence citations added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidenceList.map((ev) => (
                  <div 
                    key={ev.id} 
                    className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex gap-2 items-center">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase">
                          {ev.source_type}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900">{ev.source_title}</h4>
                        {ev.source_url && (
                          <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-600 italic font-mono leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        "{ev.evidence_text}"
                      </p>
                      
                      {ev.notes && (
                        <p className="text-[10px] text-slate-500 font-semibold">Notes: {ev.notes}</p>
                      )}

                      {ev.verified && (
                        <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>Verified by Reviewer {ev.reviewer || ''} {ev.verified_at ? `on ${new Date(ev.verified_at).toLocaleDateString()}` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isReviewerOrAdmin ? (
                        <button
                          onClick={() => handleToggleVerifyEvidence(ev)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            ev.verified 
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {ev.verified ? 'Unverify' : 'Verify Citation'}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 border rounded-lg text-[9px] font-bold ${
                          ev.verified ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          {ev.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Attach Evidence Citation</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">PROVIDE LINKS AND EXTRACTS VERIFYING ORIGINAL SOURCE PROVENANCE</p>
              </div>
              <button 
                onClick={() => setShowEvidenceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Source Type</label>
                  <select
                    value={newEvidence.source_type}
                    onChange={(e) => setNewEvidence({...newEvidence, source_type: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Official Source">Official Government Source</option>
                    <option value="Registry Metadata">Registry Metadata</option>
                    <option value="Academic Publication">Academic Paper / Publication</option>
                    <option value="Git Manifest">Git Repository / Manifest</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Citation Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Registry Manifest"
                    value={newEvidence.source_title}
                    onChange={(e) => setNewEvidence({...newEvidence, source_title: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Source URL (Link to verification context)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newEvidence.source_url}
                  onChange={(e) => setNewEvidence({...newEvidence, source_url: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Evidence Text / Extract *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Paste exact verification text (e.g. bucket manifest details, license URL snippet, verified checksum hash)..."
                  value={newEvidence.evidence_text}
                  onChange={(e) => setNewEvidence({...newEvidence, evidence_text: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Researcher Notes / Comments</label>
                <input
                  type="text"
                  placeholder="Additional context or notes..."
                  value={newEvidence.notes}
                  onChange={(e) => setNewEvidence({...newEvidence, notes: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-5 -mb-5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-600/10 transition cursor-pointer"
                >
                  Save Citation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dataset Approval / Verification Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Dataset Audit Verification</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">AUTHORIZE DATASET VERIFICATION AND COMPILE TO LANDSCAPE INDEX</p>
              </div>
              <button 
                onClick={() => setShowApprovalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Verification Decision</label>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="Verified">Verified (Meets all original source audits)</option>
                  <option value="Approved">Approved (Shortlisted with minor caveats)</option>
                  <option value="Under Review">Under Review (Need further provenance citations)</option>
                  <option value="Rejected">Rejected / Disputed (Unverifiable license or fake provenance)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Audit Verification Notes *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record verification checklist findings, certificate hash matches, or license clearances..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-5 -mb-5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!verificationNotes}
                  onClick={handleApproveDataset}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-600/10 transition disabled:opacity-50 cursor-pointer"
                >
                  Sign & Authorize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetDetail;
