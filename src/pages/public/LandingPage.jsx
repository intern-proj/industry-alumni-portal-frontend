import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { vacancyService } from '../../services/vacancyService';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';

const featureCards = [
  {
    icon: 'work_outline',
    title: 'Industry Vacancies',
    desc: 'Explore verified internship and graduate trainee positions posted directly by approved partner organizations.',
    link: '/vacancies',
    badge: 'Verified Postings',
    gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20'
  },
  {
    icon: 'event_available',
    title: 'Workshops & Events',
    desc: 'Register for guest lectures, technical workshops, and campus recruitment drives hosted by industry leaders.',
    link: '/events',
    badge: 'Industry Sessions',
    gradient: 'from-sky-500/10 to-indigo-500/10 border-sky-500/20'
  },
  {
    icon: 'handshake',
    title: 'Corporate Partnerships',
    desc: 'Register your organization to collaborate on academic curriculums, student hiring, and industry research.',
    link: '/partner/register',
    badge: 'MoU Network',
    gradient: 'from-purple-500/10 to-pink-500/10 border-purple-500/20'
  }
];

export default function LandingPage() {
  const [events, setEvents] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingVacancies, setLoadingVacancies] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    eventService.getEvents({ size: 3, sort: 'startDateTime,desc' })
      .then((res) => {
        const fetched = res.data?.content || res.data?.data || res.data || [];
        setEvents(Array.isArray(fetched) ? fetched : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));

    vacancyService.getPublicVacancies({ size: 3 })
      .then((res) => {
        const fetched = res.data?.content || res.data?.data || res.data || [];
        setVacancies(Array.isArray(fetched) ? fetched : []);
      })
      .catch(() => setVacancies([]))
      .finally(() => setLoadingVacancies(false));
  }, []);

  const handleHeroSearch = (query, isAiMode) => {
    setSearchQuery(query);
    if (query && query.trim()) {
      if (isAiMode) {
        navigate(`/vacancies?ai=true&q=${encodeURIComponent(query.trim())}`);
      } else {
        navigate(`/vacancies?q=${encodeURIComponent(query.trim())}`);
      }
    } else {
      navigate('/vacancies');
    }
  };

  return (
    <div className="space-y-0 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 transition-colors duration-200">
      
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 py-16 md:py-24 bg-gradient-to-b from-emerald-50/50 via-slate-50/30 to-white dark:from-slate-900/80 dark:via-slate-950/90 dark:to-slate-950">
        {/* Glow Accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-500/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Heading, Smart AI Search & CTAs */}
            <div className="lg:col-span-7 space-y-6">

              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Connecting Undergraduates with <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Industry Leaders</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                The official career placement gateway of NSBM Green University. Discover faculty-verified internships, attend industry workshops, and search talent with intelligent AI natural language processing.
              </p>

              {/* Smart Search Bar in Hero */}
              <div className="pt-2 max-w-xl">
                <SmartAISearchBar
                  value={searchQuery}
                  onSearch={handleHeroSearch}
                  placeholder="Search jobs by title, skill (e.g. React, Spring Boot), or company..."
                />
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/login">
                  <button className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-emerald-500/25 transition-all">
                    Login
                  </button>
                </Link>
                <Link to="/partner/register">
                  <button className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-sm transition-all">
                    Register as Industry Partner
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Image Frame */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-lg">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 group">
                  <img
                    src="/images/hero-campus.jpg"
                    alt="NSBM Green University Campus"
                    className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/event-career.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-[10px] font-bold tracking-wider uppercase">
                      Green University Town
                    </span>
                    <h3 className="text-lg font-bold">NSBM Career Guidance Hub</h3>
                    <p className="text-xs text-slate-300">Empowering Undergraduates & Corporate Partners</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Platform Pillars (3 Grid Cards) */}
      <section className="py-16 md:py-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Everything You Need For Career Success</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Streamlined tools for undergraduates, corporate recruiters, and faculty coordinators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className={`p-8 rounded-3xl border bg-gradient-to-br ${card.gradient} bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[26px]">{card.icon}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Explore Portal</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Verified Vacancies */}
      <section className="py-16 md:py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[16px]">work</span>
                Verified Postings
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Latest Verified Vacancies</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Recently approved internship and graduate placement opportunities.</p>
            </div>
            <Link to="/vacancies" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
              View all openings <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {loadingVacancies ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading open vacancies from backend...</div>
          ) : vacancies.length === 0 ? (
            <div className="p-16 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">work_outline</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-base">No Vacancies Currently Published</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">New verified vacancies from corporate partners will appear here once approved by faculty coordinators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vacancies.slice(0, 3).map((vac) => (
                <div key={vac.id} className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {vac.jobType || 'INTERNSHIP'}
                      </span>
                      {vac.salaryRange && (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">💰 {vac.salaryRange}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{vac.title}</h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{vac.companyName || 'Corporate Partner'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{vac.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {vac.location || 'Colombo'}
                    </span>
                    <Link to="/login" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Apply Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Career Events */}
      <section className="py-16 md:py-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[16px]">event</span>
                Knowledge Sessions
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Events & Workshops</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Industry workshops, guest lectures, and career development symposiums.</p>
            </div>
            <Link to="/events" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
              View all sessions <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {loadingEvents ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading upcoming events...</div>
          ) : events.length === 0 ? (
            <div className="p-16 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">event_busy</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-base">No Events Scheduled Right Now</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Check back soon for university workshops, guest lectures, and career networking symposiums.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {events.slice(0, 3).map((event) => {
                const date = new Date(event.startDateTime || Date.now());
                return (
                  <div key={event.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between shadow-sm hover:shadow-xl transition-shadow">
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                          {event.eventType || 'Session'}
                        </span>
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                        {event.venueName || 'NSBM Green University'}
                      </p>
                    </div>

                    <div className="p-6 pt-0 flex gap-3">
                      <Link to={`/events/${event.id}`} className="flex-1">
                        <button className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          Details
                        </button>
                      </Link>
                      <Link to="/login" className="flex-1">
                        <button className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                          Register
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
