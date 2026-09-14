import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { participationService } from '../../services/participationService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
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
  const [activePhotoIdx, setActivePhotoIdx] = useState(null);

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
        venueName: event?.venueName || event?.sessions?.[0]?.venueName || 'Online / TBA',
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
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          The event you are trying to access does not exist or may have been cancelled.
        </p>
        <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Explore Upcoming Events
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startDateTime || Date.now());
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
  const isMultiDay = endDate && startDate.toDateString() !== endDate.toDateString();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/events"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          My Registered Events
        </Link>

        {registration && (
          <Badge variant="success" className="px-3 py-1 flex items-center gap-1 text-xs">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Registered Session
          </Badge>
        )}
      </div>

      {/* Featured Cover Image Banner */}
      {event.coverImage && (
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900 group">
          <img
            src={storageService.getFileUrl(event.coverImage)}
            alt={event.title}
            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
          />
        </div>
      )}

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              {event.eventType || 'Industry Workshop'}
            </span>
            {event.status === 'COMPLETED' ? (
              <span className="px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-200 text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Event Completed
              </span>
            ) : event.status === 'CANCELLED' ? (
              <span className="px-3 py-1 rounded-full bg-rose-500/25 border border-rose-400/40 text-rose-200 text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">cancel</span>
                Cancelled
              </span>
            ) : event.status && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {event.status}
              </span>
            )}
            {event.requiredAttendanceRate && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                {event.requiredAttendanceRate}% Min. Attendance
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
                <p className="font-semibold text-white">{event.venueName || event.sessions?.[0]?.venueName || 'To Be Announced'}</p>
              </div>
            </div>

            {event.targetFaculties && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Target Audience</p>
                  <p className="font-semibold text-white">{event.targetFaculties.replace(/,/g, ' • ')}</p>
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
                    const sDate = session.startTime ? new Date(session.startTime) : null;
                    const sTime = session.startTime
                      ? new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const eTime = session.endTime
                      ? new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div key={session.id || sIdx} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                        {/* Session Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                              {sIdx + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                {session.title || `Session ${sIdx + 1}`}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {sDate && (
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-[14px] text-emerald-500">calendar_today</span>
                                    {sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {(sTime || eTime) && (
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-[14px] text-sky-500">schedule</span>
                                    {sTime} {eTime ? `- ${eTime}` : ''}
                                  </span>
                                )}
                                {session.venueName && (
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-[14px] text-rose-500">location_on</span>
                                    {session.venueName}
                                  </span>
                                )}
                                {session.capacity && (
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-[14px] text-purple-500">group</span>
                                    {session.capacity} Expected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Session Description */}
                        {session.description && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                            {session.description}
                          </p>
                        )}

                        {/* Session Poster Image Preview */}
                        {session.posterImage && (
                          <div className="w-full sm:max-w-md h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                            <img
                              src={storageService.getFileUrl(session.posterImage)}
                              alt={session.title || 'Session Poster'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Lectures Timeline within Session */}
                        {session.lectures && session.lectures.length > 0 ? (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-emerald-500">school</span>
                              Lectures & Keynote Speakers
                            </h4>

                            <div className="space-y-3">
                              {session.lectures
                                .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
                                .map((lecture, lIdx) => {
                                  const lStart = lecture.startTime
                                    ? new Date(lecture.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    : '';
                                  const lEnd = lecture.endTime
                                    ? new Date(lecture.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    : '';
                                  return (
                                    <div key={lecture.id || lIdx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                      <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                                            {lIdx + 1}
                                          </span>
                                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                                            {lecture.title}
                                          </h5>
                                        </div>

                                        {lecture.description && (
                                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                                            {lecture.description}
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 shrink-0 pl-7 sm:pl-0">
                                        {(lStart || lEnd) && (
                                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md">
                                            {lStart} {lEnd ? `- ${lEnd}` : ''}
                                          </span>
                                        )}
                                        {lecture.speakerName && (
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
                                              {lecture.speakerName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                              {lecture.speakerName}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic pl-1">
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

          {/* Completed Event Photo Gallery Showcase */}
          {event.galleryImages && event.galleryImages.length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500">photo_library</span>
                    Event Photo Gallery & Highlights
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Event photos and highlights uploaded by coordinators for this completed session.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800/80 w-fit">
                  {event.galleryImages.length} {event.galleryImages.length === 1 ? 'Photo' : 'Photos'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {event.galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <img
                      src={storageService.getFileUrl(imgUrl)}
                      alt={`Event Highlight ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <div className="flex items-center gap-1 text-white text-[11px] font-semibold">
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                        View Full
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Column: Registration CTA & Details Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 sticky top-24 space-y-6">
            
            {/* Registration Status Banner */}
            {event.status === 'COMPLETED' ? (
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 space-y-3">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  Event Concluded
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                  {registration 
                    ? 'This session has concluded. If you scanned the attendance QR code during the event, your attendance is recorded and certification eligibility is granted.'
                    : 'This session has concluded. Browse the photo gallery and session recap on this page.'}
                </p>
                {registration && (
                  <Link
                    to="/student/certificates"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline pt-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                    Check My Certificates & Attendance
                  </Link>
                )}
              </div>
            ) : event.status === 'CANCELLED' ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                  Event Cancelled
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                  This scheduled session was cancelled.
                </p>
              </div>
            ) : registration ? (
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
                  <p className="text-slate-500 mt-0.5">{event.venueName || event.sessions?.[0]?.venueName || 'To Be Announced'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Format & Category</h3>
                  <p className="text-xs text-slate-500">
                    {event.eventType || 'Event Session'}
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
      {/* Photo Lightbox Modal */}
      {activePhotoIdx !== null && event.galleryImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
          onClick={() => setActivePhotoIdx(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-xs sm:text-sm font-semibold text-slate-300">
                Photo {activePhotoIdx + 1} of {event.galleryImages.length}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoIdx(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="relative w-full flex items-center justify-center">
              <img
                src={storageService.getFileUrl(event.galleryImages[activePhotoIdx])}
                alt={`Photo ${activePhotoIdx + 1}`}
                className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />

              {event.galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : event.galleryImages.length - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-sm border border-white/10"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx((prev) => (prev < event.galleryImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-sm border border-white/10"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
