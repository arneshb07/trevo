import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-xl p-5" />
        ))}
      </div>

      {/* Decision plan skeleton */}
      <div className="h-36 bg-slate-900/60 border border-slate-800 rounded-xl" />

      {/* Event simulator skeleton */}
      <div className="h-28 bg-slate-900/60 border border-slate-800 rounded-xl" />

      {/* Payables table skeleton */}
      <div className="h-56 bg-slate-900/60 border border-slate-800 rounded-xl" />

      {/* Receivables table skeleton */}
      <div className="h-48 bg-slate-900/60 border border-slate-800 rounded-xl" />
    </div>
  );
};
