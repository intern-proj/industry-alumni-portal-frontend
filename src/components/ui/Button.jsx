import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  icon,
  iconRight,
  loading = false,
  disabled = false,
  ...props 
}) {
  const sizeMap = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5 font-semibold',
  };

  const variantMap = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    ghost: 'inline-flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-all active:scale-[0.98]',
    gradient: 'inline-flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-medium shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 active:scale-[0.98] transition-all duration-200',
  };

  const btnClass = variantMap[variant] || `btn-${variant}`;
  const sizeClass = sizeMap[size] || sizeMap.md;
  
  return (
    <button 
      className={`${btnClass} ${sizeClass} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
      )}
    </button>
  );
}
