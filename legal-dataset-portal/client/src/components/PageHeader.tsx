import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-200/60 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{title}</h1>
        <p className="text-sm text-slate-500 font-medium">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
