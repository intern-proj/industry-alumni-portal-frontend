import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SmartAISearchBar
 * Reusable intelligent search bar with dynamic running glowing border animation
 * and toggleable 3-star AI spark mode for natural language search.
 */
export default function SmartAISearchBar({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search by keyword, role, or company...',
  aiPlaceholder = 'Smart AI search by role, skill, or location...',
  searchType = 'vacancies',
  loading = false,
  showAiToggle = true,
  className = ''
}) {
  const { user } = useAuth();
  
  // Allow AI search if authenticated as STUDENT or INDUSTRY_PARTNER
  // OR if unauthenticated guest searching for vacancies or partners (as requested)
  const isGuestAllowedSearch = !user && (searchType === 'vacancies' || searchType === 'partners');
  const isAllowedAi = user?.role === 'STUDENT' || user?.role === 'INDUSTRY_PARTNER' || user?.userRole === 'STUDENT' || user?.userRole === 'INDUSTRY_PARTNER' || isGuestAllowedSearch;
  
  const effectiveShowAiToggle = showAiToggle && isAllowedAi;

  const [isAiMode, setIsAiMode] = useState(false);
  const [internalQuery, setInternalQuery] = useState(value);

  const handleToggleAiMode = () => {
    if (!effectiveShowAiToggle) return;
    const nextState = !isAiMode;
    setIsAiMode(nextState);
  };

  const handleInputChange = (e) => {
    setInternalQuery(e.target.value);
    if (onChange) {
      onChange(e.target.value, isAiMode);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
  };

  const triggerSearch = () => {
    if (onSearch) {
      onSearch(internalQuery, isAiMode);
    }
  };

  const handleClear = () => {
    setInternalQuery('');
    if (onChange) onChange('', isAiMode);
    if (onSearch) onSearch('', isAiMode);
  };

  return (
    <div className={`w-full transition-all duration-300 ${className}`}>
      {/* Search Bar Container */}
      <div className={isAiMode && effectiveShowAiToggle ? 'running-border-ai' : 'border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm'}>
        <div className={`flex items-center gap-2 px-3.5 py-2 ${isAiMode && effectiveShowAiToggle ? 'running-border-inner' : ''}`}>
          
          {/* Leading Icon */}
          <div className="flex items-center justify-center text-slate-400">
            {isAiMode && effectiveShowAiToggle ? (
              <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-[20px] animate-pulse">
                auto_awesome
              </span>
            ) : (
              <span className="material-symbols-outlined text-slate-400 text-[20px]">
                search
              </span>
            )}
          </div>

          {/* Input field */}
          <input
            type="text"
            value={internalQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isAiMode && effectiveShowAiToggle ? aiPlaceholder : placeholder}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:ring-0"
          />

          {/* Clear button */}
          {internalQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          {/* Spark Smart AI Toggle Button (Icon Only) */}
          {effectiveShowAiToggle && (
            <button
              type="button"
              onClick={handleToggleAiMode}
              className={`p-2 rounded-lg transition-all duration-200 select-none flex items-center justify-center ${
                isAiMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700'
              }`}
              title={isAiMode ? 'Smart AI Search Active (Click to switch to Standard Search)' : 'Toggle Smart AI Natural Language Search'}
            >
              {/* 3-Stars Spark SVG Icon */}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isAiMode ? 'rotate-12 scale-110' : ''}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                <path d="M19 15L20.2 17.8L23 19L20.2 20.2L19 23L17.8 20.2L15 19L17.8 17.8L19 15Z" opacity="0.9" />
                <path d="M5 16L5.8 17.8L7.6 18.6L5.8 19.4L5 21.2L4.2 19.4L2.4 18.6L4.2 17.8L5 16Z" opacity="0.8" />
              </svg>
            </button>
          )}

          {/* Search Action Button */}
          <button
            type="button"
            onClick={triggerSearch}
            disabled={loading}
            className={`p-2 rounded-lg transition-all flex items-center justify-center bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 backdrop-blur-sm`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">search</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
