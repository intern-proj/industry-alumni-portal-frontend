import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/staff/dashboard' },
    { name: 'Manage Events', path: '/staff/events' },
    { name: 'Vacancy Approvals', path: '/staff/vacancies' },
    { name: 'Partner Directory', path: '/staff/partners' },
    { name: 'Reports', path: '/staff/reports' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-indigo-800 bg-indigo-950">
          <Link to="/" className="font-bold text-xl text-indigo-300">Staff Portal</Link>
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
                    ? 'bg-indigo-800 text-white border-l-4 border-indigo-400' 
                    : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white border-l-4 border-transparent'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-indigo-800 bg-indigo-950">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-indigo-200 font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username || 'Staff Member'}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.role || 'Coordinator'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-rose-300 hover:bg-rose-900/50 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          <div className="md:hidden">
            <span className="font-bold text-lg text-indigo-600">Staff Portal</span>
          </div>
          <div className="flex-1 hidden md:flex justify-end items-center gap-4">
            <span className="text-sm text-slate-500">Academic Year 2026-2027</span>
            <div className="h-6 w-px bg-slate-300"></div>
            <button className="relative p-2 text-slate-400 hover:text-slate-500">
               <span className="material-symbols-outlined">notifications</span>
               <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
