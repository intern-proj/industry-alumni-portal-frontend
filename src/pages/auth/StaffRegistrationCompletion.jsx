import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function StaffRegistrationCompletion() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.completeStaffRegistration(token, username, password);
      alert('Staff setup complete! You can now log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete staff setup.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-md shadow-sm border border-slate-200 text-center">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Invalid Invitation</h2>
        <p className="text-slate-600">The invitation link you followed is invalid or has expired.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-md shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-900">Staff Account Setup</h2>
        <p className="text-sm text-slate-500 mt-1">Set up your staff portal credentials.</p>
      </div>
      
      {error && <div className="p-3 mb-4 text-sm text-rose-700 bg-rose-50 border-l-4 border-rose-500 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Choose Username</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            minLength={4}
          />
        </div>
        <div>
          <label className="form-label">Create Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-md shadow-sm transition-colors mt-4">
          {loading ? 'Setting up...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
