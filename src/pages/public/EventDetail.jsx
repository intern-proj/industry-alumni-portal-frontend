import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { participationService } from '../../services/participationService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    eventService.getEventById(id)
      .then((res) => setEvent(res.data))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));

    if (user?.id) {
      participationService.getRegistrations({ eventId: id, userId: user.id })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.content) ? res.data.content : [];
          const found = list.find((r) => String(r.eventId) === String(id)) || (list.length > 0 ? list[0] : null);
          setRegistration(found);
        })
        .catch(() => setRegistration(null));
    }
  }, [id, user?.id]);

  const handleRegister = async () => {
    if (!user?.id) return;
    setRegistering(true);
    try {
      const res = await participationService.registerForEvent({
        eventId: String(id),
        studentId: String(user.id),
        eventTitle: event?.title || 'Event Session',
        venueName: event?.venueName || event?.sessions?.[0]?.venueName || 'Online / TBA',
      });
      setRegistration(res.data);
      if (window.toast) window.toast.success('Successfully registered for this event!');
    } catch {
      if (window.toast) window.toast.error('Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center pt-32">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center pt-32">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-inner">
          <span className="material-symbols-outlined text-[32px]">event_busy</span>
        </div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">Event Not Found</p>
        <p className="text-slate-500 mt-2">The event you are looking for does not exist or has been removed.</p>
        <Link to="/events" className="mt-6 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-md transition-all">Browse Events</Link>
      </div>
    );
  }

  const startDate = new Date(event.startDateTime || Date.now());
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
  const isMultiDay = endDate && startDate.toDateString() !== endDate.toDateString();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Premium Hero Banner */}
      <div className="relative w-full min-h-[440px] md:min-h-[480px] overflow-hidden bg-slate-950 flex flex-col justify-end">
        {event.coverImage ? (
          <img
            src={storageService.getFileUrl(event.coverImage)}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 blur-[2px] transition-transform duration-700"
          />
        ) : (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-50 z-0" />
            <div className="absolute bottom-0 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl opacity-50 z-0" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 z-10" />

        <div className="relative z-20 flex flex-col justify-end max-w-7xl mx-auto w-full px-6 lg:px-8 pb-12">
          <Link to="/events" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-semibold mb-6 w-fit bg-black/40 px-3.5 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Events
          </Link>
          
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              {event.eventType || 'Workshop'}
            </span>
            {event.status && (
              <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-slate-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {event.status}
              </span>
            )}
            {event.requiredAttendanceRate && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                {event.requiredAttendanceRate}% Min. Attendance
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-xl max-w-4xl leading-[1.1]">
            {event.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 mt-6 text-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">calendar_month</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Date</p>
                <p className="font-semibold text-sm sm:text-base text-white">{startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">schedule</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Time</p>
                <p className="font-semibold text-sm sm:text-base text-white">
                  {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} 
                  {endDate && !isMultiDay ? ` - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-rose-400">location_on</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Venue</p>
                <p className="font-semibold text-sm sm:text-base text-white truncate max-w-xs">
                  {event.venueName || event.sessions?.[0]?.venueName || 'To Be Announced'}
                </p>
              </div>
            </div>

            {(event.targetFaculties && event.targetFaculties.length > 0) && (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-amber-400">school</span>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Target Faculty</p>
                  <p className="font-semibold text-sm sm:text-base text-white">{event.targetFaculties.replace(/,/g, ' • ')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Featured Cover Image Card */}
          {event.coverImage && (
            <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900 group">
              <img
                src={storageService.getFileUrl(event.coverImage)}
                alt={event.title}
                className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          )}

          {/* About Section */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">info</span>
              About This Event
            </h2>
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {event.description || 'No detailed description provided for this event.'}
            </div>
          </section>

          {/* Sessions & Agenda Section */}
          {(event.sessions && event.sessions.length > 0) ? (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">format_list_bulleted</span>
                  Event Schedule & Sessions
                </h2>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                  {event.sessions.length} {event.sessions.length === 1 ? 'Session' : 'Sessions'}
                </span>
              </div>
              
              <div className="space-y-8">
                {event.sessions.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0)).map((session, sIdx) => {
                  const sDate = session.startTime ? new Date(session.startTime) : null;
                  const sTime = session.startTime ? new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                  const eTime = session.endTime ? new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  return (
                    <div key={session.id || sIdx} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-5">
                      
                      {/* Session Top Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                            {sIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {session.title || `Session ${sIdx + 1}`}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {sDate && (
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[15px] text-emerald-500">calendar_today</span>
                                  {sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {(sTime || eTime) && (
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[15px] text-sky-500">schedule</span>
                                  {sTime} {eTime ? `- ${eTime}` : ''}
                                </span>
                              )}
                              {session.venueName && (
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[15px] text-rose-500">location_on</span>
                                  {session.venueName}
                                </span>
                              )}
                              {session.capacity && (
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[15px] text-purple-500">group</span>
                                  {session.capacity} Expected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Session Description */}
                      {session.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
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
                      {(session.lectures && session.lectures.length > 0) && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-emerald-500">school</span>
                            Lectures & Keynote Speakers
                          </h4>
                          
                          <div className="space-y-3">
                            {session.lectures.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0)).map((lecture, lIdx) => {
                              const lStart = lecture.startTime ? new Date(lecture.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                              const lEnd = lecture.endTime ? new Date(lecture.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                              return (
                                <div key={lecture.id || lIdx} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                                        {lIdx + 1}
                                      </span>
                                      <h5 className="font-bold text-slate-900 dark:text-white text-sm">
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
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
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
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center">
               <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
                 <span className="material-symbols-outlined text-[28px]">pending_actions</span>
               </div>
               <h3 className="font-bold text-slate-800 dark:text-slate-200">Agenda In Preparation</h3>
               <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">Detailed sessions and guest speakers for this event will be finalized shortly.</p>
            </section>
          )}

        </div>

        {/* Right Column (Sidebar CTA) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Registration Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-200 dark:border-slate-800 sticky top-24">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Join the Event</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Reserve your spot to gain valuable industry insights and network with professionals.
            </p>
            
            {user?.role === 'STUDENT' ? (
              registration ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    You Are Registered
                  </div>
                  <Link
                    to={`/student/events/${id}`}
                    className="flex items-center justify-center w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs shadow-md shadow-emerald-600/20"
                  >
                    Open in Student Portal
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon="how_to_reg"
                  className="w-full justify-center py-3.5 text-sm shadow-md shadow-emerald-500/25"
                  loading={registering}
                  onClick={handleRegister}
                >
                  {registering ? 'Registering...' : 'Register for Event'}
                </Button>
              )
            ) : !user ? (
              <Link to={`/login?redirect=/events/${id}`} className="flex items-center justify-center w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-500/25">
                Sign In to Register
                <span className="material-symbols-outlined text-[20px]">login</span>
              </Link>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs text-center font-medium">
                Logged in as <span className="font-bold">{user.role || 'Staff'}</span>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400"><span className="material-symbols-outlined text-[18px]">location_on</span></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Location</p>
                  <p className="text-sm text-slate-500">{event.venueName || event.sessions?.[0]?.venueName || 'To Be Determined'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400"><span className="material-symbols-outlined text-[18px]">groups</span></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Format & Type</p>
                  <p className="text-sm text-slate-500">{event.eventType || 'Interactive Session'}</p>
                </div>
              </div>
              {event.requiredAttendanceRate && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400"><span className="material-symbols-outlined text-[18px]">fact_check</span></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Attendance Policy</p>
                    <p className="text-sm text-slate-500">{event.requiredAttendanceRate}% minimum attendance required</p>
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
