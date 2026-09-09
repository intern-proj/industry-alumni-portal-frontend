import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';
import GlobalBannerBar from '../components/common/GlobalBannerBar';
import { platformService } from '../services/platformService';
import { storageService } from '../services/storageService';

const baseNavItems = [
  { label: 'Dashboard', path: '/partner/dashboard', icon: 'dashboard' },
  { label: 'Manage Vacancies', path: '/partner/vacancies', icon: 'work' },
  { label: 'Talent Search', path: '/partner/talent-search', icon: 'person_search' },
  { label: 'Company Profile', path: '/partner/profile', icon: 'business' },
  { label: 'Settings', path: '/partner/settings', icon: 'settings' },
];

export default function PartnerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [navItems, setNavItems] = useState(baseNavItems);

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        const res = await platformService.getMyVerificationStatus();
        if (res.data && res.data.status !== 'APPROVED') {
          // If not verified, insert Verification tab before Settings
          setNavItems([
            ...baseNavItems.slice(0, 4),
            { label: 'Verification', path: '/partner/verification', icon: 'verified_user' },
            baseNavItems[4]
          ]);
        }
      } catch (err) {
        console.error("Failed to check verification status", err);
      }
    };
    fetchVerificationStatus();
  }, []);

  const initials = user?.username?.substring(0, 2).toUpperCase() || 'PT';

  const Sidebar = ({ onClose }) => (
    <>
      <div className={`mb-6 px-2 flex items-center ${isCollapsed ? 'flex-col gap-4 justify-center' : 'justify-between'}`}>
        {isCollapsed ? (
          <Logo size="sm" to={null} iconOnly={true} onClick={() => setIsCollapsed(false)} />
        ) : (
          <Logo size="sm" to="/partner/dashboard" />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hidden md:flex items-center justify-center"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`${isActive ? 'sidebar-item-active' : 'sidebar-item'} ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'font-[FILL:1]' : ''}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-xs">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1.5 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3'} py-1.5`}>
          {!isCollapsed && <span className="text-xs text-slate-500 dark:text-slate-400">Theme</span>}
          <ThemeToggle size="sm" />
        </div>
        <Link 
          to="/" 
          className={`sidebar-item text-xs ${isCollapsed ? 'justify-center px-0' : ''}`}
          onClick={onClose}
          title={isCollapsed ? "Public Portal" : undefined}
        >
          <span className="material-symbols-outlined text-[18px]">public</span>
          {!isCollapsed && <span>Public Portal</span>}
        </Link>
        <button 
          onClick={logout} 
          className={`sidebar-item text-xs w-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 ${isCollapsed ? 'justify-center px-0' : ''}`}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      <div className={`mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'}`}>
        {user?.logoUrl ? (
          <img 
            src={storageService.getFileUrl(user.logoUrl)} 
            alt={user?.username || 'Partner'} 
            className="w-8 h-8 flex-shrink-0 rounded-xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-sky-500/20"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div 
            className="w-8 h-8 flex-shrink-0 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs"
            title={isCollapsed ? `${user?.username} (Industry Partner)` : undefined}
          >
            {initials}
          </div>
        )}
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.username || 'Partner'}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Industry Partner</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col p-4 z-40 ${isCollapsed ? 'w-20' : 'w-sidebar-width'}`}>
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-20' : 'md:ml-sidebar-width'}`}>
        {/* Mobile Header */}
        <header className="md:hidden glass-header flex justify-between items-center px-4 h-14 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
          <Logo size="sm" to="/partner/dashboard" />
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
