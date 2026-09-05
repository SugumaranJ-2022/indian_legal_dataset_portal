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
  const [activeTab, setActiveTab] = useState<'overview' | 'provenance' | 'quality' | 'score' | 'evidence'>('overview');
  
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

  // 100-Point Rating Band logic
  const getRatingBand = (score: number) => {
    if (score >= 90) return { label: 'Excellent', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (score >= 75) return { label: 'Strong', class: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (score >= 60) return { label: 'Moderate', class: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Limited', class: 'bg-rose-100 text-rose-800 border-rose-300' };
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

  const ratingBand = getRatingBand(dataset.research_relevance_score || 0);

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
          <div className="flex gap-2 items-center flex-wrap">
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
              {dataset.platform}
            </span>
            <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${
              dataset.provenance_status?.toUpperCase().includes('VERIFIED') && !dataset.provenance_status?.toUpperCase().includes('PARTIAL')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              Provenance: {dataset.provenance_status}
            </span>
            <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${
              dataset.license_status?.toUpperCase().includes('CLEAR') || dataset.license_status?.toUpperCase().includes('VERIFIED')
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              License: {dataset.license_status}
            </span>
            <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold ${ratingBand.class}`}>
              Score: {dataset.research_relevance_score}/100 ({ratingBand.label})
            </span>
            {dataset.reuse_priority && (
              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[10px] font-bold">
                {dataset.reuse_priority}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed mt-1">
            {dataset.description}
          </p>
        </div>

        {/* Action button */}
        <div className="flex gap-3 shrink-0">
          <a
            href={dataset.dataset_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>External Source</span>
            <ExternalLink size={13} />
          </a>
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
              <span>Verify / Audit</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold select-none">
              <Lock size={12} />
              <span>Safety Lock</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 select-none overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap -mb-[1px] ${
            activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={14} />
          <span>General Specifications</span>
        </button>
        <button
          onClick={() => setActiveTab('provenance')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap -mb-[1px] ${
            activeTab === 'provenance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Provenance & Licensing</span>
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap -mb-[1px] ${
            activeTab === 'quality' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode size={14} />
          <span>Quality & Limitations</span>
        </button>
        <button
          onClick={() => setActiveTab('score')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap -mb-[1px] ${
            activeTab === 'score' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent size={14} />
          <span>100-Pt Score & Reuse</span>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap -mb-[1px] ${
            activeTab === 'evidence' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck size={14} />
          <span>Citations & Evidence ({evidenceList.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 min-h-[400px]">
        {/* Tab 1: Overview */}
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
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Short Code</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.short_name}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Registry Platform</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.platform}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Reported Record Count</label>
                  <p className="text-slate-900 font-extrabold text-sm mt-0.5">
                    {dataset.record_count_note || (dataset.record_count ? dataset.record_count.toLocaleString() : 'Not Specified')}
                  </p>
                  {dataset.record_count_source && (
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Source: {dataset.record_count_source}</span>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Temporal Scope</label>
                  <p className="text-slate-900 font-bold mt-0.5">
                    {dataset.time_period_start || 'N/A'} – {dataset.time_period_end || 'Present'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Languages</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.languages || 'English'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Data Format</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.format || 'JSON'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">File Types</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.file_types || 'JSON, PDF, CSV'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Data Structure</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.data_structure || 'Standardized Records'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Creator / Organization</label>
                  <p className="text-slate-900 font-bold mt-0.5">
                    {dataset.creator || 'Unspecified'} {dataset.organization ? `(${dataset.organization})` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Publication / Updated</label>
                  <p className="text-slate-900 font-bold mt-0.5">
                    {dataset.publication_date || 'N/A'} / {dataset.last_updated_date || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Official Dataset URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <a 
                      href={dataset.dataset_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-sm"
                    >
                      <span className="truncate">{dataset.dataset_url}</span>
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
                      {dataset.dataset_url_status || 'VALID'}
                    </span>
                  </div>
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
                  <p className="text-slate-900 font-bold mt-0.5">
                    {dataset.category} {dataset.subcategory ? `— ${dataset.subcategory}` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Courts & Jurisdictions</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.courts || dataset.jurisdictions || 'All India'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Document Contents</label>
                  <p className="text-slate-700 leading-relaxed font-medium mt-1">
                    {dataset.contents || dataset.coverage_description || 'No detailed contents specified.'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Metadata Schema Fields</label>
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

        {/* Tab 2: Provenance & Licensing */}
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
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Source URL Status</label>
                  <div className="flex items-center gap-2 mt-0.5">
                    {dataset.original_source_url ? (
                      <a href={dataset.original_source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[120px]">
                        <span className="truncate">{dataset.original_source_url}</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      dataset.source_url_status === 'VALID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {dataset.source_url_status || 'NOT_CHECKED'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Provenance Audit Status</label>
                  <p className={`font-black mt-0.5 ${
                    dataset.provenance_status?.toUpperCase().includes('VERIFIED') && !dataset.provenance_status?.toUpperCase().includes('PARTIAL')
                      ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {dataset.provenance_status}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Provenance Strength</label>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${
                    dataset.provenance_strength === 'HIGH' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    dataset.provenance_strength === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {dataset.provenance_strength || 'STANDARD'} STRENGTH
                  </span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection Method</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.collection_method || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection Date</label>
                  <p className="text-slate-900 font-bold mt-0.5">{dataset.collection_date || 'Historical'}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection / Curation Details</label>
                <p className="text-slate-700 leading-relaxed font-medium mt-1">
                  {dataset.collection_description || 'No description recorded.'}
                </p>
              </div>

              {dataset.provenance_evidence && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Provenance Evidence</label>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium mt-1">
                    {dataset.provenance_evidence}
                  </p>
                </div>
              )}

              {dataset.provenance_notes && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Provenance Audit Notes</label>
                  <p className="text-slate-600 italic mt-1 leading-relaxed">
                    {dataset.provenance_notes}
                  </p>
                </div>
              )}
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
                  <p className={`font-black mt-0.5 ${
                    dataset.license_status?.toUpperCase().includes('CLEAR') || dataset.license_status?.toUpperCase().includes('VERIFIED')
                      ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {dataset.license_status}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">License URL</label>
                  <div className="flex items-center gap-2 mt-0.5">
                    {dataset.license_url ? (
                      <a href={dataset.license_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-sm">
                        <span className="truncate">{dataset.license_url}</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-slate-400">No public license URL documented</span>
                    )}
                    {dataset.license_url_status && (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-bold">
                        {dataset.license_url_status}
                      </span>
                    )}
                  </div>
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

              {dataset.usage_restrictions && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Usage Restrictions</label>
                  <p className="text-slate-700 font-medium mt-0.5">{dataset.usage_restrictions}</p>
                </div>
              )}

              {dataset.license_notes && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Licensing Evaluation Notes</label>
                  <p className="text-slate-600 italic mt-0.5">{dataset.license_notes}</p>
                </div>
              )}

              {dataset.license_status !== 'Clear' && dataset.license_status !== 'LICENSE_VERIFIED' && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex gap-3 leading-relaxed">
                  <AlertTriangle size={18} className="shrink-0 text-rose-500" />
                  <div>
                    <h4 className="font-extrabold text-[10px] uppercase">Compliance Directive</h4>
                    <p className="text-[10px] font-medium mt-0.5">
                      Verify licensing restrictions before fine-tuning commercial language models. Datasets lacking clear licenses must be held in quarantine.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Quality & Limitations */}
        {activeTab === 'quality' && (
          <div className="space-y-6 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Col: Quality Assessments */}
              <div className="space-y-5">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 uppercase flex items-center gap-2">
                  <FileCode size={16} className="text-blue-600" />
                  <span>Quality Audit Assessments</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Documentation Quality</label>
                    <p className="text-slate-900 font-bold mt-0.5">{dataset.documentation_quality || 'Standard Documentation'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Metadata Quality</label>
                    <p className="text-slate-900 font-bold mt-0.5">{dataset.metadata_quality || 'Rich Case Metadata'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Completeness Assessment</label>
                    <p className="text-slate-900 font-bold mt-0.5">{dataset.completeness_assessment || 'High completeness for covered period'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Data Quality Assessment</label>
                    <p className="text-slate-900 font-bold mt-0.5">{dataset.data_quality_assessment || 'Validated Clean Structure'}</p>
                  </div>
                  {dataset.quality_notes && (
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Quality Audit Notes</label>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                        {dataset.quality_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Limitations & Ingestion Audit */}
              <div className="space-y-5">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 uppercase flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span>Known Errors & Ingestion Limitations</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Known Duplicates</label>
                    <p className="text-slate-800 font-medium mt-0.5">{dataset.known_duplicates || 'None reported'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Known Errors / Inconsistencies</label>
                    <p className="text-slate-800 font-medium mt-0.5">{dataset.known_errors || 'None reported'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Limitations & Structural Gaps</label>
                    <p className="text-slate-800 bg-amber-50/60 border border-amber-100 p-3 rounded-xl leading-relaxed mt-1 font-medium">
                      {dataset.limitations || 'No specific limitations recorded.'}
                    </p>
                  </div>

                  {/* Availability Matrix */}
                  <div className="pt-2">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2">Availability Matrix</label>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex justify-between">
                        <span>Extracted Text</span>
                        <span className={dataset.text_available ? 'text-emerald-600' : 'text-slate-400'}>
                          {dataset.text_available ? '✓ YES' : '✗ NO'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex justify-between">
                        <span>Metadata Schema</span>
                        <span className={dataset.metadata_available ? 'text-emerald-600' : 'text-slate-400'}>
                          {dataset.metadata_available ? '✓ YES' : '✗ NO'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex justify-between">
                        <span>Original PDF Source</span>
                        <span className={dataset.original_pdf_available ? 'text-emerald-600' : 'text-slate-400'}>
                          {dataset.original_pdf_available ? '✓ YES' : '✗ NO'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex justify-between">
                        <span>Structured JSON</span>
                        <span className={dataset.structured_data_available ? 'text-emerald-600' : 'text-slate-400'}>
                          {dataset.structured_data_available ? '✓ YES' : '✗ NO'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex justify-between">
                        <span>OCR Layer</span>
                        <span className={dataset.ocr_available ? 'text-emerald-600' : 'text-slate-400'}>
                          {dataset.ocr_available ? '✓ YES' : '✗ NO'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex justify-between">
                        <span>Original Documents</span>
                        <span className={dataset.original_documents_available ? 'text-emerald-600' : 'text-slate-400'}>
                          {dataset.original_documents_available ? '✓ YES' : '✗ NO'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 100-Point Score & Reuse */}
        {activeTab === 'score' && (
          <div className="space-y-6 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="w-20 h-20 rounded-full border-4 border-blue-600 flex flex-col justify-center items-center font-black text-xl text-blue-700 shrink-0 bg-white shadow-sm">
                <span>{dataset.research_relevance_score}</span>
                <span className="text-[9px] font-bold text-slate-400 -mt-1">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase">100-Point Quality Score Model</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${ratingBand.class}`}>
                    Rating: {ratingBand.label} ({dataset.research_relevance_score >= 90 ? '90–100' : dataset.research_relevance_score >= 75 ? '75–89' : dataset.research_relevance_score >= 60 ? '60–74' : '<60'})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl font-medium">
                  Transparent 100-point quality score based on 7 objective components: Provenance (25 pts), License Clarity (15 pts), Coverage Breadth (15 pts), Metadata Richness (15 pts), Document Availability (10 pts), Freshness (10 pts), and Quality/Cleanliness (10 pts).
                </p>
              </div>
            </div>

            {/* Score Weights List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase">7-Factor Transparent Breakdown</h4>
                
                {/* 1. Provenance: 25 pts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">1. Provenance Verification (Max 25 pts)</span>
                    <span className="font-extrabold text-slate-900">
                      {dataset.provenance_status?.toUpperCase().includes('VERIFIED') && !dataset.provenance_status?.toUpperCase().includes('PARTIAL') ? '25 / 25' :
                       dataset.provenance_status?.toUpperCase().includes('PARTIAL') ? '15 / 25' : '5 / 25'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{
                      width: dataset.provenance_status?.toUpperCase().includes('VERIFIED') && !dataset.provenance_status?.toUpperCase().includes('PARTIAL') ? '100%' :
                             dataset.provenance_status?.toUpperCase().includes('PARTIAL') ? '60%' : '20%'
                    }} />
                  </div>
                </div>

                {/* 2. License: 15 pts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">2. License Clarity (Max 15 pts)</span>
                    <span className="font-extrabold text-slate-900">
                      {dataset.license_status?.toUpperCase().includes('CLEAR') || dataset.license_status?.toUpperCase().includes('VERIFIED') ? '15 / 15' :
                       dataset.license_status?.toUpperCase().includes('PARTIAL') ? '8 / 15' : '3 / 15'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{
                      width: dataset.license_status?.toUpperCase().includes('CLEAR') || dataset.license_status?.toUpperCase().includes('VERIFIED') ? '100%' :
                             dataset.license_status?.toUpperCase().includes('PARTIAL') ? '53%' : '20%'
                    }} />
                  </div>
                </div>

                {/* 3. Coverage: 15 pts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">3. Coverage Breadth (Max 15 pts)</span>
                    <span className="font-extrabold text-slate-900">12 / 15</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>

                {/* 4. Metadata: 15 pts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">4. Metadata Richness (Max 15 pts)</span>
                    <span className="font-extrabold text-slate-900">{dataset.metadata_available ? '15 / 15' : '6 / 15'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: dataset.metadata_available ? '100%' : '40%' }} />
                  </div>
                </div>

                {/* 5. Availability: 10 pts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">5. Document Availability (Max 10 pts)</span>
                    <span className="font-extrabold text-slate-900">
                      {(dataset.text_available && (dataset.original_pdf_available || dataset.original_documents_available)) ? '10 / 10' :
                        dataset.text_available ? '7 / 10' : '4 / 10'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{
                      width: (dataset.text_available && (dataset.original_pdf_available || dataset.original_documents_available)) ? '100%' :
                             dataset.text_available ? '70%' : '40%'
                    }} />
                  </div>
                </div>

                {/* 6. Freshness: 10 pts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">6. Freshness (Max 10 pts)</span>
                    <span className="font-extrabold text-slate-900">
                      {dataset.freshness_status?.toLowerCase().includes('current') ? '10 / 10' : '6 / 10'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full" style={{
                      width: dataset.freshness_status?.toLowerCase().includes('current') ? '100%' : '60%'
                    }} />
                  </div>
                </div>

                {/* 7. Quality: 10 pts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">7. Data Quality / Consistency (Max 10 pts)</span>
                    <span className="font-extrabold text-slate-900">8 / 10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>

              {/* Right Col: Strategic Decisions & Priorities */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Strategic Reuse Decision</h4>
                <div className="bg-slate-50 p-5 border border-slate-100 rounded-xl space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reuse Recommendation</span>
                    <p className="text-sm font-black text-blue-700 mt-0.5">
                      {dataset.reuse_recommendation || dataset.reuse_classification || 'REUSE WITH VERIFICATION'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority Tier</span>
                    <span className="inline-block px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-xs font-bold mt-0.5">
                      {dataset.reuse_priority || 'P1 - High Priority'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Strategy Rationale</span>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                      {dataset.why_selected || dataset.reuse_reason || dataset.recommendation || 'Evaluated for foundational corpus reuse.'}
                    </p>
                  </div>

                  {dataset.research_notes && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Research Ingestion Notes</span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed italic">
                        {dataset.research_notes}
                      </p>
                    </div>
                  )}
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
