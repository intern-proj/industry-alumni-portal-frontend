import React from 'react';

export default function AiProcessingOverlay({ 
  isVisible, 
  title = 'Generating AI Cover Letter...' 
}) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm rounded-[inherit] transition-all duration-200 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-6 max-w-xs w-full text-center space-y-3">
        
        {/* Simple clean spinner with sparkle icon */}
        <div className="relative flex items-center justify-center w-12 h-12 mx-auto">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="material-symbols-outlined absolute text-emerald-600 dark:text-emerald-400 text-lg">
            auto_awesome
          </span>
        </div>

        {/* Minimalist Title and Subtitle */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please wait while your draft is created...
          </p>
        </div>

      </div>
    </div>
  );
}
