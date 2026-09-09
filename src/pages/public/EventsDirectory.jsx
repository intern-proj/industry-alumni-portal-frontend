import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function EventsDirectory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setLoading(true);
    eventService.getEvents({ search: searchParams.get('q'), size: 20 })
      .then((res) => {
        let fetched = [];
        if (Array.isArray(res.data)) fetched = res.data;
        else if (Array.isArray(res.data?.data)) fetched = res.data.data;
        else if (Array.isArray(res.data?.content)) fetched = res.data.content;
        else if (Array.isArray(res.data?.data?.content)) fetched = res.data.data.content;
        setEvents(fetched);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function handleSearch(query) {
    setSearch(query);
    setSearchParams(query ? { q: query } : {});
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 space-y-10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl shadow-sky-500/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">event_available</span>
            Knowledge & Industry Sessions
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Industry Workshops & Events</h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Discover upcoming tech symposiums, industry panels, and hands-on masterclasses hosted at NSBM Green University.
          </p>

          <div className="pt-2 max-w-2xl">
            <SmartAISearchBar
              value={search}
              onSearch={handleSearch}
              onChange={(val) => handleSearch(val)}
              placeholder="Search events by title, topic, or venue..."
              showAiToggle={false}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading scheduled sessions...</span>
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">event_busy</span>
            </div>
            <h3 className="text-slate-800 dark:text-slate-200 text-base font-bold">No Events Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Check back later for newly announced sessions and industrial symposiums.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.length === 0 ? (
              <div className="col-span-full p-16 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                No events found matching your search.
              </div>
            ) : (
              events.map((event) => {
                const date = new Date(event.startDateTime || Date.now());
                return (
                  <Card key={event.id} className="hover:border-emerald-500/40 hover:shadow-sm transition-all border border-slate-200 dark:border-slate-800 flex flex-col">
                    <CardContent className="p-4 flex flex-col h-full gap-3">
                      <div className="flex items-start gap-3">
                        {/* Calendar Date Icon Box */}
                        <div className="shrink-0 text-center w-12 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <p className="text-sm font-black text-sky-600 dark:text-sky-400">{date.getDate()}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">{event.title}</h3>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="info" className="text-[8px] px-1.5 py-0">{event.eventType || 'SESSION'}</Badge>
                          {event.status && <Badge variant="success" className="text-[8px] px-1.5 py-0">{event.status}</Badge>}
                          {event.certificateEligible && (
                            <Badge variant="placed" className="text-[8px] px-1.5 py-0 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">workspace_premium</span>
                              CERT
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{event.description}</p>
                        
                        <div className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">schedule</span>
                            <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {event.venueName && (
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-slate-400">location_on</span>
                              <span className="truncate">{event.venueName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link to={`/events/${event.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-[10px] h-6 px-2">Details</Button>
                        </Link>
                        <Link to="/login" className="flex-1">
                          <Button size="sm" className="w-full text-[10px] h-6 px-2 bg-sky-600 hover:bg-sky-700" icon="login">Join</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
