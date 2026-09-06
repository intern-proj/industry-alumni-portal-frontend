import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div className={`${hover ? 'glass-card-hover' : 'glass-card'} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`font-semibold text-lg text-slate-900 dark:text-white tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}
