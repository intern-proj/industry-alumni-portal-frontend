import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';
import GlobalBannerBar from '../components/common/GlobalBannerBar';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Vacancies', path: '/vacancies' },
  { label: 'Events & Workshops', path: '/events' },
  { label: 'Corporate Network', path: '/collaborators' },
];

export default function PublicLayout() {
  const { isAuthenticated, user, logout, hasAnyRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function getDashboardPath() {
    if (!user?.roles) return '/login';
    if (hasAnyRole('STUDENT')) return '/student/dashboard';
    if (hasAnyRole('INDUSTRY_PARTNER')) return '/partner/dashboard';
    if (hasAnyRole('SYSTEM_ADMIN')) return '/admin/users';
    return '/staff/dashboard';
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Clean, Professional Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between h-20 py-4">
          
          {/* Brand Logo */}
          <Logo size="md" to="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle size="md" />

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link 
                  to={getDashboardPath()} 
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-sm shadow-emerald-500/25 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  Dashboard
                </Link>
                <button 
                  onClick={logout} 
                  className="px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-sm shadow-emerald-500/25 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Login
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                  location.pathname === link.path
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link 
                to="/partner-register" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 font-medium"
              >
                For Employers (Partner Registration)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global System Broadcast Banner */}
      <GlobalBannerBar />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Clean, Refined Footer */}
      <footer className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3 md:col-span-1">
              <Logo size="sm" to="/" />
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                NSBM Industry Collaboration Unit (NIC Unit), NSBM Green University, Sri Lanka.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">Student Services</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link to="/vacancies" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Browse Vacancies</Link></li>
                <li><Link to="/events" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Events & Workshops</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">Industry Partners</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link to="/partner-register" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Partner Registration</Link></li>
                <li><Link to="/collaborators" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Companies Directory</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">Contact</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li>Email: nic@nsbm.ac.lk</li>
                <li>Phone: +94 11 544 5000</li>
                <li>Location: Pitipana, Homagama, Sri Lanka</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} NSBM Green University • NIC Unit. All rights reserved.</p>
            <div className="flex gap-4">
              <span>Empowering Careers & Industry Collaboration</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
