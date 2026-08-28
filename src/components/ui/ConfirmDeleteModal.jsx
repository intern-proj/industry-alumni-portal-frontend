import React, { useEffect } from 'react';
import { Button } from './Button';

/**
 * ConfirmDeleteModal - A customized, stylish confirmation dialog for destructive actions.
 * Replaces native window.confirm() with a fully designed React modal.
 *
 * Props:
 *  - isOpen: boolean
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - title?: string
 *  - message?: string
 *  - itemName?: string  (shown in red to highlight what is being deleted)
 *  - confirmLabel?: string
 *  - variant?: 'danger' | 'warning'
 */
export function ConfirmDeleteModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Deletion',
  message = 'This action cannot be undone. Are you sure you want to proceed?',
  itemName,
  confirmLabel = 'Delete',
  variant = 'danger',
}) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onCancel} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 overflow-hidden">
        {/* Top accent bar */}
        <div
          className={`h-1 w-full ${
            isDanger
              ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
          }`}
        />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                isDanger
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isDanger ? 'delete_forever' : 'warning'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Item name highlight */}
          {itemName && (
            <div
              className={`px-4 py-3 rounded-xl border text-sm font-semibold truncate ${
                isDanger
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider opacity-60 mr-2">
                Target:
              </span>
              {itemName}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-200 dark:shadow-rose-900/30'
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-95 shadow-amber-200 dark:shadow-amber-900/30'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isDanger ? 'delete_forever' : 'warning'}
              </span>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
