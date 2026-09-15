import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Logo from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import PasswordStrengthInput from '../../components/common/PasswordStrengthInput';
import { validatePassword } from '../../utils/validation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing from the link. Please request a new reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password does not meet institutional security requirements (min 8 characters, uppercase, lowercase, number, special character).');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password, confirmPassword);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link may have expired or is invalid.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Logo size="md" to="/" />
        <ThemeToggle size="sm" />
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="modal-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            {/* Top Accent Gradient Line */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

            <div className="p-8">
              {/* Scenario 1: Reset Succeeded */}
              {success ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-[36px]">check_circle</span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Password Reset Complete!</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Your password has been successfully updated. You can now sign in using your new credentials.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link to="/login" className="block w-full">
                      <Button className="w-full h-11" icon="login">
                        Proceed to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : !token ? (
                /* Scenario 2: Token is Missing */
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-[36px]">link_off</span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Invalid Reset Link</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      This password reset link is missing a required security token. It may be broken or corrupted.
                    </p>
                  </div>
                  <div className="pt-2 space-y-3">
                    <Link to="/forgot-password" className="block w-full">
                      <Button className="w-full h-11">
                        Request New Reset Link
                      </Button>
                    </Link>
                    <Link to="/login" className="block w-full">
                      <Button variant="outline" className="w-full h-10 text-xs">
                        ← Return to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Scenario 3: Valid Token Form */
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="material-symbols-outlined text-[28px]">lock</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create New Password</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose a secure password that meets institutional policy.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 error-banner flex items-start gap-2 text-xs">
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                      <div className="space-y-1">
                        <span>{error}</span>
                        {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid')) && (
                          <div>
                            <Link to="/forgot-password" className="underline font-semibold hover:text-rose-800 dark:hover:text-rose-200">
                              Request a fresh link here.
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <PasswordStrengthInput
                      id="newPassword"
                      label="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />

                    <div className="space-y-1.5">
                      <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-[11px] text-rose-500 font-medium">
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        loading={loading}
                        disabled={!password || !confirmPassword || password !== confirmPassword}
                        className="w-full h-11 font-semibold"
                      >
                        Reset Password
                      </Button>
                    </div>

                    <div className="text-center pt-2">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Back to Sign In
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
        &copy; {new Date().getFullYear()} NSBM Green University. All rights reserved.
      </footer>
    </div>
  );
}
