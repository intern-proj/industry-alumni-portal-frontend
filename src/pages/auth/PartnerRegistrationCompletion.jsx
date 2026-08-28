import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Logo from '../../components/ui/Logo';
import PasswordStrengthInput from '../../components/common/PasswordStrengthInput';
import { validatePassword } from '../../utils/validation';

export default function PartnerRegistrationCompletion() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Hide the token from the URL if it exists
    if (searchParams.get('token')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password does not meet institutional requirements (min 8 characters, uppercase, lowercase, number, special character).');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.completePartnerRegistration(token, username.trim(), password);
      
      // Update invitation status in local storage if it exists
      try {
        const email = response.data?.email;
        const saved = localStorage.getItem('portal_partner_invitations_cache');
        if (saved && email) {
          const invites = JSON.parse(saved);
          const updated = invites.map(inv => 
            inv.email === email ? { ...inv, status: 'COMPLETED' } : inv
          );
          localStorage.setItem('portal_partner_invitations_cache', JSON.stringify(updated));
        }
      } catch (e) {
        // Ignore local storage update errors
      }

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete registration. The invitation link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 transition-colors duration-200">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">corporate_fare</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Partner Account Activated!</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your corporate employer account is now active. You can log in and immediately begin posting vacancies and browsing candidate portfolios.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button className="w-full" icon="login">Proceed to Partner Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Logo size="md" to="/" />
        <ThemeToggle size="sm" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Complete Partner Setup</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Finalize your verified employer credentials to begin accessing undergraduate talent.</p>
          </div>

          <Card className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Only show the token input if they need to manually paste it */}
              {!searchParams.get('token') && !token && (
                <Input
                  label="Registration Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter or paste registration token"
                  required
                />
              )}

              <Input
                label="Employer Account Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. virtusa_talent"
                required
              />

              <PasswordStrengthInput
                label="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password"
                required
              />

              <PasswordStrengthInput
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                showRules={false}
                showStrengthBar={false}
              />

              <div className="pt-2">
                <Button type="submit" loading={loading} className="w-full" icon="verified_user">
                  Activate Employer Account
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-slate-400">
        NSBM Green University • Industry & Alumni Portal
      </footer>
    </div>
  );
}
