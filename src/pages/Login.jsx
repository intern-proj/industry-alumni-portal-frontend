import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res?.success) {
        if (res.requiresOtp) {
          alert('OTP required. Proceed to OTP flow.');
        } else {
          const role = window.prompt("Enter role to mock login (STUDENT, INDUSTRY_PARTNER, STAFF):", "STAFF");
          if (role === 'INDUSTRY_PARTNER') {
            navigate('/partner/dashboard');
          } else if (role === 'STAFF') {
            navigate('/staff/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-center mb-6">Portal Login</h2>
      {error && <div className="p-3 mb-4 text-sm text-rose-700 bg-rose-50 border-l-4 border-rose-500 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
