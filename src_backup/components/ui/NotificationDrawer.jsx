import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const initialNotifications = [
  {
    id: 1,
    title: 'Certificate Issued',
    message: 'Your verifiable digital participation certificate has been issued. View in My Certificates.',
    time: '10 mins ago',
    read: false,
    type: 'certificate',
    icon: 'verified',
    link: '/student/certificates',
  },
  {
    id: 2,
    title: 'New Vacancy: Cloud DevOps Trainee',
    message: 'Virtusa Cloud Hub just posted a new internship matching your target skills.',
    time: '2 hours ago',
    read: false,
    type: 'job',
    icon: 'work',
    link: '/vacancies',
  },
  {
    id: 3,
    title: 'Career Fair Registration Confirmed',
    message: 'Your check-in QR code for NIC Annual Career Fair is ready in My Events.',
    time: '1 day ago',
    read: true,
    type: 'event',
    icon: 'event_available',
    link: '/student/events',
  },
  {
    id: 4,
    title: 'IPT Weekly Logbook Due',
    message: 'Reminder to submit Week 4 internship log for supervisor sign-off.',
    time: '2 days ago',
    read: true,
    type: 'ipt',
    icon: 'menu_book',
    link: '/student/training-log',
  },
];

export default function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="relative">
      {/* Notification Trigger Bell */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all duration-200 active:scale-95 flex items-center justify-center w-9 h-9"
        title="Notifications"
        aria-label="View notifications"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Drawer / Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-3 text-xs bg-slate-50/40 dark:bg-slate-950/30">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  filter === 'all'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  filter === 'unread'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-[32px] mb-1">notifications_off</span>
                  <p className="text-xs">No notifications found.</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex items-start gap-3 transition-colors ${
                      !notif.read
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">{notif.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <Link
                          to={notif.link}
                          onClick={() => {
                            markAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          View Details <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </Link>
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
