import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { platformService } from '../../services/platformService';
import { eventService } from '../../services/eventService';
import { vacancyService } from '../../services/vacancyService';

export default function StaffDashboard() {
  const { user, hasAnyRole } = useAuth();
  const [pendingVacancies, setPendingVacancies] = useState(0);
  const [pendingPartners, setPendingPartners] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [activeVacanciesCount, setActiveVacanciesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isFacultyManagement = hasAnyRole('FACULTY_MANAGEMENT', 'SYSTEM_ADMIN', 'FACULTY_COORDINATOR');

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [vacAppRes, partAppRes, eventsRes, pubVacRes] = await Promise.allSettled([
          platformService.getVacancyApprovals('PENDING_REVIEW'),
          platformService.getPartnerVerifications('PENDING'),
          eventService.getEvents(),
          vacancyService.getPublicVacancies(),
        ]);

        if (vacAppRes.status === 'fulfilled') {
          const data = vacAppRes.value?.data?.content || vacAppRes.value?.data || [];
          setPendingVacancies(Array.isArray(data) ? data.length : 0);
        }
        if (partAppRes.status === 'fulfilled') {
          const data = partAppRes.value?.data?.content || partAppRes.value?.data || [];
          setPendingPartners(Array.isArray(data) ? data.length : 0);
        }
        if (eventsRes.status === 'fulfilled') {
          const data = eventsRes.value?.data?.content || eventsRes.value?.data || [];
          setEventsCount(Array.isArray(data) ? data.length : 0);
        }
        if (pubVacRes.status === 'fulfilled') {
          const data = pubVacRes.value?.data?.content || pubVacRes.value?.data || [];
          setActiveVacanciesCount(Array.isArray(data) ? data.length : 0);
        }
      } catch {
        // Default to 0
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Staff & Faculty Dashboard</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Welcome back, {user?.username || 'Staff Member'}. Here is the current system overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold">Scheduled Events</span>
            <span className="material-symbols-outlined text-[20px]">event</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{loading ? '—' : eventsCount}</div>
        </div>
        
        {isFacultyManagement && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold">Pending Approvals</span>
              <span className="material-symbols-outlined text-[20px]">rule</span>
            </div>
            <div className="text-2xl font-bold text-amber-500 mt-2">{loading ? '—' : (pendingVacancies + pendingPartners)}</div>
          </div>
        )}
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold">Active Vacancies</span>
            <span className="material-symbols-outlined text-[20px]">work</span>
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-2">{loading ? '—' : activeVacanciesCount}</div>
        </div>
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold">Partner Verifications</span>
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <div className="text-2xl font-bold text-blue-500 mt-2">{loading ? '—' : pendingPartners}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Industrial Placement Gateway</span>
                <Badge variant="success">ONLINE</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">AI Intelligence Microservice</span>
                <Badge variant="success">HEALTHY</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Tamper-proof Certificate Registry</span>
                <Badge variant="info">ACTIVE</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {isFacultyManagement && (
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Action Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex gap-3 items-center">
                    <span className="material-symbols-outlined text-amber-500 text-[20px]">domain_verification</span>
                    <div>
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{pendingPartners} Partner Registrations Pending</p>
                      <p className="text-[11px] text-slate-400">Requires institutional validation</p>
                    </div>
                  </div>
                  <Link to="/staff/partners" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-semibold">Review</Link>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex gap-3 items-center">
                    <span className="material-symbols-outlined text-amber-500 text-[20px]">rule</span>
                    <div>
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{pendingVacancies} Vacancies Pending Approval</p>
                      <p className="text-[11px] text-slate-400">Requires coordinator review</p>
                    </div>
                  </div>
                  <Link to="/staff/vacancy-approvals" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-semibold">Review</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
