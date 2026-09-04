import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function AdminLogin() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { adminLogin, staffLogin, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  async function handleStep1(e) {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setLoading(true);
    try {
      const loginFn = adminLogin || staffLogin;
      const result = await loginFn(username, password);
      const token = result?.sessionToken || result?.tempToken || result?.data?.sessionToken || result?.data?.tempToken || result?.data?.token;
      setTempToken(token);
      setStep(2);
      setCooldown(30); // 30s cooldown after step 1
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify administrator credentials.');
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
      const loginFn = adminLogin || staffLogin;
      const result = await loginFn(username, password);
      const token = result?.sessionToken || result?.tempToken || result?.data?.sessionToken || result?.data?.tempToken || result?.data?.token;
      setTempToken(token);
      setOtpCode('');
      setResendSuccess('A fresh 6-digit OTP code has been sent to your registered email.');
      setCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  async function handleStep2(e) {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setLoading(true);
    try {
      const userData = await verifyOtp(tempToken, otpCode);
      const roles = userData?.roles || (userData?.role ? [userData.role] : []);
      if (roles.includes('SYSTEM_ADMIN') || userData?.role === 'SYSTEM_ADMIN') {
        navigate('/admin/users', { replace: true });
      } else {
        navigate('/staff/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 2FA code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 transition-colors duration-200 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <ThemeToggle size="md" />
      </div>

      <div className="w-full max-w-md">
        <div className="modal-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Security Accent Bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Administrator Portal</h1>
            </div>

            {error && (
              <div className="mb-6 error-banner flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {resendSuccess}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleStep1} className="space-y-4">
                <Input
                  label="Username"
                  placeholder="e.g. username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="pt-2">
                  <Button type="submit" loading={loading} className="w-full h-11">
                    Proceed with Authentication
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="space-y-5">
                <div className="text-center mb-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    A 6-digit OTP code has been sent to your registered administrator email.
                  </p>
                </div>
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
                  Verify Token & Open Session
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setResendSuccess(''); }}
                  className="w-full btn-outline h-10 text-xs"
                >
                  ← Back to Credentials
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
