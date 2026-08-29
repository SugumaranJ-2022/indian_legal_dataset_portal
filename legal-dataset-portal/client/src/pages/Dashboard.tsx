import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FolderOpen, 
  ShieldCheck, 
  AlertCircle, 
  CopyMinus,
  Loader2,
  Calendar,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { dashboardService, documentService } from '../services/api';
import type { DashboardStats, Document } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const [statsData, docsData] = await Promise.all([
        dashboardService.getStats(),
        documentService.getAll(undefined, undefined, undefined, undefined)
      ]);
      setStats(statsData);
      
      // Sort documents by upload date to get top 5 recent
      const sortedDocs = [...docsData].sort(
        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
      setRecentDocs(sortedDocs.slice(0, 5));
      setAllDocs(docsData);
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard telemetry data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 select-none">
        <Loader2 className="animate-spin text-blue-600 stroke-[2.5]" size={36} />
        <span className="text-sm font-semibold text-slate-500">Loading audit network stats...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 select-none">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-xl mx-auto">
          <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to Connect</h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // --- TELEMETRY GROUPINGS FOR MAP AND TIMELINE ---
  const stateCounts: Record<string, { count: number; region: string }> = {
    'Delhi': { count: 0, region: 'North' },
    'Kerala': { count: 0, region: 'South' },
    'Tamil Nadu': { count: 0, region: 'South' },
    'Maharashtra': { count: 0, region: 'West' },
    'Karnataka': { count: 0, region: 'South' },
    'Uttar Pradesh': { count: 0, region: 'North' },
    'West Bengal': { count: 0, region: 'East' },
  };

  allDocs.forEach((doc) => {
    if (doc.court_metadata && doc.court_metadata.state) {
      const stateName = doc.court_metadata.state;
      if (stateCounts[stateName]) {
        stateCounts[stateName].count += 1;
      } else {
        stateCounts[stateName] = { count: 1, region: 'Other' };
      }
    }
  });

  const stateData = Object.entries(stateCounts).map(([name, val]) => ({
    name,
    count: val.count,
    region: val.region
  })).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...stateData.map(s => s.count), 1);

  // Group by publication year
  const yearGroups: Record<number, number> = {};
  allDocs.forEach((doc) => {
    yearGroups[doc.year] = (yearGroups[doc.year] || 0) + 1;
  });
  
  const timelineYears = Object.keys(yearGroups).length > 0 
    ? Object.keys(yearGroups).map(Number).sort((a, b) => a - b)
    : [1950, 1973, 2000, 2009];
  const timelineCounts = Object.keys(yearGroups).length > 0 
    ? timelineYears.map(y => yearGroups[y])
    : [2, 1, 2, 1];

  const timelineChartData = {
    labels: timelineYears,
    datasets: [
      {
        label: 'Statutes & Judgments Ingested',
        data: timelineCounts,
        backgroundColor: 'rgba(20, 184, 166, 0.85)', // teal-500
        borderColor: 'rgb(20, 184, 166)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', font: { size: 9, weight: 500 }, stepSize: 1 },
        grid: { color: 'rgba(226, 232, 240, 0.4)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10, weight: 600 } }
      }
    }
  };

  // --- CHART CONFIGURATIONS ---
  // 1. Documents by Category Bar Chart
  const categories = Object.keys(stats.category_counts);
  const categoryCounts = Object.values(stats.category_counts);
  const categoryChartData = {
    labels: categories.length > 0 ? categories : ['Acts / Statutes', 'Rules & Regulations', 'Court Judgments', 'Court Metadata'],
    datasets: [
      {
        label: 'Documents',
        data: categories.length > 0 ? categoryCounts : [0, 0, 0, 0],
        backgroundColor: 'rgba(29, 78, 216, 0.85)', // blue-700
        borderColor: 'rgb(29, 78, 216)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { color: '#64748b', font: { size: 10, weight: 500 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10, weight: 600 } }
      }
    }
  };

  // 2. Verification Status Doughnut Chart
  const statusLabels = Object.keys(stats.status_counts);
  const statusCounts = Object.values(stats.status_counts);
  
  const statusColorsMap: Record<string, string> = {
    'Verified': '#10b981',            // emerald
    'Verified (Content-Level)': '#059669', // dark emerald
    'Needs Review': '#f59e0b',        // amber
    'Questionable': '#ef4444',        // red
    'Duplicate': '#64748b',           // slate
    'Incomplete': '#3b82f6',          // blue
  };

  const statusDoughnutData = {
    labels: statusLabels.length > 0 ? statusLabels : ['Verified', 'Needs Review', 'Duplicate'],
    datasets: [
      {
        data: statusLabels.length > 0 ? statusCounts : [1, 1, 1],
        backgroundColor: statusLabels.length > 0 
          ? statusLabels.map(l => statusColorsMap[l] || '#cbd5e1') 
          : ['#10b981', '#f59e0b', '#64748b'],
        borderWidth: 1.5,
        borderColor: '#ffffff',
      },
    ],
  };

  const statusDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#475569',
          font: { size: 10, weight: 500 },
          boxWidth: 12
        }
      }
    },
    cutout: '65%'
  };

  // 3. Upload Trends Line Chart
  const trendsMonths = stats.upload_trends.map(t => t.month);
  const trendsCounts = stats.upload_trends.map(t => t.count);

  const trendChartData = {
    labels: trendsMonths,
    datasets: [
      {
        label: 'Upload Volume',
        data: trendsCounts,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#2563eb', // blue-600
        borderWidth: 2.5,
        pointBackgroundColor: '#2563eb',
        pointHoverRadius: 6,
        tension: 0.35,
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { color: '#64748b', font: { size: 10, weight: 500 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10, weight: 600 } }
      }
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = localStorage.getItem('override_role') || user.role || 'researcher';

  const getStatCards = () => {
    switch (userRole) {
      case 'researcher':
        return [
          { title: "Total Sources", value: stats.total_sources, icon: Database, iconColor: "blue" as const, description: "Mapped official gazettes & URL nodes." },
          { title: "Total Documents", value: stats.total_documents, icon: FolderOpen, iconColor: "teal" as const, description: "Local PDFs collected & indexed." },
          { title: "Metadata Reviews Required", value: stats.needs_review, icon: AlertCircle, iconColor: "amber" as const, description: "Documents flagging incomplete metadata." }
        ];
      case 'reviewer':
        return [
          { title: "Documents Map Index", value: stats.total_documents, icon: FolderOpen, iconColor: "teal" as const, description: "Total local documents available for audit." },
          { title: "Verified Index", value: stats.verified_documents, icon: ShieldCheck, iconColor: "emerald" as const, description: "Passing all verification checks." },
          { title: "Awaiting Verification", value: stats.needs_review, icon: AlertCircle, iconColor: "amber" as const, description: "Documents requiring verification checklists." },
          { title: "Flagged Duplicates", value: stats.duplicates_count, icon: CopyMinus, iconColor: "red" as const, description: "Deduplication issues identified." }
        ];
      case 'admin':
      default:
        return [
          { title: "Total Sources", value: stats.total_sources, icon: Database, iconColor: "blue" as const, description: "Mapped official gazettes & URL nodes." },
          { title: "Total Documents", value: stats.total_documents, icon: FolderOpen, iconColor: "teal" as const, description: "Local PDFs collected & indexed." },
          { title: "Verified Index", value: stats.verified_documents, icon: ShieldCheck, iconColor: "emerald" as const, description: "Passing all verification checks." },
          { title: "Flagged Duplicates", value: stats.duplicates_count, icon: CopyMinus, iconColor: "red" as const, description: "Deduplication warnings identified." }
        ];
    }
  };

  const activeCards = getStatCards();

  return (
    <div className="p-8 font-sans">
      {/* Header controls */}
      <PageHeader
        title={`${userRole.toUpperCase()} PORTAL`}
        description={
          userRole === 'researcher' ? "Ingest statutes, update citation details, and view publication timelines." :
          userRole === 'reviewer' ? "Perform manual verification audits and verify case files." :
          "Manage data nodes, resolve deduplication merges, and compile excel telemetry."
        }
        actions={
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Data</span>
          </button>
        }
      />

      {/* KPI Cards Panel */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${activeCards.length} gap-6 mb-8`}>
        {activeCards.map((card, i) => (
          <StatCard
            key={i}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconColor}
            description={card.description}
          />
        ))}
      </div>
      
      {/* Catch-all Spacer */}
      <div className="mb-4" />

      {/* Dynamic Portal Charts Grid */}
      
      {/* 1. Researcher Workspace Analytics */}
      {userRole === 'researcher' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category distribution */}
            <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Ingestion by Category</h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">COLLECTED STATUTES, COURT DECISIONS, OR RULES</p>
              </div>
              <div className="flex-1 relative">
                <Bar data={categoryChartData} options={categoryChartOptions} />
              </div>
            </div>

            {/* Ingestion Timeline Trends */}
            <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Monthly Ingestion Inflow</h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">LOCAL FILE INDEX RATE OVER 6 MONTHS</p>
              </div>
              <div className="flex-1 relative">
                <Line data={trendChartData} options={trendChartOptions} />
              </div>
            </div>
          </div>

          {/* Legal Publication Timeline */}
          <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Legal Publication Timeline</h4>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">INGESTION DENSITY BY PUBLICATION DECADE / YEAR</p>
            </div>
            <div className="flex-1 relative">
              <Bar data={timelineChartData} options={timelineChartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* 2. Reviewer Workspace Analytics */}
      {userRole === 'reviewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Verification Status */}
          <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Checklist Verification Status</h4>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">MANUAL CHECKLIST AUDIT CLASSIFICATION</p>
            </div>
            <div className="flex-1 relative flex items-center justify-center">
              <Doughnut data={statusDoughnutData} options={statusDoughnutOptions} />
            </div>
          </div>

          {/* State Case Heatmap */}
          <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Ingested Datasets State Heatmap</h4>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">GEOGRAPHICAL CASE FILE COVERAGE DISTRIBUTION</p>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1">
              {stateData.map((state) => (
                <div 
                  key={state.name}
                  className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col justify-between hover:bg-slate-100/50 hover:border-slate-300 transition-all select-none relative group overflow-hidden"
                >
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-teal-400"
                    style={{ width: `${Math.min(100, (state.count / maxCount) * 100)}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{state.region} Region</span>
                  <h5 className="text-xs font-bold text-slate-900 mt-1">{state.name}</h5>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Documents</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">{state.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. System Administrator Workspace Analytics */}
      {userRole === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category distribution */}
            <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Index by Category</h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">STATUTES, RULES, JUDGMENTS OR METADATA</p>
              </div>
              <div className="flex-1 relative">
                <Bar data={categoryChartData} options={categoryChartOptions} />
              </div>
            </div>

            {/* Verification Status */}
            <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Verification Status</h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">MANUAL CHECKLIST AUDIT CLASSIFICATION</p>
              </div>
              <div className="flex-1 relative flex items-center justify-center">
                <Doughnut data={statusDoughnutData} options={statusDoughnutOptions} />
              </div>
            </div>

            {/* Upload Trends */}
            <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Monthly Inflow trends</h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">LOCAL FILE INDEX RATE OVER 6 MONTHS</p>
              </div>
              <div className="flex-1 relative">
                <Line data={trendChartData} options={trendChartOptions} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* State Case Heatmap */}
            <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Ingested Datasets State Heatmap</h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">GEOGRAPHICAL CASE FILE COVERAGE DISTRIBUTION</p>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1">
                {stateData.map((state) => (
                  <div 
                    key={state.name}
                    className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col justify-between hover:bg-slate-100/50 hover:border-slate-300 transition-all select-none relative group overflow-hidden"
                  >
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-teal-400"
                      style={{ width: `${Math.min(100, (state.count / maxCount) * 100)}%` }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{state.region} Region</span>
                    <h5 className="text-xs font-bold text-slate-900 mt-1">{state.name}</h5>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="text-[10px] text-slate-400 font-semibold">Documents</span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">{state.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Analysis */}
            <div className="glass-panel p-6 rounded-2xl shadow-md flex flex-col h-96">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Legal Publication Timeline</h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">INGESTION DENSITY BY PUBLICATION DECADE / YEAR</p>
              </div>
              <div className="flex-1 relative">
                <Bar data={timelineChartData} options={timelineChartOptions} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Panel */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel p-6 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Recent Document Uploads</h4>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">LATEST FILES COMPRESSED AND CATALOGED</p>
            </div>
          </div>

          {recentDocs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <FolderOpen size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No documents compiled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Document ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 tracking-tight">{doc.document_code}</td>
                      <td className="py-3.5 px-4 max-w-xs truncate">{doc.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">{doc.year}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} />
                        <span>{new Date(doc.uploaded_at).toLocaleDateString('en-IN')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          doc.status === 'Verified (Content-Level)' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20' :
                          doc.status === 'Needs Review' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          doc.status === 'Duplicate' ? 'bg-slate-500/10 text-slate-600 border border-slate-500/20' :
                          'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. Research Landscape & Compliance Overview Integration */}
      {stats.research_stats && (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 animate-fade-in select-none">
          <div className="border-b border-slate-100 pb-3 mb-5 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Indian Legal Dataset Research Landscape</h4>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">COMPLIANCE STATISTICS FOR EXTERNAL BENCHMARK DATASETS</p>
            </div>
            
            <a 
              href="/datasets"
              className="text-xs font-bold text-blue-600 hover:text-blue-500 hover:underline flex items-center gap-1 transition"
            >
              <span>Go to Discovery Hub</span>
              <span>&rarr;</span>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-slate-900">{stats.research_stats.datasets_discovered}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Discovered</span>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-emerald-700">{stats.research_stats.datasets_shortlisted}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Shortlisted</span>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-150 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-blue-700">{stats.research_stats.platforms_investigated}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Platforms</span>
            </div>
            <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-teal-700">{stats.research_stats.provenance_verified}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Provenance Verified</span>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-center col-span-2 md:col-span-1">
              <span className="block text-xl font-extrabold text-rose-700">{stats.research_stats.high_priority_gaps}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Critical Gaps</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
