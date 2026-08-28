import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Link, useSearchParams } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import { aiService } from '../../services/aiService';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';

export default function PublicVacancyDirectory() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialAi = searchParams.get('ai') === 'true';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const res = await vacancyService.getPublicVacancies();
      const data = res.data?.content || res.data?.data || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setVacancies(list);

      if (initialQuery && initialAi && list.length > 0) {
        handleSmartSearch(initialQuery, true, list);
      }
    } catch {
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSearch = async (query, isAiMode, pool = vacancies) => {
    setSearchTerm(query);
    if (!query) {
      fetchVacancies();
      return;
    }

    if (isAiMode && pool.length > 0) {
      setLoading(true);
      try {
        const res = await aiService.smartSearchVacancies(query, pool);
        const results = res.data?.results || [];
        if (results.length > 0) {
          setVacancies(results.map(r => ({
            ...r.item,
            matchScore: r.match_score,
            matchReasons: r.highlight_reasons
          })));
        }
      } catch {
        // Fallback to client filtering
      } finally {
        setLoading(false);
      }
    }
  };

  const filtered = vacancies.filter(v => {
    const title = v.title || '';
    const company = v.company || v.companyName || '';
    const skills = Array.isArray(v.skills) ? v.skills.join(' ') : (v.tags || v.requirements || '');
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skills.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || v.type === typeFilter || v.jobType === typeFilter;
    const matchesLoc = !locationFilter || (v.location || '').toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesType && matchesLoc;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 space-y-10">
      {/* Header Hero Banner with Dynamic AI Search */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl shadow-emerald-500/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">hub</span>
            Official Career Gateway
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Industry Vacancies Directory</h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Browse verified internship and full-time positions posted directly by approved partner organizations.
          </p>

          {/* Smart AI Search Bar */}
          <div className="pt-2">
            <SmartAISearchBar
              value={searchTerm}
              onSearch={handleSmartSearch}
              onChange={(val, isAi) => isAi ? null : setSearchTerm(val)}
              placeholder="Search vacancies by title, company, or skills (e.g. Java, React)..."
              aiPlaceholder="Smart AI search by role, salary, location, or skills..."
              loading={loading}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">tune</span>
                  Filter Openings
                </h3>
              </div>

              <Select 
                label="Employment Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
              </Select>

              <Select
                label="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                <option value="Colombo">Colombo</option>
                <option value="Malabe">Malabe</option>
                <option value="Remote">Remote</option>
              </Select>

              {(searchTerm || typeFilter || locationFilter) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => { setSearchTerm(''); setTypeFilter(''); setLocationFilter(''); fetchVacancies(); }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vacancies Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-900 dark:text-white font-bold">{filtered.length}</strong> available verified openings
            </p>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading verified vacancies from backend...</span>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">work_off</span>
                </div>
                <h3 className="text-slate-800 dark:text-slate-200 text-base font-bold">No Matching Vacancies Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Try adjusting your filters, searching for other skill keywords, or checking back later.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((v) => (
              <Card key={v.id} className="hover:border-emerald-500/40 hover:shadow-lg transition-all border border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">{v.title}</span>
                        <Badge variant={v.type === 'INTERNSHIP' || v.jobType === 'INTERNSHIP' ? 'success' : 'info'}>
                          {v.type || v.jobType || 'INTERNSHIP'}
                        </Badge>
                        {v.matchScore && (
                          <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-emerald-500">auto_awesome</span>
                            {v.matchScore}% Match
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">domain</span>
                          {v.company || v.companyName || 'Corporate Partner'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {v.location || 'Colombo'}
                        </span>
                        {(v.salary || v.salaryRange) && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-[16px]">payments</span>
                            {v.salary || v.salaryRange}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 line-clamp-2">
                        {v.description}
                      </p>

                      {v.tags && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          {v.tags.split(',').map((tag, idx) => (
                            <Badge key={idx} variant="neutral" className="bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500 border-none">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {v.matchReasons?.length > 0 && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          ✓ {v.matchReasons.join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <Link to="/login">
                        <Button size="sm" icon="login">
                          Sign In to Apply
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
