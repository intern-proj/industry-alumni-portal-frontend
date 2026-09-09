import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Logo from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { validateEmail } from '../../utils/validation';

export default function Login() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionExpired = searchParams.get('session') === 'expired';

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  function handleSuccessfulRedirect(user) {
    const pendingSessionToken = localStorage.getItem('pending_session_token');
    if (pendingSessionToken) {
      localStorage.removeItem('pending_session_token');
      window.location.href = `/?session_token=${pendingSessionToken}`;
      return;
    }

    const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
    if (roles.includes('STUDENT') || user?.role === 'STUDENT') {
      navigate('/student/dashboard', { replace: true });
    } else if (roles.includes('INDUSTRY_PARTNER') || user?.role === 'INDUSTRY_PARTNER') {
      navigate('/partner/dashboard', { replace: true });
    } else if (roles.includes('SYSTEM_ADMIN') || user?.role === 'SYSTEM_ADMIN') {
      navigate('/admin/users', { replace: true });
    } else {
      navigate('/staff/dashboard', { replace: true });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setLoading(true);
    try {
      const result = await login(identifier, password);
      if (result?.requiresOtp) {
        setSessionToken(result.sessionToken);
        setStep(2);
        setCooldown(30);
      } else {
        handleSuccessfulRedirect(result);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0 || resending) return;
    setError('');
    setResendSuccess('');
    setResending(true);
    try {
      const result = await login(identifier, password);
      if (result?.requiresOtp) {
        setSessionToken(result.sessionToken);
      }
      setOtpCode('');
      setResendSuccess('A fresh 6-digit OTP code has been sent to your registered email.');
      setCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setLoading(true);
    try {
      const user = await verifyOtp(sessionToken, otpCode);
      handleSuccessfulRedirect(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!validateEmail(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      await authService.forgotPassword(forgotEmail.trim());
      setForgotSuccess('Password reset instructions have been emailed to you.');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Unable to process reset request. Please check email address.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="flex w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
        <ThemeToggle size="md" />
        <Link to="/" className="text-xs font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          Public Site →
        </Link>
      </div>

      {/* Left Clean Light Hero Column */}
      <div className="hidden lg:flex lg:w-[50%] relative bg-gradient-to-br from-emerald-50 via-teal-50/60 to-sky-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/40 border-r border-slate-200/80 dark:border-slate-800/80 flex-col justify-between p-12 overflow-hidden transition-colors">
        {/* Decorative background glow circles */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="mb-6">
              <Logo size="lg" to="/" />
            </div>

            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mt-6">
              Empowering Careers & Industry Collaboration
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-4 max-w-md leading-relaxed">
              Bridging NSBM undergraduates with top industry partners through verified placement programs, career sessions, and skills credentials.
            </p>
          </div>

          <div className="space-y-4 my-8">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Undergraduates & Alumni</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Browse verified vacancies, auto-generate CVs, and earn verifiable digital badges.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">business</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Industry Partners & Employers</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Post internships, review pre-screened talent pools, and manage campus drive interviews.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Official Placement Portal • NSBM Green University, Sri Lanka
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {step === 1 ? 'Portal Login' : 'Two-Factor Verification'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {step === 1
                ? 'Enter your username to access your account.'
                : 'A 6-digit OTP code has been sent to your registered email.'}
            </p>
          </div>

          {/* Session Expired Notice */}
          {sessionExpired && (
            <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              Your session has expired. Please sign in again.
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 error-banner flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Resend Success Banner */}
          {resendSuccess && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {resendSuccess}
            </div>
          )}

          {/* Step 1: Sign In Form */}
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Username"
                placeholder="Enter your username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" loading={loading} className="w-full h-11">
                  Login to Account
                </Button>
              </div>
            </form>
          ) : (
            /* Step 2: OTP Verification Form (Staff & Industry Partners) */
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Verification Code (2FA)</label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || resending}
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      cooldown > 0 || resending
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    {resending ? 'Sending...' : cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input text-center text-2xl tracking-[0.4em] font-bold"
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <Button type="submit" loading={loading} className="w-full h-11">
                Verify Token & Sign In
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setResendSuccess('');
                  setOtpCode('');
                }}
                className="w-full btn-outline h-10 text-xs"
              >
                ← Back to Credentials
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
                {forgotSuccess}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter your registered institutional email to receive a password reset link.
                </p>
                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    {forgotError}
                  </div>
                )}
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@students.nsbm.ac.lk"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={forgotLoading}>
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
