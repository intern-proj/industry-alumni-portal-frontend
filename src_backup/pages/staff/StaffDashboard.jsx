import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { platformService } from '../../services/platformService';
import { eventService } from '../../services/eventService';
import { vacancyService } from '../../services/vacancyService';
import { metricsService } from '../../services/metricsService';

export default function StaffDashboard() {
  const { user, hasAnyRole } = useAuth();
  
  // Existing KPI states
  const [pendingVacancies, setPendingVacancies] = useState(0);
  const [pendingPartners, setPendingPartners] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [activeVacanciesCount, setActiveVacanciesCount] = useState(0);
  
  // New widget states
  const [systemTelemetry, setSystemTelemetry] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentVacancies, setRecentVacancies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);

  const isFacultyManagement = hasAnyRole('FACULTY_MANAGEMENT', 'SYSTEM_ADMIN', 'FACULTY_COORDINATOR', 'ADMINISTRATIVE_STAFF');

  const navigate = useNavigate();

  useEffect(() => {
    if (user && hasAnyRole('EVENT_COORDINATOR') && !hasAnyRole('FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'ADMINISTRATIVE_STAFF', 'SYSTEM_ADMIN')) {
      navigate('/staff/events', { replace: true });
    }
  }, [user, hasAnyRole, navigate]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Base promises that everyone needs
        const promises = [
          eventService.getEvents(),
          vacancyService.getPublicVacancies()
        ];
        
        let vacIndex = -1, partIndex = -1, telIndex = -1, logIndex = -1;

        if (isFacultyManagement) {
          vacIndex = promises.push(platformService.getVacancyApprovals('PENDING_REVIEW')) - 1;
          partIndex = promises.push(platformService.getPartnerVerifications('PENDING_REVIEW')) - 1;
          telIndex = promises.push(metricsService.fetchSystemTelemetry()) - 1;
          logIndex = promises.push(metricsService.getRecentAuditLogs(6)) - 1;
        }

        const results = await Promise.allSettled(promises);
        
        const eventsRes = results[0];
        const pubVacRes = results[1];
        const vacAppRes = vacIndex >= 0 ? results[vacIndex] : { status: 'rejected' };
        const partAppRes = partIndex >= 0 ? results[partIndex] : { status: 'rejected' };
        const telemetryRes = telIndex >= 0 ? results[telIndex] : { status: 'rejected' };
        const logsRes = logIndex >= 0 ? results[logIndex] : { status: 'rejected' };

        // Vacancy Approvals
        if (vacAppRes.status === 'fulfilled') {
          const data = vacAppRes.value?.data?.content || vacAppRes.value?.data || [];
          setPendingVacancies(Array.isArray(data) ? data.length : 0);
        }

        // Partner Approvals
        if (partAppRes.status === 'fulfilled') {
          const data = partAppRes.value?.data?.content || partAppRes.value?.data || [];
          setPendingPartners(Array.isArray(data) ? data.length : 0);
        }

        // Events
        if (eventsRes.status === 'fulfilled') {
          const data = eventsRes.value?.data?.content || eventsRes.value?.data || [];
          const arr = Array.isArray(data) ? data : [];
          setEventsCount(arr.length);
          
          // Sort events by date ascending (upcoming first)
          const upcoming = arr
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 4);
          setRecentEvents(upcoming);
        }

        // Public Vacancies
        if (pubVacRes.status === 'fulfilled') {
          const data = pubVacRes.value?.data?.content || pubVacRes.value?.data || [];
          const arr = Array.isArray(data) ? data : [];
          setActiveVacanciesCount(arr.length);
          
          // Sort by creation date descending (newest first)
          const newest = arr
            .sort((a, b) => new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt))
            .slice(0, 4);
          setRecentVacancies(newest);
        }

        // Telemetry
        if (telemetryRes.status === 'fulfilled') {
          setSystemTelemetry(telemetryRes.value);
        }

        // Audit Logs
        if (logsRes.status === 'fulfilled') {
          setAuditLogs(logsRes.value || []);
        }

      } catch (error) {
        console.error("Dashboard failed to load completely", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg border border-white/10 p-8 md:p-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">
              Hello, {user?.username || 'Staff Member'}!
            </h1>
            <p className="text-blue-100 max-w-xl text-lg font-medium opacity-90">
              Welcome back to your dashboard. Here's what's happening on the portal today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
             <Link to="/staff/events/create" className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/20 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                New Event
             </Link>
             <Link to="/staff/system-metrics" className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-slate-50 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">insights</span>
                System Health
             </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Scheduled Events</span>
              <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 p-2 rounded-xl">
                <span className="material-symbols-outlined text-[20px]">event</span>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{loading ? '—' : eventsCount}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Total upcoming & past</p>
          </div>
        </div>
        
        {isFacultyManagement && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full blur-2xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center text-slate-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Pending Approvals</span>
                <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 p-2 rounded-xl">
                  <span className="material-symbols-outlined text-[20px]">rule</span>
                </div>
              </div>
              <div className="text-4xl font-extrabold text-amber-600 tracking-tight">{loading ? '—' : (pendingVacancies + pendingPartners)}</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Require your attention</p>
            </div>
          </div>
        )}
        
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Vacancies</span>
              <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 p-2 rounded-xl">
                <span className="material-symbols-outlined text-[20px]">work</span>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">{loading ? '—' : activeVacanciesCount}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Currently published</p>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Partner Verifs</span>
              <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 p-2 rounded-xl">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-indigo-600 tracking-tight">{loading ? '—' : pendingPartners}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Pending companies</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: System & Actions */}
        <div className="xl:col-span-1 space-y-6">
          {isFacultyManagement && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[320px]">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${systemTelemetry?.status === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${systemTelemetry?.status === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  </span>
                  Live System Pulse
                </h3>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                {loading || !systemTelemetry ? (
                  <div className="flex items-center justify-center h-full text-slate-400 gap-3">
                    <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                    <span className="text-sm font-medium">Pinging microservices...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm text-slate-500">
                           <span className="material-symbols-outlined text-[20px]">dns</span>
                         </div>
                         <div>
                           <p className="text-xs font-semibold text-slate-500 uppercase">Network Status</p>
                           <p className="font-bold text-slate-800 dark:text-slate-200">{systemTelemetry.status}</p>
                         </div>
                      </div>
                      <Badge variant={systemTelemetry.status === 'UP' ? 'success' : 'danger'} className="px-2 py-1">
                        {systemTelemetry.status === 'UP' ? 'Healthy' : 'Degraded'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm text-slate-500">
                           <span className="material-symbols-outlined text-[20px]">speed</span>
                         </div>
                         <div>
                           <p className="text-xs font-semibold text-slate-500 uppercase">Avg Latency</p>
                           <p className="font-bold text-slate-800 dark:text-slate-200">{systemTelemetry.avgLatencyMs}ms</p>
                         </div>
                      </div>
                      <span className={`text-sm font-bold ${systemTelemetry.avgLatencyMs < 200 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {systemTelemetry.avgLatencyMs < 200 ? 'Optimal' : 'Slow'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm text-slate-500">
                           <span className="material-symbols-outlined text-[20px]">error</span>
                         </div>
                         <div>
                           <p className="text-xs font-semibold text-slate-500 uppercase">Recent Errors</p>
                           <p className="font-bold text-slate-800 dark:text-slate-200">{systemTelemetry.recentErrors}</p>
                         </div>
                      </div>
                      {systemTelemetry.recentErrors > 0 && (
                        <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-full">Requires Attention</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isFacultyManagement && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-blue-500">task_alt</span> Action Items
                </h3>
              </div>
              <div className="p-2">
                <Link to="/staff/partners" className="flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform shadow-sm border border-indigo-100 dark:border-indigo-800">
                    <span className="material-symbols-outlined text-[18px]">domain_verification</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Partner Registrations</h4>
                    <p className="text-xs text-slate-500 font-medium">{pendingPartners} awaiting validation</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-indigo-500 transition-colors">chevron_right</span>
                </Link>
                
                <Link to="/staff/vacancy-approvals" className="flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group mt-1">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-sm border border-amber-100 dark:border-amber-800">
                    <span className="material-symbols-outlined text-[18px]">rule</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Vacancy Approvals</h4>
                    <p className="text-xs text-slate-500 font-medium">{pendingVacancies} require review</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-amber-500 transition-colors">chevron_right</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right Column: Lists */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Events List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[360px]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-blue-500">calendar_month</span> Upcoming Events
              </h3>
              <Link to="/staff/events" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors">View All</Link>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-400">Loading events...</div>
              ) : recentEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                  <p className="text-sm font-medium">No upcoming events scheduled.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 flex gap-4 items-center group cursor-pointer">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-2 min-w-[3.5rem] flex flex-col items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                        <span className="text-[10px] uppercase font-bold text-blue-500 group-hover:text-blue-100">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white group-hover:text-white">{new Date(event.date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{event.title}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-500">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="truncate">{event.venue?.name || 'TBA'}</span>
                        </div>
                      </div>
                      <Badge variant={event.status === 'PUBLISHED' ? 'success' : event.status === 'CANCELLED' ? 'danger' : 'neutral'} className="text-[10px]">
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vacancies List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[360px]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-500">work_history</span> Recent Vacancies
              </h3>
              <Link to="/staff/vacancy-approvals" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors">Manage</Link>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-400">Loading vacancies...</div>
              ) : recentVacancies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">work_off</span>
                  <p className="text-sm font-medium">No active vacancies available.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentVacancies.map((vacancy) => (
                    <div key={vacancy.id} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">{vacancy.title}</h4>
                        <Badge variant="info" className="text-[10px] ml-2 shrink-0">{vacancy.type || 'INTERNSHIP'}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">business</span>
                          <span className="truncate">{vacancy.company?.name || 'Partner Company'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                          <span>{vacancy.location || 'Remote'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Activity Log / System Feed */}
      {isFacultyManagement && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-violet-500">manage_history</span> Recent Activity & Audit Logs
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Time</th>
                    <th className="px-6 py-3 font-semibold">Action</th>
                    <th className="px-6 py-3 font-semibold">User</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 font-medium">Loading audit logs...</td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 font-medium">No recent activity found.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{log.action || 'Unknown Action'}</div>
                          {log.details && <div className="text-xs text-slate-500 mt-0.5 max-w-md truncate">{log.details}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                          {log.username || log.userId || 'System'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={log.status === 'SUCCESS' ? 'success' : log.status === 'FAILURE' ? 'danger' : 'neutral'}>
                            {log.status || 'INFO'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}
      
    </div>
  );
}
