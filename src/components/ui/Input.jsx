import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, icon, className = '', ...props }, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="form-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`form-input ${icon ? 'pl-11' : ''} ${error ? '!border-error !ring-error/20' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
});
Input.displayName = 'Input';

export const Select = forwardRef(({ label, error, className = '', children, ...props }, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="form-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`form-input appearance-none pr-10 cursor-pointer ${error ? '!border-error' : ''}`}
          {...props}
        >
          {children}
        </select>
        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
          expand_more
        </span>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
});
Select.displayName = 'Select';

export const Textarea = forwardRef(({ label, error, className = '', rows = 4, ...props }, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="form-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 focus:outline-none transition-all duration-200 ${error ? '!border-error' : ''}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
});
Textarea.displayName = 'Textarea';

