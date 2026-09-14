import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { participationService } from '../../services/participationService';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export default function MyEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('registered'); // 'registered' | 'explore'
  const [registrations, setRegistrations] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [registeringEventId, setRegisteringEventId] = useState(null);

  // Quick View Modal state
  const [quickViewEvent, setQuickViewEvent] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);

  useEffect(() => {
    loadRegistrations();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'explore' && allEvents.length === 0) {
      loadAllEvents();
    }
  }, [activeTab]);

  const loadRegistrations = async () => {
    if (!user?.id) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await participationService.getRegistrations({ userId: user.id });
      const raw = res.data?.content || res.data?.data || res.data || [];
      const list = Array.isArray(raw) ? raw : [];
      setRegistrations(list);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await eventService.getEvents({ size: 50 });
      let list = [];
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.content)) list = raw.content;
      
      // Filter out draft events for students
      const visible = list.filter((e) => e.status !== 'DRAFT');
      setAllEvents(visible);
    } catch {
      setAllEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const isEventRegistered = (eventId) => {
    return registrations.some((r) => String(r.eventId) === String(eventId));
  };

  const handleRegister = async (event) => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    setRegisteringEventId(event.id);
    try {
      const payload = {
        eventId: String(event.id),
        studentId: String(user.id),
        eventTitle: event.title,
        venueName: event.venueName || 'Campus Main Hall',
      };

      const res = await participationService.registerForEvent(payload);
      const newReg = res.data;
      setRegistrations((prev) => [newReg, ...prev.filter((r) => String(r.eventId) !== String(event.id))]);
      
      if (window.toast) {
        window.toast.success(`Successfully registered for "${event.title}"!`);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      if (window.toast) {
        window.toast.error('Failed to register for this event. Please try again.');
      }
    } finally {
      setRegisteringEventId(null);
    }
  };

  const handleOpenQuickView = async (eventOrReg) => {
    const eventId = eventOrReg.eventId || eventOrReg.id;
    setQuickViewLoading(true);
    setQuickViewEvent({ id: eventId, title: eventOrReg.title || eventOrReg.eventTitle || 'Event Details' });

    try {
      const res = await eventService.getEventById(eventId);
      setQuickViewEvent(res.data);
    } catch {
      // Keep basic fallback
    } finally {
      setQuickViewLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Events Portal</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse upcoming university workshops, guest symposiums, and manage your registrations.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('registered')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'registered'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            My Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'explore'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">explore</span>
            Explore Upcoming Events
          </button>
        </div>
      </div>

      {/* ── TAB 1: MY REGISTERED SESSIONS ── */}
      {activeTab === 'registered' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <CardTitle className="text-base font-bold">My Registered Sessions</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Sessions you have successfully enrolled in</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon="explore"
              onClick={() => setActiveTab('explore')}
              className="text-xs"
            >
              Browse All Events
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Loading your registered sessions...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">event_busy</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Registrations Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven't registered for any workshops or guest symposia. Explore available events to build your career network.
                  </p>
                </div>
                <Button variant="primary" size="sm" icon="explore" onClick={() => setActiveTab('explore')} className="bg-emerald-600 hover:bg-emerald-700">
                  Explore Upcoming Events
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {registrations.map((reg) => (
                  <div
                    key={reg.registrationId || reg.id}
                    className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {reg.eventTitle || `Event #${reg.eventId}`}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                          reg.status === 'ATTENDED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                        }`}>
                          {reg.status || 'CONFIRMED'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-500">event_available</span>
                          Registered on {new Date(reg.registeredAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-rose-500">pin_drop</span>
                          {reg.venueName || 'Campus Main Hall'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        icon="visibility"
                        onClick={() => handleOpenQuickView(reg)}
                        className="text-xs"
                      >
                        Quick View
                      </Button>
                      <Link to={`/student/events/${reg.eventId}`}>
                        <Button variant="primary" size="sm" icon="arrow_forward" className="text-xs bg-emerald-600 hover:bg-emerald-700">
                          Full Agenda & Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: EXPLORE UPCOMING EVENTS ── */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {eventsLoading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
              <p className="text-xs text-slate-400 font-medium">Loading upcoming sessions & masterclasses...</p>
            </div>
          ) : allEvents.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[36px]">event_busy</span>
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Scheduled Sessions Available</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Check back soon for newly announced workshops, hackathons, and industrial symposiums.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((evt) => {
                const date = new Date(evt.startDateTime || Date.now());
                const registered = isEventRegistered(evt.id);
                const isRegistering = registeringEventId === evt.id;
                const isLive = evt.status === 'ONGOING';

                return (
                  <Card
                    key={evt.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col bg-white dark:bg-slate-900"
                  >
                    {/* 16:9 Cover Image / Dynamic Fallback Header */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {evt.coverImage ? (
                        <img
                          src={storageService.getFileUrl(evt.coverImage)}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                          <span className="material-symbols-outlined text-slate-500 text-5xl opacity-40">
                            {evt.eventType?.toLowerCase().includes('hack') ? 'terminal' :
                             evt.eventType?.toLowerCase().includes('speaker') || evt.eventType?.toLowerCase().includes('lecture') ? 'record_voice_over' :
                             evt.eventType?.toLowerCase().includes('career') ? 'work' : 'school'}
                          </span>
                        </div>
                      )}

                      {/* Floating Date Badge (Glassmorphic) */}
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-2 text-center shadow-md border border-white/20 min-w-[50px]">
                        <span className="block text-[10px] font-black uppercase text-rose-500 tracking-wider">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="block text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Top-Right Badges */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-md backdrop-blur-md bg-slate-900/80 text-white border border-white/10">
                          {evt.eventType || 'Workshop'}
                        </span>
                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase shadow-md animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Live Now
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-5 flex flex-col flex-1 gap-3">
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {evt.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {evt.description || 'Gain career mentorship and hands-on exposure in this curated session.'}
                        </p>
                      </div>

                      {/* Key Metadata */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">schedule</span>
                          <span className="font-medium">
                            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {evt.endDateTime && ` – ${new Date(evt.endDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">location_on</span>
                          <span className="font-medium truncate">{evt.venueName || 'Campus Main Auditorium'}</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-auto">
                        <Button
                          variant="outline"
                          size="xs"
                          className="flex-1 text-xs"
                          icon="visibility"
                          onClick={() => handleOpenQuickView(evt)}
                        >
                          Quick View
                        </Button>

                        <Link to={`/student/events/${evt.id}`} className="flex-1">
                          <Button variant="secondary" size="xs" className="w-full text-xs" icon="info">
                            Full Details
                          </Button>
                        </Link>

                        {!registered ? (
                          <Button
                            variant="primary"
                            size="xs"
                            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 font-semibold"
                            icon="how_to_reg"
                            loading={isRegistering}
                            onClick={() => handleRegister(evt)}
                          >
                            Register
                          </Button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center flex-1">
                            Joined
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── QUICK VIEW MODAL ── */}
      <Modal
        isOpen={!!quickViewEvent}
        onClose={() => setQuickViewEvent(null)}
        title={quickViewEvent?.title || 'Session Quick Preview'}
        maxWidth="max-w-2xl"
      >
        {quickViewLoading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading session schedule & speakers...</p>
          </div>
        ) : quickViewEvent ? (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Metadata Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">calendar_today</span>
                  {new Date(quickViewEvent.startDateTime || Date.now()).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-sky-500">schedule</span>
                  {new Date(quickViewEvent.startDateTime || Date.now()).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-rose-500">location_on</span>
                  {quickViewEvent.venueName || 'Campus Main Hall'}
                </span>
              </div>
              {quickViewEvent.description && (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  {quickViewEvent.description}
                </p>
              )}
            </div>

            {/* Sessions & Guest Lectures Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-500 text-[18px]">format_list_bulleted</span>
                Schedule & Guest Lectures
              </h4>

              {quickViewEvent.sessions && quickViewEvent.sessions.length > 0 ? (
                <div className="space-y-4">
                  {quickViewEvent.sessions
                    .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
                    .map((session, sIdx) => (
                      <div
                        key={session.id || sIdx}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                            Session {sIdx + 1}: {session.title}
                          </h5>
                          {session.startTime && (
                            <span className="text-[10px] text-slate-500">
                              {new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {session.lectures && session.lectures.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            {session.lectures.map((lecture, lIdx) => (
                              <div
                                key={lecture.id || lIdx}
                                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 space-y-1 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                    {lecture.title}
                                  </p>
                                  {lecture.speakerName && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                      {lecture.speakerName}
                                    </span>
                                  )}
                                </div>
                                {lecture.description && (
                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {lecture.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Lectures being finalized.</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Sessions and agenda items are currently in preparation.</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                to={`/student/events/${quickViewEvent.id}`}
                onClick={() => setQuickViewEvent(null)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Open Full Screen Page →
              </Link>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickViewEvent(null)}>
                  Close
                </Button>
                {!isEventRegistered(quickViewEvent.id) ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="how_to_reg"
                    loading={registeringEventId === quickViewEvent.id}
                    onClick={() => handleRegister(quickViewEvent)}
                  >
                    Register Now
                  </Button>
                ) : (
                  <Badge variant="success" className="py-1 px-3">
                    Already Registered
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

    </div>
  );
}
