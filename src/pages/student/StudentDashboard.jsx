import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { participationService } from '../../services/participationService';
import { applicationService } from '../../services/applicationService';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      participationService.getRegistrations({ userId: user?.id, size: 5 }).catch(() => ({ data: [] })),
      applicationService.getApplicationsByAlumni(user?.id, { size: 5 }).catch(() => ({ data: [] })),
    ]).then(([regRes, appRes]) => {
      setRegistrations(regRes.data?.content || regRes.data || []);
      setApplications(appRes.data?.content || appRes.data || []);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const metrics = [
    { label: 'Event Regs', value: registrations.length || 0, icon: 'event', color: 'text-primary' },
    { label: 'Certificates', value: 0, icon: 'workspace_premium', color: 'text-primary' },
    { label: 'Applications', value: applications.length || 0, icon: 'assignment', color: 'text-primary' },
    { label: 'Opportunities', value: '—', icon: 'lightbulb', color: 'text-primary' },
  ];

  return (
    <div className="space-y-stack-lg">
      {/* Welcome */}
      <section>
        <h2 className="font-headline-lg text-headline-lg text-slate-900">Welcome back, {user?.username || 'Student'}</h2>
        <p className="font-body-base text-body-base text-slate-600 mt-1">Here is your academic and industry collaboration overview.</p>
      </section>

      {/* Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-body-medium text-body-medium">{m.label}</span>
              <span className="material-symbols-outlined">{m.icon}</span>
            </div>
            <div className={`font-display-hero text-display-hero ${m.color} mt-2`}>{m.value}</div>
          </div>
        ))}
      </section>

      {/* 2-Column Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Recent Event Registrations */}
        <div className="lg:col-span-7 glass-card rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-slate-900">Recent Event Registrations</h3>
            <Link to="/student/events" className="font-button-text text-button-text text-secondary hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin" /></div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 text-[36px]">event_busy</span>
              <p className="font-body-base text-body-base text-slate-400 mt-2">No event registrations yet.</p>
              <Link to="/events" className="btn-outline h-8 text-[12px] mt-3 inline-flex">Browse Events</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Event Name</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {registrations.slice(0, 5).map((reg) => (
                    <tr key={reg.id}>
                      <td className="font-medium text-slate-900">{reg.eventTitle || reg.eventId}</td>
                      <td className="text-slate-600">{new Date(reg.registeredAt || Date.now()).toLocaleDateString()}</td>
                      <td><span className="badge-success text-[10px]">{reg.status || 'REGISTERED'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Job Applications */}
        <div className="lg:col-span-5 glass-card rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-slate-900">Recent Job Applications</h3>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin" /></div>
            ) : applications.length === 0 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-slate-400 text-[36px]">work_off</span>
                <p className="font-body-base text-body-base text-slate-400 mt-2">No applications yet.</p>
                <Link to="/student/vacancies" className="btn-outline h-8 text-[12px] mt-3 inline-flex">Browse Vacancies</Link>
              </div>
            ) : (
              applications.slice(0, 4).map((app) => (
                <div key={app.id} className="flex items-start gap-4 p-4 border border-outline-variant/30 rounded bg-white hover:bg-surface transition-colors">
                  <div className="w-10 h-10 rounded bg-surface flex items-center justify-center border border-outline-variant/50 shrink-0">
                    <span className="material-symbols-outlined text-secondary">corporate_fare</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-body-medium text-body-medium text-slate-900 truncate">{app.vacancyTitle || app.positionTitle || 'Position'}</h4>
                    <p className="font-caption text-caption text-slate-600">{app.companyName || 'Company'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`badge-${app.status === 'SHORTLISTED' ? 'info' : app.status === 'PLACED' ? 'placed' : 'neutral'} text-[10px]`}>
                        {app.status || 'APPLIED'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
