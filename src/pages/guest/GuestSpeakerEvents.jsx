import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';

export default function GuestSpeakerEvents() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const profileRes = await eventService.getMe();
      setProfile(profileRes.data);

      if (profileRes.data?.id) {
        const eventsRes = await eventService.getAssignedEvents(profileRes.data.id);
        const list = Array.isArray(eventsRes.data)
          ? eventsRes.data
          : Array.isArray(eventsRes.data?.content)
          ? eventsRes.data.content
          : [];
        setEvents(list);
      }
    } catch (err) {
      console.error('Failed to load speaker events', err);
      setErrorMsg('Failed to load your assigned sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Speaking Engagements
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Workshops, symposiums, and masterclasses where you are invited as an honored guest speaker.
          </p>
        </div>
        <Button variant="outline" size="sm" icon="refresh" onClick={loadData}>
          Refresh
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-500/20" />
          <p className="text-xs text-slate-400 font-medium">Loading your scheduled speaking sessions...</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16 rounded-3xl border-dashed">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[36px]">event_available</span>
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Scheduled Engagements</h3>
              <p className="text-xs text-slate-500">
                You do not have any upcoming speaking sessions assigned currently. Newly scheduled events will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const date = new Date(event.startDateTime || Date.now());
            const venueName = event.venueName || event.sessions?.[0]?.venueName || 'Campus Venue';

            return (
              <Card
                key={event.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col bg-white dark:bg-slate-900"
              >
                {/* 16:9 Cover Header */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {event.coverImage ? (
                    <img
                      src={storageService.getFileUrl(event.coverImage)}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                      <span className="material-symbols-outlined text-purple-400/40 text-5xl">record_voice_over</span>
                    </div>
                  )}

                  {/* Floating Date Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-2 text-center shadow-md border border-white/20 min-w-[50px]">
                    <span className="block text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="block text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Top-Right Badges */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-md backdrop-blur-md bg-slate-900/80 text-white border border-white/10">
                      {event.eventType || 'Keynote'}
                    </span>
                    <Badge variant={event.status === 'ONGOING' ? 'success' : event.status === 'COMPLETED' ? 'neutral' : 'info'} className="text-[10px]">
                      {event.status || 'SCHEDULED'}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex flex-col flex-1 gap-3">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {event.description || 'Institutional speaking engagement organized in partnership with industry faculty.'}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">schedule</span>
                      <span className="font-medium">
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {event.endDateTime && ` – ${new Date(event.endDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">location_on</span>
                      <span className="font-medium truncate">{venueName}</span>
                    </div>

                    {event.targetFaculties && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">school</span>
                        <span className="truncate text-[11px] text-slate-500">{event.targetFaculties.replace(/,/g, ' • ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Sessions & Lectures preview */}
                  {event.sessions && event.sessions.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Session</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {event.sessions[0].title}
                      </p>
                    </div>
                  )}

                  {/* Footer CTAs */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-auto">
                    <Link to={`/events/${event.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs" icon="visibility">
                        Public Page
                      </Button>
                    </Link>
                    <Link to="/guest-speaker/materials" className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs bg-purple-600 hover:bg-purple-700" icon="upload_file">
                        Upload Slides
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
