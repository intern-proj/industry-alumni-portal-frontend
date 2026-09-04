import React from 'react';

export default function ApplicationSendingOverlay({
  isVisible,
  vacancyTitle = 'Position',
  companyName = 'Employer'
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
        
        {/* Simple Loading Cycle / Icon */}
        <div className="relative flex items-center justify-center w-14 h-14 mx-auto">
          <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="material-symbols-outlined absolute text-emerald-600 dark:text-emerald-400 text-xl">
            send
          </span>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Application Submission in Progress
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mx-auto">
            {vacancyTitle} {companyName ? `• ${companyName}` : ''}
          </p>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Submitting dossier and queuing application...
        </p>
      </div>
    </div>
  );
}
