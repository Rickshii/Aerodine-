import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="h-full w-full flex flex-col gap-6 animate-pulse p-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-64 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(n => (
          <div key={n} className="h-32 bg-slate-200 dark:bg-slate-850 rounded-3xl border border-slate-100 dark:border-slate-800/40"></div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-850 rounded-3xl"></div>
        <div className="h-80 bg-slate-200 dark:bg-slate-850 rounded-3xl"></div>
      </div>
    </div>
  );
}
