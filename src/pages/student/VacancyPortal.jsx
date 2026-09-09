import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { vacancyService } from '../../services/vacancyService';
import { applicationService } from '../../services/applicationService';
import { aiService } from '../../services/aiService';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

export default function VacancyPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedWorkplaces, setSelectedWorkplaces] = useState([]);
  const [minSalary, setMinSalary] = useState(0);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [loading, setLoading] = useState(true);
  const [universalSearchDirective, setUniversalSearchDirective] = useState(null);

  const toggleType = (val) => {
    setSelectedTypes(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const toggleWorkplace = (val) => {
    setSelectedWorkplaces(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  // toggleSalary removed in favor of minSalary slider

  const toggleFaculty = (val) => {
    setSelectedFaculties(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedWorkplaces([]);
    setMinSalary(0);
    setSelectedFaculties([]);
    setSortOrder('NEWEST');
    setAiMatchingActive(false);
    fetchVacancies();
  };

  const [resumes, setResumes] = useState([]);
  const [appliedVacancyIds, setAppliedVacancyIds] = useState([]);

  // AI Resume Match State
  const [aiMatchingActive, setAiMatchingActive] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchedSkillsSummary, setMatchedSkillsSummary] = useState([]);

  const extractList = (res) => {
    if (!res) return [];
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.content)) return raw.content;
    return [];
  };

  useEffect(() => {
    if (user?.id) {
      // Fetch resumes
      userService.getResumesByUserId(user.id).then(res => {
        const resList = extractList(res);
        setResumes(resList);
        fetchVacancies(resList);
      }).catch(() => {
        setResumes([]);
        fetchVacancies([]);
      });

      // Fetch applications to track applied jobs
      applicationService.getApplicationsByAlumni(user.id).then(res => {
        const apps = res.data?.data || res.data || [];
        setAppliedVacancyIds(apps.map(a => a.vacancyId));
      }).catch(() => setAppliedVacancyIds([]));
    } else {
      fetchVacancies([]);
    }
  }, [user?.id]);

  const handleMatchMyResume = async () => {
    if (aiMatchingActive) {
      setAiMatchingActive(false);
      fetchVacancies();
      return;
    }

    if (resumes.length === 0) {
      window.toast.error("Please upload your CV in the 'My Resume' section first to enable AI matching.");
      return;
    }

    const primary = resumes.find(r => r.isPrimary) || resumes[0];
    if (!primary?.fileUrl) {
      window.toast.error("No valid resume file found. Please upload a PDF CV.");
      return;
    }

    setMatchingLoading(true);
    try {
      const res = await aiService.matchResumeToVacancies(primary.fileUrl, vacancies, [], user?.id);
      const matched = res.data?.matched_vacancies || [];
      setMatchedSkillsSummary(res.data?.extracted_skills || []);

      if (matched.length > 0) {
        setVacancies(prev => {
          const updated = prev.map(v => {
            const m = matched.find(item => item.vacancy_id === (v.id || v.vacancy_id));
            if (m) {
              return {
                ...v,
                matchPercentage: m.match_percentage,
                matchedSkills: m.matched_skills || [],
                missingSkills: m.missing_skills || [],
                fitSummary: m.fit_summary
              };
            }
            return v;
          });
          // Sort descending by match percentage
          return updated.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
        });
        setAiMatchingActive(true);
      }
    } catch (err) {
      window.toast.error("AI matching engine is currently processing. Please try again shortly.");
    } finally {
      setMatchingLoading(false);
    }
  };

  const fetchVacancies = async (resumesToUse = resumes) => {
    setLoading(true);
    try {
      const res = await vacancyService.getPublicVacancies({ page: 0, size: 20 });
      const vacs = extractList(res);

      if (user?.id && resumesToUse.length > 0 && vacs.length > 0) {
        const primary = resumesToUse.find(r => r.isPrimary) || resumesToUse[0];
        if (primary?.fileUrl) {
          setMatchingLoading(true);
          try {
            const userSkills = user?.skills?.map(s => typeof s === 'string' ? s : (s.skillName || s.name)) || [];
            const matchRes = await aiService.matchResumeToVacancies(primary.fileUrl, vacs, [], user.id, userSkills);
            const matched = matchRes.data?.matched_vacancies || [];
            setMatchedSkillsSummary(matchRes.data?.extracted_skills || []);
            
            if (matched.length > 0) {
              const updatedVacs = vacs.map(v => {
                const m = matched.find(item => item.vacancy_id === (v.id || v.vacancy_id));
                if (m) {
                  return {
                    ...v,
                    matchPercentage: m.match_percentage,
                    matchedSkills: m.matched_skills || [],
                    missingSkills: m.missing_skills || [],
                    fitSummary: m.fit_summary
                  };
                }
                return v;
              });
              setVacancies(updatedVacs.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0)));
              setAiMatchingActive(true);
              return; // exit early to avoid overwriting setVacancies
            }
          } catch (err) {
            console.warn("Auto-match failed:", err);
          } finally {
            setMatchingLoading(false);
          }
        }
      }

      setVacancies(vacs);
    } catch {
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!aiMatchingActive) {
      setVacancies(prev => {
        const sorted = [...prev];
        if (sortOrder === 'NEWEST') {
          return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } else if (sortOrder === 'DEADLINE') {
          return sorted.sort((a, b) => new Date(a.deadline || '9999') - new Date(b.deadline || '9999'));
        }
        return sorted;
      });
    }
  }, [sortOrder, aiMatchingActive]);

  const handleSearch = async (query, isAiMode) => {
    setSearchTerm(query);
    if (!query) {
      fetchVacancies();
      return;
    }

    if (isAiMode && vacancies.length > 0) {
      setLoading(true);
      try {
        const res = await aiService.smartSearchVacancies(query, vacancies);
        const results = res.data?.results || [];
        if (results.length > 0) {
          setVacancies(results.map(r => ({
            ...r.item,
            matchScore: r.match_score,
            matchReasons: r.highlight_reasons
          })));
        }
      } catch {
        // No-op
      } finally {
        setLoading(false);
      }
    }
  };



  const handleUniversalSearch = (response) => {
    setUniversalSearchDirective(response.directive);
    
    if (response.detected_domain === 'vacancies') {
      const results = response.results || [];
      if (results.length > 0) {
        setVacancies(results.map(r => ({
          ...r.item,
          matchScore: r.match_score,
          matchReasons: r.highlight_reasons
        })));
      } else {
        setVacancies([]);
      }
    }
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

  const filteredVacancies = vacancies.filter((vac) => {
    const isApproved = vac.status === 'APPROVED' || !vac.status;
    if (!isApproved) return false;

    const matchesType = selectedTypes.length === 0 || 
      selectedTypes.some(t => 
        (vac.jobType || '').toUpperCase() === t.toUpperCase() || 
        (vac.title || '').toUpperCase().includes(t.toUpperCase())
      );

    const matchesWorkplace = selectedWorkplaces.length === 0 || 
      selectedWorkplaces.some(w => (vac.workplaceType || '').toUpperCase() === w.toUpperCase());

    const matchesFaculty = selectedFaculties.length === 0 ||
      selectedFaculties.some(f => (vac.targetFaculties || '').toLowerCase().includes(f.toLowerCase()));

    const salaryMatch = matchesSalary(vac);

    if (universalSearchDirective && universalSearchDirective.action === 'DISPLAY_RESULTS') {
      return matchesType && matchesWorkplace && matchesFaculty && salaryMatch;
    }

    const matchesSearch = !searchTerm || vac.matchScore || vac.matchPercentage ||
      vac.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vac.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof vac.tags === 'string' && vac.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof vac.requirements === 'string' && vac.requirements.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch && matchesType && matchesWorkplace && matchesFaculty && salaryMatch;
  });

  return (
    <div className="space-y-6">
      {universalSearchDirective && universalSearchDirective.action === 'NAVIGATE_AND_FILTER' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-emerald-800 dark:text-emerald-200">{universalSearchDirective.headline}</h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{universalSearchDirective.explanation}</p>
          </div>
          <Button 
            onClick={() => navigate(universalSearchDirective.suggested_route, { state: { universalSearchQuery: searchTerm } })}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            View {universalSearchDirective.badge_label} →
          </Button>
        </div>
      )}

      {/* Sleek Compact AI Hero Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-purple-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-purple-950/30 border border-emerald-500/20 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">AI Vacancy Discovery & Matchmaker</h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Intelligent Role & Skill Match Graph</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-normal">
          Toggle <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">auto_awesome</span> Intelligent Matching</span> to search positions by natural language, salary, technology stack, or work arrangement.
        </p>

        {/* Dynamic Running Border AI Search Bar & Sort */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between pt-1">
          <div className="flex-1 w-full max-w-2xl">
            <SmartAISearchBar
              value={searchTerm}
              onChange={(q) => { setSearchTerm(q); setUniversalSearchDirective(null); }}
              onSearch={handleSearch}
              enableUniversalSearch={true}
              onUniversalSearch={handleUniversalSearch}
              placeholder="Search job titles, company names, or skills..."
              aiPlaceholder="Smart AI search by role, salary, location, or skills..."
              loading={loading}
            />
          </div>
          
          <div className="relative w-full md:w-56 shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                if (e.target.value !== 'AI_MATCH') {
                  setAiMatchingActive(false);
                } else {
                  handleMatchMyResume();
                }
              }}
              className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none shadow-sm cursor-pointer"
            >
              <option value="NEWEST">Sort: Newest First</option>
              <option value="DEADLINE">Sort: Deadline Soonest</option>
              <option value="AI_MATCH">Sort: AI Match Rate</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar with Robust Checkboxes */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="space-y-6 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">tune</span>
                  Filter Vacancies
                </h3>
                {(selectedTypes.length > 0 || selectedWorkplaces.length > 0 || minSalary > 0 || selectedFaculties.length > 0 || searchTerm) && (
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
                    { value: 'ON_SITE', label: 'On-site' },
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

        {/* Vacancy Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <p className="text-xs text-slate-500 font-medium">Showing {filteredVacancies.length} verified vacancies</p>
          </div>

          {aiMatchingActive && matchedSkillsSummary.length > 0 && (
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">psychology</span> Skills from your CV:
              </span>
              {matchedSkillsSummary.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-[11px] border border-slate-200 dark:border-slate-700">
                  {s}
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading verified vacancies from backend...</div>
          ) : filteredVacancies.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">work_outline</span>
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Vacancies Published Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  New verified internship and graduate positions will appear here once approved by faculty coordinators.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredVacancies.map((vac) => (
              <Card key={vac.id} className="hover:border-emerald-500/40 transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{vac.title}</h2>
                        <Badge variant={vac.jobType === 'INTERNSHIP' ? 'info' : 'success'}>
                          {vac.jobType || 'INTERNSHIP'}
                        </Badge>
                        {vac.matchPercentage && (
                          <div className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                            {vac.matchPercentage}% Resume Match
                          </div>
                        )}
                        {!vac.matchPercentage && vac.matchScore && (
                          <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-emerald-500">auto_awesome</span>
                            {vac.matchScore}% Match
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {vac.companyName || 'Corporate Partner'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {vac.description}
                      </p>

                      {vac.matchedSkills?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Matches:</span>
                          {vac.matchedSkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">check</span>
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {vac.missingSkills?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-amber-500 uppercase">Growth Areas:</span>
                          {vac.missingSkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {vac.matchReasons?.length > 0 && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          {vac.matchReasons.join(' • ')}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                          {vac.location || 'Colombo'}
                        </span>
                        {vac.salaryRange && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">payments</span>
                            {vac.salaryRange}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                          {new Date(vac.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      {appliedVacancyIds.includes(vac.id) ? (
                        <Button size="sm" variant="outline" className="text-slate-400 border-slate-300" disabled>
                          Already Applied
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          icon="send"
                          onClick={() => navigate(`/student/vacancies/${vac.id}`)}
                        >
                          Apply
                        </Button>
                      )}
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
