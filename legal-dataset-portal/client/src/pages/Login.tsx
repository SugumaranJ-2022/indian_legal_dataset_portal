import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, AlertCircle, Eye, EyeOff, Loader2, Sun, Moon, Clock, LogIn } from 'lucide-react';
import { authService } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('researcher@legalportal.in');
  const [password, setPassword] = useState('Password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  
  const navigate = useNavigate();

  // Synchronized Theme state
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

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      localStorage.removeItem('override_role');
      await authService.login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Authorization failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      onClick={() => setFormVisible(false)}
      className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative select-none bg-cover bg-center transition-all duration-300 cursor-pointer"
      style={{ backgroundImage: 'url(/login_3d_bg.jpg)' }}
    >
      {/* Top Fixed Login Navbar */}
      <header 
        onClick={(e) => e.stopPropagation()}
        className="h-16 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 md:px-8 fixed top-0 right-0 left-0 z-20 shadow-sm transition-colors duration-200 cursor-default"
      >
        {/* Left Brand Area */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Gavel size={16} className="stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Indian Legal Dataset Portal</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Date Display */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200/40 dark:border-slate-800/50 uppercase tracking-wide">
            <Clock size={11} className="text-slate-400" />
            <span>{formatDate()}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200 border border-slate-200/60 dark:border-slate-800/80 cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-600" />}
          </button>

          {/* Show/Hide Login Form Navbar Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFormVisible(prev => !prev);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
            title="Toggle Login Gate"
          >
            <LogIn size={11} />
            <span>Toggle Login Gate</span>
          </button>
        </div>
      </header>

      {/* Background Subtle Theme Overlay (image clearly visible) */}
      <div className="absolute inset-0 bg-slate-900/15 dark:bg-slate-950/45 backdrop-blur-[1.5px] transition-all duration-300" />
      
      {/* Main card panel - High contrast & Popout */}
      {formVisible && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-10 rounded-2xl shadow-2xl transition-all duration-300 relative z-10 space-y-6 animate-fade-in mt-16 cursor-default"
        >
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/10 mb-3.5">
            <Gavel size={24} className="stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Sign in to Legal Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Enter your credentials to access the data operations console
          </p>
        </div>

        {/* Form Body */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3.5 flex gap-2.5 text-red-600 dark:text-red-300 text-xs items-center leading-relaxed">
              <AlertCircle size={16} className="shrink-0 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email-address" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                placeholder="researcher@legalportal.in"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Dev environment note */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
            * Seeded Credentials prefilled for dev sandbox access.
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md shadow-blue-600/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  <span>Verifying Node Access...</span>
                </>
              ) : (
                <span>Access Portal Node</span>
              )}
            </button>
          </div>
        </form>
        </div>
      )}
    </div>
  );
};

export default Login;
