import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Link, useSearchParams } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';

export default function PublicVacancyDirectory() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialAi = searchParams.get('ai') === 'true';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedWorkplaces, setSelectedWorkplaces] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [minSalary, setMinSalary] = useState(0);

  const toggleType = (val) => {
    setSelectedTypes(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const toggleWorkplace = (val) => {
    setSelectedWorkplaces(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const toggleFaculty = (val) => {
    setSelectedFaculties(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedWorkplaces([]);
    setSelectedFaculties([]);
    setMinSalary(0);
    fetchVacancies();
  };

  const matchesSalary = (vac) => {
    if (minSalary === 0) return true;
    const salStr = (vac.salaryRange || vac.salary || '').toLowerCase();
    const numbers = salStr.match(/\d[\d,]*/g)?.map(n => parseInt(n.replace(/,/g, ''), 10)) || [];
    const maxVal = numbers.length > 0 ? Math.max(...numbers) : null;
    const isNegotiable = salStr.includes('negotiable') || salStr.includes('undisclosed') || salStr === '' || salStr === 'pending';

    if (maxVal === null) return isNegotiable;
    return maxVal >= minSalary;
  };
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const res = await vacancyService.getPublicVacancies();
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data?.data)) list = res.data.data;
      else if (Array.isArray(res.data?.content)) list = res.data.content;
      else if (Array.isArray(res.data?.data?.content)) list = res.data.data.content;
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
    
    const matchesSearch = !searchTerm || v.matchScore || title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skills.toLowerCase().includes(searchTerm.toLowerCase());
                          
    const matchesType = selectedTypes.length === 0 || 
      selectedTypes.some(t => 
        (v.jobType || v.type || '').toUpperCase() === t.toUpperCase() || 
        (v.title || '').toUpperCase().includes(t.toUpperCase())
      );

    const matchesWorkplace = selectedWorkplaces.length === 0 || 
      selectedWorkplaces.some(w => (v.workplaceType || v.location || '').toUpperCase().includes(w.toUpperCase()));

    const matchesFaculty = selectedFaculties.length === 0 || 
      selectedFaculties.some(f => (v.targetFaculties || '').toLowerCase().includes(f.toLowerCase()));

    const salaryMatch = matchesSalary(v);

    return matchesSearch && matchesType && matchesWorkplace && matchesFaculty && salaryMatch;
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
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">tune</span>
                  Filter Vacancies
                </h3>
                {(selectedTypes.length > 0 || selectedWorkplaces.length > 0 || selectedFaculties.length > 0 || minSalary > 0 || searchTerm) && (
                  <button 
                    onClick={resetAllFilters}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Employment Type Checkboxes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Employment Type
                  </label>
                  {selectedTypes.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      {selectedTypes.length}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'INTERNSHIP', label: 'Internship / Trainee' },
                    { value: 'FULL_TIME', label: 'Full-time' },
                    { value: 'PART_TIME', label: 'Part-time' },
                    { value: 'CONTRACT', label: 'Contract' }
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(opt.value)}
                        onChange={() => toggleType(opt.value)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Workplace Mode Checkboxes */}
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Workplace Mode
                  </label>
                  {selectedWorkplaces.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      {selectedWorkplaces.length}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'ON_SITE', label: 'On-site / Colombo' },
                    { value: 'HYBRID', label: 'Hybrid' },
                    { value: 'REMOTE', label: 'Remote' }
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedWorkplaces.includes(opt.value)}
                        onChange={() => toggleWorkplace(opt.value)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Salary Range Slider */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Minimum Salary (LKR)
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    {minSalary === 0 ? 'Any' : `LKR ${minSalary.toLocaleString()}+`}
                  </span>
                </div>
                <div className="space-y-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="300000" 
                    step="10000" 
                    value={minSalary}
                    onChange={(e) => setMinSalary(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 outline-none hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
                    <span>Any</span>
                    <span>300k+</span>
                  </div>
                </div>
              </div>

              {/* Faculty Domain Checkboxes */}
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Faculty
                  </label>
                  {selectedFaculties.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      {selectedFaculties.length}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'Computing', label: 'Faculty of Computing' },
                    { value: 'Business', label: 'Faculty of Business' },
                    { value: 'Science', label: 'Faculty of Science' },
                    { value: 'Engineering', label: 'Faculty of Engineering' }
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFaculties.includes(opt.value)}
                        onChange={() => toggleFaculty(opt.value)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  className="w-full text-xs" 
                  onClick={resetAllFilters}
                >
                  Clear All Filters
                </Button>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((v) => (
                <Card key={v.id} className="hover:border-emerald-500/40 hover:shadow-sm transition-all border border-slate-200 dark:border-slate-800 flex flex-col">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{v.title}</span>
                        <Badge variant={v.type === 'INTERNSHIP' || v.jobType === 'INTERNSHIP' ? 'success' : 'info'} className="text-[8px] px-1.5 py-0">
                          {v.type || v.jobType || 'INTERNSHIP'}
                        </Badge>
                        {user && v.matchScore && (
                          <div className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px] text-emerald-500">auto_awesome</span>
                            {v.matchScore}% Match
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">domain</span>
                          {v.company || v.companyName || 'Corporate Partner'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {v.location || 'Colombo'}
                          </span>
                          {(v.salary || v.salaryRange) && (
                            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <span className="material-symbols-outlined text-[13px]">payments</span>
                              {v.salary || v.salaryRange}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed pt-1 line-clamp-2">
                        {v.description}
                      </p>

                      {v.tags && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {v.tags.split(',').slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="neutral" className="bg-slate-100 dark:bg-slate-800 text-[8px] px-1.5 py-0 text-slate-500 border-none">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {v.matchReasons?.length > 0 && (
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1 pt-1">
                          <span className="material-symbols-outlined text-[11px]">verified</span>
                          {v.matchReasons[0]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Link to={`/vacancies/${v.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-[10px] h-6 px-2">
                          View Post
                        </Button>
                      </Link>
                      <Link to="/login" className="flex-1">
                        <Button size="sm" icon="login" className="w-full text-[10px] h-6 px-2">
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
