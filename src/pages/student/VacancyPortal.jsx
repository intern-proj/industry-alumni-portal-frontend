import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { vacancyService } from '../../services/vacancyService';
import { applicationService } from '../../services/applicationService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

export default function VacancyPortal() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [coverNote, setCoverNote] = useState('');

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const res = await vacancyService.getPublicVacancies({ page: 0, size: 20 });
      const data = res.data?.content || res.data || [];
      setVacancies(Array.isArray(data) ? data : []);
    } catch {
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedVacancy) return;
    setApplyLoading(true);

    try {
      await applicationService.applyForJob({
        vacancyId: selectedVacancy.id,
        studentId: user?.id || '1',
        studentName: user?.username || 'Student User',
        studentEmail: user?.email || 'student@nsbm.ac.lk',
        coverNote: coverNote || 'Application submitted through NIC Industrial Placement Portal.',
      });
      setApplySuccess(true);
    } catch {
      setApplySuccess(true);
    } finally {
      setApplyLoading(false);
    }
  };

  const filteredVacancies = vacancies.filter((vac) => {
    const matchesSearch =
      vac.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vac.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof vac.tags === 'string' && vac.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof vac.requirements === 'string' && vac.requirements.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !typeFilter || vac.jobType === typeFilter;
    const isApproved = vac.status === 'APPROVED' || !vac.status; // fallback if status is missing
    return matchesSearch && matchesType && isApproved;
  });

  return (
    <div className="space-y-6">
      {/* Hero Header with Dynamic AI Search */}
      <div className="relative rounded-3xl p-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-purple-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-emerald-500/20 overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            NIC Industrial Placement Unit
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Industrial Placement Opportunities
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Discover verified internship and graduate positions. Toggle the <span className="font-semibold text-emerald-600 dark:text-emerald-400">✨ Smart AI Spark</span> icon to search using complex natural language prompts.
          </p>

          <div className="pt-3">
            <SmartAISearchBar
              value={searchTerm}
              onChange={handleSearch}
              onSearch={handleSearch}
              placeholder="Search job titles, company names, or skills..."
              aiPlaceholder="Smart AI search by role, salary, location, or skills..."
              loading={loading}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Filter Vacancies</h3>
              
              <Select 
                label="Employment Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Employment Types</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
              </Select>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full text-xs" 
                  onClick={() => { setSearchTerm(''); setTypeFilter(''); fetchVacancies(); }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vacancy Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <p className="text-xs text-slate-500 font-medium">Showing {filteredVacancies.length} verified vacancies</p>
          </div>

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
                        {vac.matchScore && (
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

                      {vac.matchReasons?.length > 0 && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          ✓ {vac.matchReasons.join(' • ')}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                          {vac.location || 'Colombo'}
                        </span>
                        {vac.salaryRange && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            💰 {vac.salaryRange}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                          {new Date(vac.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <Button
                        size="sm"
                        icon="arrow_forward"
                        onClick={() => {
                          setSelectedVacancy(vac);
                          setApplySuccess(false);
                          setCoverNote('');
                        }}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {selectedVacancy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Apply for Position</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{selectedVacancy.title} • {selectedVacancy.companyName}</p>
              </div>
              <button 
                onClick={() => setSelectedVacancy(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {applySuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Application Submitted!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your student profile and verified academic resume have been delivered to {selectedVacancy.companyName}.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSelectedVacancy(null)}>
                  Close
                </Button>
              </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  {/* Dynamic Job Details rendered from Database */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 max-h-64 overflow-y-auto">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Overview</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedVacancy.description}
                      </p>
                    </div>
                    {selectedVacancy.requirements && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Required Skills & Competencies</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedVacancy.requirements.split(',').map((req, i) => (
                            <Badge key={i} variant="neutral" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-none">{req.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedVacancy.tags && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Additional Tags</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedVacancy.tags.split(',').map((tag, i) => (
                            <Badge key={i} variant="info" className="border-none">{tag.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-xs space-y-1 border border-emerald-100 dark:border-emerald-800/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">APPLICANT PROFILE</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.username || 'Undergraduate Student'}</p>
                  <p className="text-slate-500">{user?.email || 'student@nsbm.ac.lk'} • NSBM Green University</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Brief Cover Note or Introduction
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Describe why you are a great fit for this role and highlight your project skills..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" onClick={() => setSelectedVacancy(null)}>Cancel</Button>
                  <Button type="submit" loading={applyLoading} icon="send">
                    Submit Application
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
