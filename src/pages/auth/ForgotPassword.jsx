import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Logo from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { validateEmail } from '../../utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid institutional or business email address.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(trimmedEmail);
      setSubmittedEmail(trimmedEmail);
      setCooldown(60); // 60s cooldown before resending
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to process reset request. Please verify the email address and try again.';
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

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="modal-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            {/* Top Accent Gradient Line */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

            <div className="p-8">
              {submittedEmail ? (
                /* Success State */
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-[36px]">mark_email_read</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Check Your Inbox</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      We have sent password reset instructions to:
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 py-1.5 px-3 rounded-lg inline-block border border-emerald-200 dark:border-emerald-800 break-all">
                      {submittedEmail}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                      The link in the email is valid for <strong>15 minutes</strong>. If you don't see it, check your spam or junk folder.
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={cooldown > 0 || loading}
                      onClick={() => handleSubmit()}
                      className="w-full h-11 text-xs"
                      loading={loading}
                    >
                      {cooldown > 0 ? `Resend Reset Link (${cooldown}s)` : 'Resend Reset Link'}
                    </Button>

                    <Link to="/login" className="block w-full">
                      <Button variant="ghost" className="w-full h-10 text-xs">
                        ← Back to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Request Reset Form */
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="material-symbols-outlined text-[28px]">lock_reset</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Forgot Password</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Enter your registered email and we'll send you a recovery link.
                    </p>
                  </div>

                  {/* Institutional Notice Box */}
                  <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-sky-500 shrink-0 mt-0.5">info</span>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Applicable Accounts: </span>
                      Password recovery is available for <strong>Faculty/Staff</strong> and <strong>Industry Partners</strong>. Students should authenticate through their university portal.
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 error-banner flex items-start gap-2 text-xs">
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="e.g. staff@nsbm.ac.lk or partner@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <div className="pt-2">
                      <Button type="submit" loading={loading} className="w-full h-11 font-semibold">
                        Send Recovery Link
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
