import React, { useState, useEffect, useCallback } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function GlobalUIManager() {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    variant: 'danger',
    confirmLabel: 'Delete'
  });

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // Expose toast globally
    window.toast = {
      success: (msg) => addToast(msg, 'success'),
      error: (msg) => addToast(msg, 'error'),
      info: (msg) => addToast(msg, 'info'),
      warning: (msg) => addToast(msg, 'warning'),
    };

    // Expose confirm modal globally
    window.confirmAction = ({ title, message, variant, confirmLabel, onConfirm, onCancel }) => {
      setConfirmConfig({
        isOpen: true,
        title: title || 'Confirm Action',
        message: message || 'Are you sure you want to proceed?',
        variant: variant || 'danger',
        confirmLabel: confirmLabel || 'Confirm',
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          if (onConfirm) onConfirm();
        },
        onCancel: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          if (onCancel) onCancel();
        }
      });
    };
  }, [addToast]);

  return (
    <>
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border animate-in slide-in-from-right-4 fade-in duration-300 ${
              toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' :
              toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' :
              toast.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200' :
              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              {toast.type === 'success' ? 'check_circle' :
               toast.type === 'error' ? 'error' :
               toast.type === 'warning' ? 'warning' : 'info'}
            </span>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* Global Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmLabel={confirmConfig.confirmLabel}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
      />
    </>
  );
}
