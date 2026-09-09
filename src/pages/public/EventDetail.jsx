import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getEventById(id)
      .then((res) => setEvent(res.data))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

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
      <div className="relative w-full h-[45vh] min-h-[400px] overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-10 pointer-events-none" />
        
        {/* Abstract Background Elements if no cover image */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl opacity-50 z-0" />
        <div className="absolute bottom-0 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl opacity-50 z-0" />

        <div className="absolute inset-0 z-20 flex flex-col justify-end max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          <Link to="/events" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-semibold mb-6 w-fit bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Events
          </Link>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              {event.eventType || 'Workshop'}
            </span>
            {event.status && (
              <span className="px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {event.status}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-xl max-w-4xl leading-[1.1]">
            {event.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 mt-6 text-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">calendar_month</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Date</p>
                <p className="font-semibold">{startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">schedule</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Time</p>
                <p className="font-semibold">
                  {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} 
                  {endDate && !isMultiDay ? ` - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
            </div>

            {(event.targetFaculties && event.targetFaculties.length > 0) && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-emerald-400">school</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Target Group</p>
                  <p className="font-semibold">{event.targetFaculties.split(',')[0]} {event.targetFaculties.includes(',') ? ' & More' : ''}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* About Section */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">info</span>
              About This Event
            </h2>
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {event.description || 'No detailed description provided for this event.'}
            </div>
          </section>

          {/* Sessions & Agenda Section */}
          {(event.sessions && event.sessions.length > 0) ? (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">format_list_bulleted</span>
                Event Schedule & Sessions
              </h2>
              
              <div className="space-y-8">
                {event.sessions.sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((session, sIdx) => {
                  const sTime = session.startTime ? new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                  const eTime = session.endTime ? new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  return (
                    <div key={session.id || sIdx} className="relative">
                      {/* Session Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 text-center min-w-[120px]">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Session {sIdx + 1}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold">{sTime} {eTime ? `- ${eTime}` : ''}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{session.title}</h3>
                          {session.venueName && (
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              {session.venueName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lectures Timeline within Session */}
                      {(session.lectures && session.lectures.length > 0) && (
                        <div className="ml-[60px] pl-8 border-l-2 border-emerald-100 dark:border-emerald-900/30 space-y-6 pt-2">
                          {session.lectures.sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((lecture, lIdx) => {
                            const lTime = lecture.startTime ? new Date(lecture.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                            return (
                              <div key={lecture.id || lIdx} className="relative">
                                {/* Timeline Node */}
                                <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-400 z-10 shadow-sm shadow-emerald-500/20" />
                                
                                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start gap-4 mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-[15px]">{lecture.title}</h4>
                                    {lTime && <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">{lTime}</span>}
                                  </div>
                                  
                                  {lecture.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{lecture.description}</p>
                                  )}

                                  {lecture.speakerName && (
                                    <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                        {lecture.speakerName.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{lecture.speakerName}</p>
                                        <p className="text-xs text-slate-500 mt-1">Guest Speaker</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
               <h3 className="font-bold text-slate-800 dark:text-slate-200">Agenda Pending</h3>
               <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">Detailed sessions and guest speakers for this event have not been finalized yet.</p>
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
            
            <Link to="/login" className="flex items-center justify-center w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-500/25">
              Sign In to Register
              <span className="material-symbols-outlined text-[20px]">login</span>
            </Link>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400"><span className="material-symbols-outlined text-[18px]">location_on</span></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Location</p>
                  <p className="text-sm text-slate-500">{event.venueName || 'To Be Determined'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400"><span className="material-symbols-outlined text-[18px]">groups</span></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Format</p>
                  <p className="text-sm text-slate-500">{event.eventType === 'WORKSHOP' ? 'Interactive Workshop' : 'Guest Lecture'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
