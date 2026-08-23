import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import useWebSocket from './hooks/useWebSocket';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sources from './pages/Sources';
import DocumentCollection from './pages/DocumentCollection';
import MetadataManager from './pages/MetadataManager';
import QualityVerification from './pages/QualityVerification';
import DuplicateDetection from './pages/DuplicateDetection';
import CourtMetadata from './pages/CourtMetadata';
import Reports from './pages/Reports';
import QuestionableReviews from './pages/QuestionableReviews';
import AuditLogs from './pages/AuditLogs';
import ExportsManager from './pages/ExportsManager';

const queryClient = new QueryClient();

// Layout wrapper for all protected routes
const AppLayout: React.FC = () => {
  const token = localStorage.getItem('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Trigger WebSocket listener only when token exists
  useWebSocket(!!token);

  // If token is missing, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex">
      {/* Fixed Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Fixed Top Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Wrapper */}
        <main className="flex-1 mt-16 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Route protection guard based on active user sub-portal role
interface RoleGuardProps {
  allowedRoles: ('researcher' | 'reviewer' | 'admin')[];
  children: React.ReactElement;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = localStorage.getItem('override_role') || user.role || 'researcher';

  if (!allowedRoles.includes(userRole as any)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Enterprise Portal Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sources" element={<RoleGuard allowedRoles={['researcher', 'admin']}><Sources /></RoleGuard>} />
            <Route path="/documents" element={<RoleGuard allowedRoles={['researcher', 'reviewer']}><DocumentCollection /></RoleGuard>} />
            <Route path="/metadata" element={<RoleGuard allowedRoles={['researcher']}><MetadataManager /></RoleGuard>} />
            <Route path="/quality" element={<RoleGuard allowedRoles={['reviewer']}><QualityVerification /></RoleGuard>} />
            <Route path="/duplicates" element={<RoleGuard allowedRoles={['admin']}><DuplicateDetection /></RoleGuard>} />
            <Route path="/court-metadata" element={<RoleGuard allowedRoles={['researcher', 'reviewer']}><CourtMetadata /></RoleGuard>} />
            <Route path="/reports" element={<RoleGuard allowedRoles={['admin']}><Reports /></RoleGuard>} />
            <Route path="/questionable" element={<RoleGuard allowedRoles={['researcher', 'reviewer']}><QuestionableReviews /></RoleGuard>} />
            <Route path="/audit-logs" element={<RoleGuard allowedRoles={['admin']}><AuditLogs /></RoleGuard>} />
            <Route path="/exports" element={<RoleGuard allowedRoles={['admin']}><ExportsManager /></RoleGuard>} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
