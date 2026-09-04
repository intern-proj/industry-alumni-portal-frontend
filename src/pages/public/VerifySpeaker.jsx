import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function VerifySpeaker() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid or missing invitation token.');
      return;
    }

    try {
      localStorage.setItem('auth_token', token);
      // Force reload to let AuthContext initialize with the GUEST_SPEAKER role
      window.location.href = '/guest-speaker/dashboard';
    } catch (err) {
      setError('An error occurred while processing your invitation.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verification Failed</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-medium animate-pulse">Verifying invitation and authenticating...</p>
      </div>
    </div>
  );
}
