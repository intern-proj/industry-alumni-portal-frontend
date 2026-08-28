import React, { useEffect, useState } from 'react';
import { participationService } from '../../services/participationService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export default function MyEvents() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      participationService.getRegistrations({ userId: user.id })
        .then(res => {
          const data = res.data?.content || res.data || [];
          setRegistrations(Array.isArray(data) ? data : []);
        })
        .catch(() => setRegistrations([]))
        .finally(() => setLoading(false));
    } else {
      setRegistrations([]);
      setLoading(false);
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading your registered events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Events</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track your registered career workshops, guest lectures, and attendance status.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/events">
            <Button variant="outline" icon="explore">Browse Events</Button>
          </Link>
          <Link to="/student/check-in">
            <Button icon="qr_code_scanner">Check-in via Code</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Sessions ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {registrations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600">event_busy</span>
              <p className="text-sm">You haven't registered for any events yet.</p>
              <Link to="/events">
                <Button variant="outline" size="sm">Explore Upcoming Events</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {registrations.map((reg) => (
                <div key={reg.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{reg.eventTitle || 'Session Event'}</h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500">calendar_today</span> 
                        {new Date(reg.registeredAt || Date.now()).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-sky-500">pin_drop</span> 
                        {reg.venueName || 'Campus Main Hall'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Badge variant={reg.status === 'ATTENDED' ? 'success' : 'info'}>
                      {reg.status || 'REGISTERED'}
                    </Badge>
                    <Link to="/student/check-in">
                      <Button variant="outline" size="sm" icon="qr_code">Verify</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
