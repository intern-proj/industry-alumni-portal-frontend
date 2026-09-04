import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-emerald-600">Alumni Portal</Link>
          <nav className="flex gap-4">
            {user ? (
              <button onClick={logout} className="text-sm font-medium text-slate-600 hover:text-slate-900">Logout ({user.username})</button>
            ) : (
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Industry Alumni Portal. All rights reserved.
      </footer>
    </div>
  );
}
