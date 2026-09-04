import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1);
  const [sessionToken, setSessionToken] = useState(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRouteByRole = async () => {
    try {
      const userRes = await authService.getCurrentUser();
      const role = userRes.data.role;
      if (role === 'STUDENT') navigate('/student/dashboard');
      else if (role === 'INDUSTRY_PARTNER') navigate('/partner/dashboard');
      else if (['FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'EVENT_COORDINATOR', 'ADMINISTRATIVE_STAFF'].includes(role)) navigate('/staff/dashboard');
      else navigate('/');
    } catch (e) {
      navigate('/');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res?.success) {
        if (res.requiresOtp) {
          setSessionToken(res.sessionToken);
          setStep(2);
        } else {
          await handleRouteByRole();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.verifyOtp(sessionToken, otpCode);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Force context to re-fetch user by reloading window or calling a context function.
        // Easiest is to reload, but calling route handle handles it well if we just set token.
        await handleRouteByRole();
        window.location.reload(); // Quick way to sync auth context state
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-md shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-center mb-6">Portal Login</h2>
      {error && <div className="p-3 mb-4 text-sm text-rose-700 bg-rose-50 border-l-4 border-rose-500 rounded">{error}</div>}
      
      {step === 1 ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
          
          <div className="text-center mt-4 text-sm">
            <Link to="/auth/admin/login" className="text-slate-500 hover:text-emerald-600">Admin Login</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="text-center text-sm text-slate-600 mb-4">
            An OTP has been sent to your registered email or phone. Please enter it below to verify your identity.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Enter OTP Code</label>
            <input
              type="text"
              className="form-input text-center tracking-widest text-lg"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              required
              maxLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" onClick={() => setStep(1)} className="btn-outline w-full mt-2">
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
