import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { platformService } from '../../services/platformService';
import { eventService } from '../../services/eventService';
import { vacancyService } from '../../services/vacancyService';

export default function StaffDashboard() {
  const { user, hasAnyRole } = useAuth();
  const navigate = useNavigate();

  // Operational KPI metrics
  const [eventsCount, setEventsCount] = useState(0);
  const [pendingVacanciesCount, setPendingVacanciesCount] = useState(0);
  const [pendingPartnersCount, setPendingPartnersCount] = useState(0);
  const [activeVacanciesCount, setActiveVacanciesCount] = useState(0);

  // Operational list data
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pendingVacancyList, setPendingVacancyList] = useState([]);
  const [pendingPartnerList, setPendingPartnerList] = useState([]);
  const [recentVacancies, setRecentVacancies] = useState([]);

  const [loading, setLoading] = useState(true);

  const isFacultyManagement = hasAnyRole(
    'FACULTY_MANAGEMENT',
    'FACULTY_COORDINATOR',
    'INTERNSHIP_COORDINATOR',
    'ADMINISTRATIVE_STAFF'
  );

  useEffect(() => {
    if (
      user &&
      hasAnyRole('EVENT_COORDINATOR') &&
      !hasAnyRole(
        'FACULTY_MANAGEMENT',
        'FACULTY_COORDINATOR',
        'INTERNSHIP_COORDINATOR',
        'ADMINISTRATIVE_STAFF',
        'SYSTEM_ADMIN'
      )
    ) {
      navigate('/staff/events', { replace: true });
    }
  }, [user, hasAnyRole, navigate]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch events & public vacancies
      const [eventsRes, pubVacRes] = await Promise.allSettled([
        eventService.getEvents(),
        vacancyService.getPublicVacancies()
      ]);

      // Process Events
      if (eventsRes.status === 'fulfilled') {
        const data = eventsRes.value?.data?.content || eventsRes.value?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setEventsCount(arr.length);

        const upcoming = arr
          .filter(e => e.status !== 'CANCELLED')
          .sort((a, b) => new Date(a.startDateTime || a.date) - new Date(b.startDateTime || b.date))
          .slice(0, 4);
        setUpcomingEvents(upcoming);
      }

      // Process Public Vacancies
      if (pubVacRes.status === 'fulfilled') {
        const data = pubVacRes.value?.data?.content || pubVacRes.value?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setActiveVacanciesCount(arr.length);

        const newest = arr
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 4);
        setRecentVacancies(newest);
      }

      // 2. Fetch coordinator review items if authorized
      if (isFacultyManagement) {
        const [vacAppRes, partAppRes, adminVacRes] = await Promise.allSettled([
          platformService.getVacancyApprovals('PENDING_REVIEW'),
          platformService.getPartnerVerifications('PENDING_REVIEW'),
          vacancyService.getAdminVacancies({ size: 50 })
        ]);

        // Vacancies map to filter out deleted ones
        let validVacMap = new Map();
        if (adminVacRes.status === 'fulfilled') {
          const vList = adminVacRes.value?.data?.data?.content || adminVacRes.value?.data?.content || adminVacRes.value?.data || [];
          if (Array.isArray(vList)) {
            vList.forEach(v => validVacMap.set(String(v.id), v));
          }
        }

        // Process Vacancy Approvals (excluding deleted vacancies)
        if (vacAppRes.status === 'fulfilled') {
          const data = vacAppRes.value?.data?.content || vacAppRes.value?.data || [];
          const rawApprovals = Array.isArray(data) ? data : [];
          
          // Filter out orphaned records where vacancy doesn't exist in vacancy-service
          const validApprovals = rawApprovals.filter(p => {
            const vId = String(p.vacancyId || p.id);
            return validVacMap.has(vId);
          });

          setPendingVacanciesCount(validApprovals.length);
          setPendingVacancyList(validApprovals.slice(0, 3));
        }

        // Process Partner Verifications
        if (partAppRes.status === 'fulfilled') {
          const data = partAppRes.value?.data?.content || partAppRes.value?.data || [];
          const arr = Array.isArray(data) ? data : [];
          setPendingPartnersCount(arr.length);
          setPendingPartnerList(arr.slice(0, 3));
        }
      }
    } catch (err) {
      console.error('Failed to load administrative dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalPendingActions = pendingVacanciesCount + pendingPartnersCount;

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Clean Header */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Administrative Staff Portal
              </span>
              <span className="text-xs text-slate-400">NSBM Green University</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user?.username || 'Staff'}
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Monitor university event schedules, oversee corporate partner registrations, and review pending internship vacancies.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/staff/events/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              New Event
            </Link>
            <Link
              to="/staff/vacancy-approvals"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">rule</span>
              Review Vacancies
            </Link>
            <Link
              to="/staff/partners"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              Partners
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduled Events */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Events</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '—' : eventsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Campus lectures, symposiums & workshops</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-bold ${totalPendingActions > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
              {loading ? '—' : totalPendingActions}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {pendingVacanciesCount} vacancies · {pendingPartnersCount} partner verifications
            </p>
          </div>
        </div>

        {/* Active Published Vacancies */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Vacancies</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">work</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '—' : activeVacanciesCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Published opportunities for students</p>
          </div>
        </div>

        {/* Partner Registrations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partner Verifications</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '—' : pendingPartnersCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Awaiting coordinator review</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Action Items & Pending Reviews */}
        <div className="lg:col-span-1 space-y-6">
          {/* Review Queue Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-500">assignment_late</span>
                Items Requiring Action
              </h2>
              {totalPendingActions > 0 && (
                <Badge variant="warning" className="text-[10px]">
                  {totalPendingActions} Pending
                </Badge>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Vacancy Approvals Row */}
              <Link
                to="/staff/vacancy-approvals"
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">rule</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">
                      Vacancy Approvals
                    </h3>
                    <p className="text-xs text-slate-500">
                      {pendingVacanciesCount} {pendingVacanciesCount === 1 ? 'posting' : 'postings'} awaiting governance review
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                  chevron_right
                </span>
              </Link>

              {/* Partner Verifications Row */}
              <Link
                to="/staff/partners"
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">domain_verification</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                      Partner Verifications
                    </h3>
                    <p className="text-xs text-slate-500">
                      {pendingPartnersCount} {pendingPartnersCount === 1 ? 'organization' : 'organizations'} pending validation
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                  chevron_right
                </span>
              </Link>
            </div>
          </div>

          {/* Quick Staff Navigation Links */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Management Modules
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/staff/events"
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col items-center text-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600">event</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Events Hub</span>
              </Link>

              <Link
                to="/staff/venues"
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col items-center text-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[20px] text-rose-600">location_on</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Venues</span>
              </Link>

              <Link
                to="/staff/speakers"
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col items-center text-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[20px] text-purple-600">record_voice_over</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Speakers</span>
              </Link>

              <Link
                to="/staff/reports"
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col items-center text-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[20px] text-emerald-600">bar_chart</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Reports</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Columns: Upcoming Events & Recent Vacancies */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Upcoming Events List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600">schedule</span>
                Upcoming Events
              </h2>
              <Link
                to="/staff/events"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View all
              </Link>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading events...</div>
              ) : upcomingEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-1 opacity-40">event_busy</span>
                  <p>No upcoming events found.</p>
                </div>
              ) : (
                upcomingEvents.map((evt) => {
                  const eventDate = new Date(evt.startDateTime || evt.date);
                  return (
                    <Link
                      key={evt.id}
                      to={`/staff/events/${evt.id}`}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3.5 group"
                    >
                      {/* Date Badge */}
                      <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 leading-tight">
                          {eventDate.toLocaleString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">
                          {eventDate.getDate() || '—'}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">
                          {evt.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          {evt.venueName || 'Campus Venue'}
                        </p>
                      </div>

                      <Badge
                        variant={evt.status === 'PUBLISHED' || evt.status === 'SCHEDULED' ? 'success' : 'neutral'}
                        className="text-[10px] shrink-0"
                      >
                        {evt.status || 'DRAFT'}
                      </Badge>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Vacancies List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">work_history</span>
                Active Vacancies
              </h2>
              <Link
                to="/staff/vacancy-approvals"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Manage
              </Link>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading vacancies...</div>
              ) : recentVacancies.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-1 opacity-40">work_off</span>
                  <p>No active vacancies available.</p>
                </div>
              ) : (
                recentVacancies.map((vac) => (
                  <Link
                    key={vac.id}
                    to={`/staff/vacancy-approvals/${vac.id}`}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col justify-center group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition-colors">
                        {vac.title}
                      </h3>
                      <Badge variant="info" className="text-[10px] shrink-0">
                        {vac.jobType || 'INTERNSHIP'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="truncate flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">corporate_fare</span>
                        {vac.companyName || 'Corporate Partner'}
                      </span>
                      <span className="shrink-0 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        {vac.location || 'Colombo'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
