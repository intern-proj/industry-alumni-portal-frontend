import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { participationService } from '../../services/participationService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function StudentEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadEventAndRegistration();
  }, [id, user?.id]);

  const loadEventAndRegistration = async () => {
    setLoading(true);
    try {
      const [eventRes, regRes] = await Promise.all([
        eventService.getEventById(id),
        user?.id
          ? participationService.getRegistrations({ eventId: id, userId: user.id }).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      setEvent(eventRes.data);

      const regList = Array.isArray(regRes.data)
        ? regRes.data
        : Array.isArray(regRes.data?.content)
        ? regRes.data.content
        : [];
      
      const foundReg = regList.find(
        (r) => String(r.eventId) === String(id) && String(r.studentId) === String(user?.id)
      ) || (regList.length > 0 ? regList[0] : null);

      setRegistration(foundReg);
    } catch (err) {
      console.error('Failed to load event details:', err);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      const payload = {
        eventId: String(id),
        studentId: String(user.id),
        eventTitle: event?.title || 'Industry Session',
        venueName: event?.venueName || 'Campus Main Hall',
      };

      const res = await participationService.registerForEvent(payload);
      setRegistration(res.data);
      if (window.toast) {
        window.toast.success('Successfully registered for this event!');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      if (window.toast) {
        window.toast.error('Failed to register for this event. Please try again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
        <p className="text-xs text-slate-400">Loading session schedule & details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[32px]">event_busy</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Event Not Found</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          The event you are looking for does not exist or may have concluded.
        </p>
        <Link to="/student/events">
          <Button variant="primary" icon="arrow_back">Back to My Events</Button>
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startDateTime || Date.now());
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
  const isMultiDay = endDate && startDate.toDateString() !== endDate.toDateString();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb / Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events
        </Link>

        {registration && (
          <Badge variant="success" className="px-3 py-1 flex items-center gap-1 text-xs">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Registered Session
          </Badge>
        )}
      </div>

      {/* Hero Banner Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              {event.eventType || 'Industry Workshop'}
            </span>
            {event.status && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {event.status}
              </span>
            )}
            {event.certificateEligible && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                Certificate Eligible
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-slate-300 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Date</p>
                <p className="font-semibold text-white">
                  {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sky-400">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Time</p>
                <p className="font-semibold text-white">
                  {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {endDate && !isMultiDay ? ` - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-rose-400">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Venue</p>
                <p className="font-semibold text-white">{event.venueName || 'Campus Main Hall'}</p>
              </div>
            </div>

            {event.targetFaculties && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Target Audience</p>
                  <p className="font-semibold text-white">{event.targetFaculties}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Event Details & Schedule */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* About This Event */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">info</span>
              About This Event
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {event.description || 'No detailed overview provided for this event.'}
            </div>
          </section>

          {/* Agenda & Sessions Schedule */}
          {event.sessions && event.sessions.length > 0 ? (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">format_list_bulleted</span>
                  Event Schedule & Sessions
                </h2>
                <Badge variant="neutral" className="text-xs">
                  {event.sessions.length} {event.sessions.length === 1 ? 'Session' : 'Sessions'}
                </Badge>
              </div>

              <div className="space-y-8">
                {event.sessions
                  .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
                  .map((session, sIdx) => {
                    const sTime = session.startTime
                      ? new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const eTime = session.endTime
                      ? new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div key={session.id || sIdx} className="space-y-4">
                        {/* Session Header Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                              {sIdx + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-900 dark:text-white">{session.title}</h3>
                              {session.venueName && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                                  {session.venueName}
                                </p>
                              )}
                            </div>
                          </div>
                          {(sTime || eTime) && (
                            <span className="self-start sm:self-auto px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                              {sTime} {eTime ? `- ${eTime}` : ''}
                            </span>
                          )}
                        </div>

                        {/* Lectures Timeline within Session */}
                        {session.lectures && session.lectures.length > 0 ? (
                          <div className="ml-5 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800/40 space-y-4">
                            {session.lectures
                              .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
                              .map((lecture, lIdx) => {
                                const lTime = lecture.startTime
                                  ? new Date(lecture.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                  : '';
                                return (
                                  <div key={lecture.id || lIdx} className="relative">
                                    {/* Timeline Bullet Node */}
                                    <div className="absolute -left-[31px] top-3 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-sm" />

                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                          {lecture.title}
                                        </h4>
                                        {lTime && (
                                          <span className="shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                                            {lTime}
                                          </span>
                                        )}
                                      </div>

                                      {lecture.description && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                          {lecture.description}
                                        </p>
                                      )}

                                      {/* Guest Speaker Profile Card */}
                                      {lecture.speakerName && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                            {lecture.speakerName.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                              {lecture.speakerName}
                                            </p>
                                            <p className="text-[10px] text-slate-500">Guest Lecturer / Speaker</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="ml-5 pl-4 text-xs text-slate-400 italic">
                            Detailed topics and speakers for this session will be announced shortly.
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          ) : (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">pending_actions</span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Agenda In Preparation</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The session schedule and guest speakers for this symposium are being finalized by coordinators.
              </p>
            </section>
          )}

        </div>

        {/* Right Column: Registration CTA & Details Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 sticky top-24 space-y-6">
            
            {/* Registration Status Banner */}
            {registration ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  You Are Registered
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  Your registration is confirmed. Keep your student account handy to scan the session QR code and record your attendance on event day.
                </p>
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400">
                  <span>Registered Date:</span>
                  <span className="font-semibold">
                    {new Date(registration.registeredAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Join This Session</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Register now to secure your seat and receive certification eligibility upon attendance.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  icon="how_to_reg"
                  className="w-full justify-center py-3 text-sm shadow-md shadow-emerald-500/20"
                  loading={registering}
                  onClick={handleRegister}
                >
                  {registering ? 'Registering...' : 'Register for this Event'}
                </Button>
              </div>
            )}

            {/* Event Quick Specs */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Session Location</p>
                  <p className="text-slate-500 mt-0.5">{event.venueName || 'Campus Main Hall'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Delivery Format</p>
                  <p className="text-slate-500 mt-0.5">
                    {event.eventType === 'WORKSHOP' ? 'Interactive Hands-on Workshop' : 'Industry Guest Lecture'}
                  </p>
                </div>
              </div>

              {event.coordinatorName && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Event Coordinator</p>
                    <p className="text-slate-500 mt-0.5">{event.coordinatorName}</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
