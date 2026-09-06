import React, { useState } from 'react';
import { evaluatePasswordStrength } from '../../utils/validation';

export default function PasswordStrengthInput({
  label = 'Password',
  value = '',
  onChange,
  placeholder = '••••••••',
  required = true,
  showRules = true,
  showStrengthBar = true,
  disabled = false,
  className = '',
  id,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = evaluatePasswordStrength(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {showStrengthBar && value && (
            <span className={`text-[11px] font-bold ${strength.textColor} transition-colors`}>
              {strength.label}
            </span>
          )}
        </div>
      )}

      {/* Input container with Show/Hide toggle */}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      {/* Real-time Visual Strength Bar */}
      {showStrengthBar && value && (
        <div className="space-y-1 pt-0.5">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
            <div
              className={`h-full transition-all duration-300 rounded-full ${strength.color}`}
              style={{ width: `${Math.max(10, strength.score)}%` }}
            />
          </div>
        </div>
      )}

      {/* Interactive Rules Checklist */}
      {showRules && value && (
        <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[10px]">
          <span className={`inline-flex items-center gap-1 font-medium ${strength.rules.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[13px]">
              {strength.rules.length ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            8+ characters
          </span>
          <span className={`inline-flex items-center gap-1 font-medium ${strength.rules.uppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[13px]">
              {strength.rules.uppercase ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            1 uppercase (A-Z)
          </span>
          <span className={`inline-flex items-center gap-1 font-medium ${strength.rules.lowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[13px]">
              {strength.rules.lowercase ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            1 lowercase (a-z)
          </span>
          <span className={`inline-flex items-center gap-1 font-medium ${strength.rules.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[13px]">
              {strength.rules.number ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            1 number (0-9)
          </span>
          <span className={`inline-flex items-center gap-1 font-medium col-span-2 ${strength.rules.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[13px]">
              {strength.rules.special ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            1 special character (!@#$%^&*)
          </span>
        </div>
      )}
    </div>
  );
}
