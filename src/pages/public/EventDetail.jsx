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

  if (loading) return <div className="max-w-7xl mx-auto px-container-padding py-20 flex justify-center"><div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" /></div>;
  if (!event) return <div className="max-w-7xl mx-auto px-container-padding py-20 text-center"><p className="font-headline-md text-headline-md text-slate-600">Event not found</p></div>;

  const date = new Date(event.startDateTime || Date.now());

  return (
    <div className="max-w-7xl mx-auto px-container-padding py-10">
      <Link to="/events" className="inline-flex items-center gap-1 font-body-medium text-body-medium text-secondary hover:underline mb-6">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {event.status && <span className="badge-success">{event.status}</span>}
              {event.eventType && <span className="badge-info">{event.eventType}</span>}
              {event.certificateEligible && <span className="badge-placed">CERTIFICATE ELIGIBLE</span>}
            </div>
            <h1 className="font-display-hero text-display-hero text-slate-900 text-[28px]">{event.title}</h1>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span className="font-body-medium text-body-medium">{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span className="font-body-medium text-body-medium">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="font-headline-md text-headline-md text-slate-900 mb-3">About This Event</h2>
            <p className="font-body-base text-body-base text-slate-600 leading-relaxed whitespace-pre-wrap">
              {event.description || 'No description available.'}
            </p>
          </div>

          {/* Agendas */}
          {event.agendas?.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="font-headline-md text-headline-md text-slate-900 mb-4">Session Agenda</h2>
              <div className="space-y-4">
                {event.agendas.map((agenda, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-16 shrink-0">
                      <p className="font-body-medium text-body-medium text-primary text-[13px]">
                        {agenda.startTime || `${i + 1}:00`}
                      </p>
                    </div>
                    <div className="flex-1 pb-4 border-b border-outline-variant/20 last:border-0">
                      <p className="font-body-medium text-body-medium text-slate-900">{agenda.title || agenda.topic}</p>
                      {agenda.presenter && <p className="font-caption text-caption text-slate-600 mt-0.5">{agenda.presenter}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest Speaker */}
          {event.guestSpeaker && (
            <div className="glass-card p-6">
              <h2 className="font-headline-md text-headline-md text-slate-900 mb-4">Guest Speaker</h2>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-white font-bold">{event.guestSpeaker.name?.charAt(0) || 'G'}</span>
                </div>
                <div>
                  <p className="font-headline-md text-headline-md text-slate-900 text-[15px]">{event.guestSpeaker.name}</p>
                  {event.guestSpeaker.designation && <p className="font-body-base text-body-base text-slate-600">{event.guestSpeaker.designation}</p>}
                  {event.guestSpeaker.company && <p className="font-caption text-caption text-secondary">{event.guestSpeaker.company}</p>}
                  {event.guestSpeaker.bio && <p className="font-body-base text-body-base text-slate-600 mt-2 text-[13px]">{event.guestSpeaker.bio}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Venue Card */}
          <div className="glass-card p-6">
            <h3 className="font-headline-md text-headline-md text-slate-900 mb-4">Venue Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="font-body-base text-body-base">{event.venueName || 'TBD'}</span>
              </div>
              {event.venueType && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="material-symbols-outlined text-[18px]">{event.venueType === 'ONLINE' ? 'videocam' : 'meeting_room'}</span>
                  <span className="font-body-base text-body-base">{event.venueType}</span>
                </div>
              )}
              {event.capacity && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span className="font-body-base text-body-base">Capacity: {event.capacity}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card p-6">
            <Link to="/login" className="btn-primary w-full h-11 justify-center">
              Register for Event
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            </Link>
            <p className="font-caption text-caption text-slate-400 mt-3 text-center">
              You need to sign in to register for this event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
