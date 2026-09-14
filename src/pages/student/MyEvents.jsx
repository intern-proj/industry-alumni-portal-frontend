import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { participationService } from '../../services/participationService';
import { eventService } from '../../services/eventService';
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
      setAllEvents(list);
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Registered Sessions ({registrations.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              icon="explore"
              onClick={() => setActiveTab('explore')}
            >
              Browse More Events
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading your registered sessions...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600">event_busy</span>
                <p className="text-sm">You haven't registered for any events yet.</p>
                <Button variant="primary" size="sm" icon="explore" onClick={() => setActiveTab('explore')}>
                  Explore Upcoming Events
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {registrations.map((reg) => (
                  <div
                    key={reg.registrationId || reg.id}
                    className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {reg.eventTitle || `Event #${reg.eventId}`}
                        </h4>
                        <Badge variant={reg.status === 'ATTENDED' ? 'success' : 'info'} className="text-[10px]">
                          {reg.status || 'REGISTERED'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-500">calendar_today</span>
                          Registered on {new Date(reg.registeredAt || Date.now()).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-sky-500">pin_drop</span>
                          {reg.venueName || 'Campus Main Hall'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        icon="visibility"
                        onClick={() => handleOpenQuickView(reg)}
                      >
                        Quick View
                      </Button>
                      <Link to={`/student/events/${reg.eventId}`}>
                        <Button variant="primary" size="sm" icon="arrow_forward">
                          Full Details & Agenda
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
        <div className="space-y-4">
          {eventsLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading upcoming sessions...</p>
            </div>
          ) : allEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600">event_busy</span>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">No Upcoming Events</h3>
              <p className="text-xs text-slate-400">Check back soon for newly scheduled workshops and symposiums.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allEvents.map((evt) => {
                const date = new Date(evt.startDateTime || Date.now());
                const registered = isEventRegistered(evt.id);
                const isRegistering = registeringEventId === evt.id;

                return (
                  <Card
                    key={evt.id}
                    className="hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-5 flex flex-col h-full gap-4">
                      {/* Top Row: Date Box + Badges */}
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 text-center w-12 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{date.getDate()}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="info" className="text-[9px]">{evt.eventType || 'SESSION'}</Badge>
                            {registered && (
                              <Badge variant="success" className="text-[9px] flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">check</span>
                                Registered
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {evt.title}
                          </h3>
                        </div>
                      </div>

                      {/* Description & Specs */}
                      <div className="flex-1 space-y-2 text-xs">
                        <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {evt.description || 'No detailed description available.'}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                            <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {evt.venueName && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                              <span className="truncate">{evt.venueName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
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
                            Full Page
                          </Button>
                        </Link>

                        {!registered ? (
                          <Button
                            variant="primary"
                            size="xs"
                            className="flex-1 text-xs"
                            icon="how_to_reg"
                            loading={isRegistering}
                            onClick={() => handleRegister(evt)}
                          >
                            Register
                          </Button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center flex-1">
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
