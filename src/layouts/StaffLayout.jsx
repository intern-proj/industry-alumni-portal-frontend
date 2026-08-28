import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';
import GlobalBannerBar from '../components/common/GlobalBannerBar';

const baseNavItems = [
  { label: 'Dashboard', path: '/staff/dashboard', icon: 'dashboard', roles: null },
  { label: 'Events & Venues', path: '/staff/events', icon: 'event', roles: ['EVENT_COORDINATOR', 'FACULTY_MANAGEMENT', 'ADMINISTRATIVE_STAFF'] },
  { label: 'Partners', path: '/staff/partners', icon: 'verified_user', roles: ['FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'ADMINISTRATIVE_STAFF'] },
  { label: 'Vacancy Approvals', path: '/staff/vacancy-approvals', icon: 'task_alt', roles: ['FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'ADMINISTRATIVE_STAFF'] },
  { label: 'Reports & Analytics', path: '/staff/reports', icon: 'analytics', roles: ['FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'ADMINISTRATIVE_STAFF'] },
  { label: 'Staff Invitations', path: '/staff/invite-staff', icon: 'person_add', roles: ['FACULTY_COORDINATOR', 'ADMINISTRATIVE_STAFF'] },
];

export default function StaffLayout() {
  const { user, logout, hasAnyRole } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.username?.substring(0, 2).toUpperCase() || 'SF';

  const visibleNav = baseNavItems.filter(
    (item) => !item.roles || hasAnyRole(...item.roles)
  );

  function getRoleLabel() {
    if (hasAnyRole('ADMINISTRATIVE_STAFF')) return 'Administrative Staff';
    if (hasAnyRole('FACULTY_MANAGEMENT')) return 'Faculty Management';
    if (hasAnyRole('FACULTY_COORDINATOR')) return 'Faculty Coordinator';
    if (hasAnyRole('INTERNSHIP_COORDINATOR')) return 'Internship Coordinator';
    if (hasAnyRole('EVENT_COORDINATOR')) return 'Event Coordinator';
    return 'Staff Member';
  }

  const Sidebar = ({ onClose }) => (
    <>
      <div className="mb-6 px-2 flex items-center justify-between">
        <Logo size="sm" to="/staff/dashboard" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={isActive ? 'sidebar-item-active' : 'sidebar-item'}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'font-[FILL:1]' : ''}`}>
                {item.icon}
              </span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1.5 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Theme</span>
          <ThemeToggle size="sm" />
        </div>
        <Link to="/" className="sidebar-item text-xs" onClick={onClose}>
          <span className="material-symbols-outlined text-[18px]">public</span>
          <span>Public Site</span>
        </Link>
        <button onClick={logout} className="sidebar-item text-xs w-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.username || 'Staff'}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{getRoleLabel()}</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col p-4 z-40 transition-colors">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:ml-sidebar-width min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden glass-header flex justify-between items-center px-4 h-14 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
          <Logo size="sm" to="/staff/dashboard" />
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <button className="p-2 text-slate-700 dark:text-slate-200" onClick={() => setMobileOpen(!mobileOpen)}>
              <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            <div className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 p-4 flex flex-col md:hidden">
              <Sidebar onClose={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        {/* Global System Broadcast Banner */}
        <GlobalBannerBar />

        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
