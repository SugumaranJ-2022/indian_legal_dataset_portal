import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FolderOpen,
  FileSpreadsheet,
  ShieldCheck,
  CopyMinus,
  Scale,
  FileDown,
  LogOut,
  Gavel,
  AlertCircle,
  History,
  Download
} from 'lucide-react';
import { authService } from '../services/api';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeRole, setActiveRole] = useState(
    localStorage.getItem('override_role') || user.role || 'researcher'
  );

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setActiveRole(newRole);
    localStorage.setItem('override_role', newRole);
    window.location.reload();
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Sources Management', path: '/sources', icon: Database },
    { name: 'Document Collection', path: '/documents', icon: FolderOpen },
    { name: 'Metadata Manager', path: '/metadata', icon: FileSpreadsheet },
    { name: 'Quality Verification', path: '/quality', icon: ShieldCheck },
    { name: 'Duplicate Detection', path: '/duplicates', icon: CopyMinus },
    { name: 'Court Metadata', path: '/court-metadata', icon: Scale },
    { name: 'Reports Compiler', path: '/reports', icon: FileDown },
    { name: 'Questionable Files', path: '/questionable', icon: AlertCircle },
    { name: 'Audit Logs', path: '/audit-logs', icon: History },
    { name: 'Data Exports', path: '/exports', icon: Download },
  ];

  const navItems = allNavItems.filter((item) => {
    if (activeRole === 'researcher') {
      return ['/', '/sources', '/documents', '/metadata', '/court-metadata', '/questionable'].includes(item.path);
    }
    if (activeRole === 'reviewer') {
      return ['/', '/documents', '/quality', '/court-metadata', '/questionable'].includes(item.path);
    }
    if (activeRole === 'admin') {
      return ['/', '/sources', '/duplicates', '/reports', '/audit-logs', '/exports'].includes(item.path);
    }
    return true;
  });

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div className={`w-64 h-screen bg-slate-900 text-slate-100 flex flex-col fixed left-0 top-0 border-r border-slate-800 shadow-2xl z-30 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
          <Gavel size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-md font-bold tracking-wide text-white leading-none font-sans">LEGAL PORTAL</h1>
          <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">Govt Data Research</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`
              }
            >
              <Icon size={18} className="transition-transform group-hover:scale-105 duration-200" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 text-sm border border-slate-700">
            {user.name ? user.name[0].toUpperCase() : 'R'}
          </div>
          <div className="overflow-hidden w-full">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{user.name || 'Researcher'}</h4>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">Role:</span>
              <select
                value={activeRole}
                onChange={handleRoleChange}
                className="bg-slate-800 text-[10px] text-blue-400 font-bold uppercase rounded border border-slate-700 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="researcher">Researcher</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
        >
          <LogOut size={14} />
          <span>Sign Out Session</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
