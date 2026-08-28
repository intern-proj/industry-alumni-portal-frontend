import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ 
  variant = 'full', // 'full' | 'compact' | 'icon'
  to = '/', 
  className = '', 
  size = 'md', // 'sm' | 'md' | 'lg'
  iconOnly = false,
  showSubtitle = true,
  onClick
}) {
  const iconSizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size] || 'w-10 h-10 rounded-2xl';

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size] || 'text-lg';

  const subtitleSizeClasses = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  }[size] || 'text-[11px]';

  const content = (
    <div onClick={onClick} className={`inline-flex items-center gap-3 group transition-transform ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      {/* Visual Logo Mark */}
      <div className={`relative ${iconSizeClasses} bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm shadow-emerald-500/10 flex items-center justify-center p-1.5 overflow-hidden group-hover:scale-105 transition-transform shrink-0`}>
        <img 
          src="/images/nic-icon.png" 
          alt="NIC Unit Logo" 
          className="w-full h-full object-contain rounded-xl"
          onError={(e) => {
            // Fallback to stylized SVG emblem if image fails
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                NIC
              </div>
            `;
          }}
        />
      </div>

      {/* Brand Text */}
      {!iconOnly && (
        <div className="flex flex-col leading-tight min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold ${titleSizeClasses} text-slate-900 dark:text-white tracking-tight`}>
              NIC Unit
            </span>
            <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              NSBM
            </span>
          </div>
          {showSubtitle && (
            <p className={`${subtitleSizeClasses} text-slate-500 dark:text-slate-400 font-medium truncate`}>
              Industry Collaboration Unit
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="focus:outline-none inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
