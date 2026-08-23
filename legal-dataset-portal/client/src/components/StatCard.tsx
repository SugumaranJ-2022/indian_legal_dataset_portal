import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: 'blue' | 'teal' | 'emerald' | 'amber' | 'red';
  description?: string;
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50 border-blue-100',
    icon: 'text-blue-600',
    shadow: 'shadow-blue-500/5',
  },
  teal: {
    bg: 'bg-teal-50 border-teal-100',
    icon: 'text-teal-600',
    shadow: 'shadow-teal-500/5',
  },
  emerald: {
    bg: 'bg-emerald-50 border-emerald-100',
    icon: 'text-emerald-600',
    shadow: 'shadow-emerald-500/5',
  },
  amber: {
    bg: 'bg-amber-50 border-amber-100',
    icon: 'text-amber-600',
    shadow: 'shadow-amber-500/5',
  },
  red: {
    bg: 'bg-red-50 border-red-100',
    icon: 'text-red-600',
    shadow: 'shadow-red-500/5',
  },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor, description }) => {
  const styles = colorStyles[iconColor];

  return (
    <div className={`glass-panel p-6 rounded-xl shadow-lg ${styles.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/40 group`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{title}</span>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1 group-hover:text-slate-900">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl border ${styles.bg} transition-all duration-300 group-hover:scale-105 shadow-inner`}>
          <Icon className={`${styles.icon} stroke-[2]`} size={20} />
        </div>
      </div>
      {description && (
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatCard;
