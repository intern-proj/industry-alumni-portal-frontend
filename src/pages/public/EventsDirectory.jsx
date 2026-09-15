import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { participationService } from '../../services/participationService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const EVENT_CATEGORIES = ['ALL', 'WORKSHOP', 'HACKATHON', 'GUEST LECTURE', 'SEMINAR', 'INDUSTRY MEETUP', 'COMPLETED'];

export default function EventsDirectory() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [registeringId, setRegisteringId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    eventService.getEvents({ search: searchParams.get('q'), size: 50 })
      .then((res) => {
        let fetched = [];
        if (Array.isArray(res.data)) fetched = res.data;
        else if (Array.isArray(res.data?.data)) fetched = res.data.data;
        else if (Array.isArray(res.data?.content)) fetched = res.data.content;
        else if (Array.isArray(res.data?.data?.content)) fetched = res.data.data.content;
        // Never show DRAFT events to public directory
        fetched = fetched.filter((e) => e && e.status !== 'DRAFT');
        setEvents(fetched);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));

    if (user?.id) {
      participationService.getRegistrations({ userId: user.id })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.content) ? res.data.content : [];
          setRegisteredEventIds(new Set(list.map((r) => String(r.eventId))));
        })
        .catch(() => setRegisteredEventIds(new Set()));
    }
  }, [searchParams, user?.id]);

  const handleQuickRegister = async (event) => {
    if (!user?.id) return;
    setRegisteringId(event.id);
    try {
      await participationService.registerForEvent({
        eventId: String(event.id),
        studentId: String(user.id),
        eventTitle: event.title,
        venueName: event.venueName || event.sessions?.[0]?.venueName || 'Online / TBA',
      });
      setRegisteredEventIds((prev) => new Set([...prev, String(event.id)]));
      if (window.toast) window.toast.success(`Registered for "${event.title}"!`);
    } catch {
      if (window.toast) window.toast.error('Failed to register. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  };

  function handleSearch(query) {
    setSearch(query);
    setSearchParams(query ? { q: query } : {});
  }

  // Filter events by selected category
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchCat =
        selectedCategory === 'ALL'
          ? true
          : selectedCategory === 'COMPLETED'
          ? e.status === 'COMPLETED'
          : (e.eventType || '').toUpperCase() === selectedCategory;
      const matchSearch =
        !search ||
        (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.venueName || '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [events, selectedCategory, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Banner with Executive Glassmorphism & Key Highlights */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 overflow-hidden shadow-2xl border border-indigo-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-300 uppercase tracking-widest border border-white/10">
            <span className="material-symbols-outlined text-sm text-emerald-400">verified</span>
            Official Institutional Events & Symposia
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Industry Collaboration <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
              Workshops & Masterclasses
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Gain verified industry exposure through faculty-endorsed career symposiums, hackathons, and guest masterclasses hosted in partnership with leading global corporate employers.
          </p>

          <div className="pt-2 max-w-2xl">
            <SmartAISearchBar
              value={search}
              onSearch={handleSearch}
              onChange={(val) => handleSearch(val)}
              placeholder="Search by topic, speaker, faculty, or title..."
              showAiToggle={false}
              loading={loading}
            />
          </div>
        </div>


      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filter:</span>
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all shrink-0 capitalize ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat === 'ALL' ? 'All Events' : cat.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
          <span className="text-xs text-slate-400 font-medium">Loading session schedules & speakers...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="text-center py-20 rounded-3xl border-dashed">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">event_busy</span>
            </div>
            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">No Events Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || selectedCategory !== 'ALL'
                ? 'No scheduled sessions match your current filter criteria. Try clearing filters.'
                : 'Check back later for newly announced sessions and industrial symposiums.'}
            </p>
            {(search || selectedCategory !== 'ALL') && (
              <Button size="sm" variant="outline" onClick={() => { setSearch(''); setSelectedCategory('ALL'); setSearchParams({}); }}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const date = new Date(event.startDateTime || Date.now());
            const isRegistered = registeredEventIds.has(String(event.id));
            const isLive = event.status === 'ONGOING';

            return (
              <Card
                key={event.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col bg-white dark:bg-slate-900"
              >
                {/* 16:9 Cover Image / Dynamic Fallback Header */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {event.coverImage ? (
                    <img
                      src={storageService.getFileUrl(event.coverImage)}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                      <span className="material-symbols-outlined text-slate-500 text-5xl opacity-40">
                        {event.eventType?.toLowerCase().includes('hack') ? 'terminal' :
                         event.eventType?.toLowerCase().includes('speaker') || event.eventType?.toLowerCase().includes('lecture') ? 'record_voice_over' :
                         event.eventType?.toLowerCase().includes('career') ? 'work' : 'school'}
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
                      {event.eventType || 'Workshop'}
                    </span>
                    {event.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600/90 text-white shadow-md backdrop-blur-md border border-purple-400/30">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Completed
                      </span>
                    )}
                    {event.status === 'RESCHEDULED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-600/90 text-white shadow-md backdrop-blur-md border border-amber-400/30">
                        <span className="material-symbols-outlined text-[13px]">update</span>
                        Rescheduled
                      </span>
                    )}
                    {event.status === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600/90 text-white shadow-md backdrop-blur-md border border-rose-400/30">
                        <span className="material-symbols-outlined text-[13px]">cancel</span>
                        Cancelled
                      </span>
                    )}
                    {isLive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase shadow-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Live Now
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <CardContent className="p-5 flex flex-col flex-1 gap-3">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {event.description || 'Join this session for direct insights from verified industrial mentors.'}
                    </p>
                  </div>

                  {/* Key Event Metadata */}
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
                      <span className="font-medium truncate">{event.venueName || event.sessions?.[0]?.venueName || 'To Be Announced'}</span>
                    </div>

                    {event.targetFaculties && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">domain</span>
                        <span className="font-medium text-[11px] truncate text-slate-500">
                          {event.targetFaculties.replace(/,/g, ' • ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer CTAs */}
                  <div className="flex items-center justify-between gap-2.5 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to={`/events/${event.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1">
                        {event.status === 'COMPLETED' && <span className="material-symbols-outlined text-[15px] text-purple-500">photo_library</span>}
                        {event.status === 'COMPLETED' ? 'View Recap' : 'View Details'}
                      </Button>
                    </Link>

                    {event.status === 'COMPLETED' ? (
                      <Link to={`/events/${event.id}`} className="flex-1">
                        <div className="py-1.5 px-3 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">verified</span>
                          Concluded
                        </div>
                      </Link>
                    ) : event.status === 'CANCELLED' ? (
                      <div className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                        Cancelled
                      </div>
                    ) : user?.role === 'STUDENT' ? (
                      isRegistered ? (
                        <div className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Registered
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                          icon="how_to_reg"
                          loading={registeringId === event.id}
                          onClick={() => handleQuickRegister(event)}
                        >
                          Register
                        </Button>
                      )
                    ) : (
                      <Link to="/login" className="flex-1">
                        <Button size="sm" variant="primary" className="w-full text-xs font-semibold bg-sky-600 hover:bg-sky-700" icon="login">
                          Join
                        </Button>
                      </Link>
                    )}
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
