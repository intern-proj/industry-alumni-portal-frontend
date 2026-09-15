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

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick View Modal state
  const [quickViewEvent, setQuickViewEvent] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);

  useEffect(() => {
    loadRegistrations();
  }, [user?.id]);

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

  const handleOpenQuickView = async (reg) => {
    const eventId = reg.eventId || reg.id;
    setQuickViewLoading(true);
    setQuickViewEvent({ id: eventId, title: reg.eventTitle || reg.title || 'Event Details' });

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Registered Events</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Workshops, industrial symposia, and guest lectures you have enrolled in.
          </p>
        </div>

        <Link to="/events">
          <Button variant="primary" size="sm" icon="explore" className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
            Explore Upcoming Events
          </Button>
        </Link>
      </div>

      {/* ── MY REGISTERED SESSIONS CARD ── */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div>
              <CardTitle className="text-base font-bold">My Registered Sessions</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Sessions you have successfully enrolled in ({registrations.length})</p>
            </div>
          </div>
          <Link to="/events">
            <Button
              variant="outline"
              size="sm"
              icon="open_in_new"
              className="text-xs"
            >
              Browse All Events
            </Button>
          </Link>
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
                  You haven't registered for any workshops or guest symposia yet. Explore available campus sessions to build your network.
                </p>
              </div>
              <Link to="/events">
                <Button variant="primary" size="sm" icon="explore" className="bg-emerald-600 hover:bg-emerald-700">
                  Explore Upcoming Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {registrations.map((reg) => {
                const eventDate = reg.event?.startDateTime || reg.eventStartDateTime || reg.startDateTime;
                const regId = reg.registrationId || reg.id;
                const hasFeedback = participationService.hasSubmittedFeedback(reg.eventId, regId, reg.eventTitle);

                return (
                  <div
                    key={regId}
                    className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {reg.eventId ? (
                            <Link to={`/student/events/${reg.eventId}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">
                              {reg.eventTitle || `Event #${reg.eventId}`}
                            </Link>
                          ) : (
                            reg.eventTitle || `Event #${reg.eventId}`
                          )}
                        </h4>
                        <Badge variant="success" className="text-[10px] uppercase font-bold py-0.5">
                          {reg.status || 'CONFIRMED'}
                        </Badge>
                        {reg.attendanceRecorded && (
                          <Badge variant="info" className="text-[10px] uppercase font-bold py-0.5">
                            Attended
                          </Badge>
                        )}
                        {hasFeedback ? (
                          <Badge variant="success" className="text-[10px] uppercase font-bold py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Feedback Submitted ✓
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] uppercase font-bold py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Feedback Pending
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-500">calendar_today</span> 
                          {eventDate ? `Event: ${new Date(eventDate).toLocaleDateString()}` : 'Event date scheduled'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-rose-500">pin_drop</span>
                          {reg.venueName || 'Online / Campus Venue'}
                        </span>
                        {reg.registeredAt && (
                          <span>Registered: {new Date(reg.registeredAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
                      {hasFeedback ? (
                        <Link to="/student/certificates">
                          <Button
                            variant="outline"
                            size="sm"
                            icon="workspace_premium"
                            className="text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          >
                            Certificate Unlocked
                          </Button>
                        </Link>
                      ) : (
                        <Link 
                          to={`/student/events/${reg.eventId}/feedback`}
                          state={{ registrationId: regId, eventTitle: reg.eventTitle }}
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            icon="rate_review"
                            className="text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                            title="Provide feedback to claim certificate"
                          >
                            Give Feedback
                          </Button>
                        </Link>
                      )}

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
                        <Button
                          variant="primary"
                          size="sm"
                          icon="arrow_forward"
                          className="text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                  {quickViewEvent.venueName || quickViewEvent.sessions?.[0]?.venueName || 'To Be Announced'}
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

              <Button variant="outline" size="sm" onClick={() => setQuickViewEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

    </div>
  );
}
