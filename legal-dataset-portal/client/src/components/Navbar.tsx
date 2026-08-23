import React, { useState, useEffect } from 'react';
import { Shield, Clock, Sun, Moon, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const now = new Date();

  // Manage Dark Mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  
  const formatDate = () => {
    return now.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const activeRole = localStorage.getItem('override_role') || user.role || 'researcher';

  const portalConfig = {
    researcher: {
      name: 'Researcher Ingestion Workspace',
      style: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50',
      dot: 'bg-blue-500'
    },
    reviewer: {
      name: 'Reviewer Ingestion Audit Panel',
      style: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200/50 dark:border-teal-900/50',
      dot: 'bg-teal-500'
    },
    admin: {
      name: 'System Administrator Control Panel',
      style: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/50',
      dot: 'bg-indigo-500'
    }
  }[activeRole as 'researcher' | 'reviewer' | 'admin'] || {
    name: 'Researcher Ingestion Workspace',
    style: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50',
    dot: 'bg-blue-500'
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 md:px-8 fixed top-0 right-0 left-0 md:left-64 z-10 shadow-sm shadow-slate-100/50 dark:shadow-none transition-colors duration-200">
      {/* Left connection indicator and responsive mobile menu */}
      <div className="flex items-center gap-4">
        {/* Mobile Toggle Menu Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md md:hidden transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline-block">Real-Time Database Sync Active</span>
        </div>

        {/* Portal Branding Banner */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${portalConfig.style} animate-fade-in`}>
          <span className={`h-1.5 w-1.5 rounded-full ${portalConfig.dot}`} />
          <span>{portalConfig.name}</span>
        </div>
      </div>

      {/* Right User Stats and Theme Toggle */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200 border border-slate-200/60 dark:border-slate-800"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
        </button>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-transparent dark:border-slate-800/80">
          <Clock size={13} className="text-slate-400" />
          <span>{formatDate()}</span>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4 md:pl-6">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-sans ${portalConfig.style}`}>
            <Shield size={12} className="stroke-[2.5]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">{activeRole}</span>
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline-block">{user.name || 'Senior Researcher'}</span>
          <button
            onClick={() => {
              authService.logout();
              navigate('/login');
            }}
            className="p-1.5 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
            title="Sign Out Session"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
