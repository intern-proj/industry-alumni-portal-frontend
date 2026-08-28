import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ className = '', size = 'md', showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = size === 'sm' 
    ? 'w-8 h-8 text-[18px]' 
    : size === 'lg' 
    ? 'w-11 h-11 text-[22px]' 
    : 'w-9 h-9 text-[20px]';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-amber-300 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${showLabel ? 'px-3 h-9 text-xs font-medium' : sizeClasses} ${className}`}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label="Toggle theme"
    >
      <span className={`material-symbols-outlined transition-transform duration-300 ${isDark ? 'text-amber-400 rotate-0' : 'text-slate-600 rotate-0'}`}>
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
      {showLabel && (
        <span className="text-slate-700 dark:text-slate-200">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
}
