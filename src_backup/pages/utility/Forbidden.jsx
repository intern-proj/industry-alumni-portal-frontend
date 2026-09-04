import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export default function Forbidden() {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    const role = user.role;
    if (role === 'STUDENT') return '/student/dashboard';
    if (role === 'INDUSTRY_PARTNER') return '/partner/dashboard';
    if (role === 'SYSTEM_ADMIN') return '/admin/users';
    return '/staff/dashboard';
  };

  return (
    <div className="min-h-screen bg-surface-bright flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative">
          <span className="font-display-hero text-[110px] leading-none font-extrabold text-slate-200 select-none">
            403
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-error-container/40 text-error rounded-2xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[36px]">lock</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-headline-lg text-slate-900">Access Restricted</h1>
          <p className="font-body-base text-slate-600">
            You do not have the required institutional authorization or role privilege to view this area.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link to={getDashboardLink()}>
            <Button variant="primary" icon="dashboard" className="w-full sm:w-auto">
              Go to Your Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" icon="home" className="w-full sm:w-auto">
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
