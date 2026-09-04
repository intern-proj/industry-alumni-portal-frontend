import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard' },
    { name: 'My Events', path: '/student/events' },
    { name: 'Vacancies', path: '/student/vacancies' },
    { name: 'Profile', path: '/student/profile' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link to="/" className="font-bold text-xl text-emerald-600">Alumni Portal</Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.username || 'Student'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'student@example.com'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:hidden">
          <span className="font-bold text-lg text-emerald-600">Alumni Portal</span>
          <button className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
