import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { participationService } from '../../services/participationService';
import { applicationService } from '../../services/applicationService';
import { vacancyService } from '../../services/vacancyService';
import { userService } from '../../services/userService';
import { aiService } from '../../services/aiService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [recommendedVacancies, setRecommendedVacancies] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUniversalSearch = (response) => {
    if (response.directive?.suggested_route) {
      navigate(response.directive.suggested_route, { 
        state: { universalSearchQuery: searchQuery } 
      });
    }
  };

  const handleNormalSearch = (val) => {
    setSearchQuery(val);
    if (val.trim()) {
      navigate('/student/vacancies', { 
        state: { universalSearchQuery: val.trim() } 
      });
    }
  };
  
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    Promise.all([
      participationService.getRegistrations({ userId: user.id, size: 5 }).catch(() => ({ data: [] })),
      applicationService.getApplicationsByAlumni(user.id, { size: 5 }).catch(() => ({ data: [] })),
      userService.getResumesByUserId(user.id).catch(() => ({ data: [] })),
      userService.getProfileByUserId(user.id).catch(() => ({ data: {} })),
      vacancyService.getPublicVacancies({ page: 0, size: 20 }).catch(() => ({ data: [] }))
    ]).then(async ([regRes, appRes, resRes, profRes, vacRes]) => {
      const extractList = (res) => {
        if (!res) return [];
        const raw = res.data?.data !== undefined ? res.data.data : res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.content)) return raw.content;
        return [];
      };

      const regList = extractList(regRes);
      const appList = extractList(appRes);
      const safeResumes = extractList(resRes);
      const safeVacancies = extractList(vacRes);

      setRegistrations(regList);
      setApplications(appList);
      setResumes(safeResumes);

      if (safeResumes.length > 0) {
        const primary = safeResumes.find(r => r.isPrimary) || safeResumes[0];
        // Note: previously set primary resume url for modal here
      }

      const userProfile = profRes.data?.data || profRes.data || {};
      const userSkills = userProfile.skills?.map(s => typeof s === 'string' ? s : s.skillName).filter(Boolean) || [];

      // Get IDs of vacancies already applied to
      const appliedVacancyIds = new Set(appList.map(a => String(a.vacancyId || a.vacancy?.id || a.vacancy_id)));
      
      // Filter out applied vacancies
      const unappliedVacancies = safeVacancies.filter(v => 
        !appliedVacancyIds.has(String(v.id)) && !appliedVacancyIds.has(String(v.vacancy_id))
      );

      // If student has an uploaded resume, calculate AI recommendations
      if (safeResumes.length > 0 && unappliedVacancies.length > 0) {
        setRecommendationsLoading(true);
        try {
          // Fetch matches using unified cached profile (we pass null for resume URL to indicate unified profile mode, or any URL since backend prioritizes user_id cache)
          const matchResponse = await aiService.matchResumeToVacancies(null, unappliedVacancies, [], user.id, userSkills)
            .catch(() => ({ data: { matched_vacancies: [] } }));
          
          const matchedList = matchResponse.data?.matched_vacancies || [];
          
          const bestMatches = matchedList
            .filter(m => m.match_percentage > 70)
            .sort((a, b) => b.match_percentage - a.match_percentage)
            .slice(0, 4);

          if (bestMatches.length > 0) {
            const topRecs = bestMatches.map(m => {
              const originalVac = unappliedVacancies.find(v => String(v.id || v.vacancy_id) === String(m.vacancy_id)) || {};
              return {
                ...originalVac,
                id: m.vacancy_id,
                title: m.title || originalVac.title,
                companyName: m.company_name || originalVac.companyName,
                description: originalVac.description || '',
                requirements: originalVac.requirements || '',
                location: originalVac.location || 'Colombo',
                jobType: originalVac.jobType || 'NOT_SPECIFIED',
                workplaceType: originalVac.workplaceType || 'HYBRID',
                matchPercentage: m.match_percentage,
                matchedSkills: m.matched_skills || [],
                missingSkills: m.missing_skills || [],
                fitSummary: m.fit_summary
              };
            });
            setRecommendedVacancies(topRecs);
          } else {
            setRecommendedVacancies([]);
          }
        } catch (err) {
          console.warn("AI recommendation matching deferred:", err);
          setRecommendedVacancies([]);
        } finally {
          setRecommendationsLoading(false);
        }
      } else if (unappliedVacancies.length > 0) {
        setRecommendedVacancies(unappliedVacancies.slice(0, 4));
      } else {
        setRecommendedVacancies([]);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [user]);

  const hasUploadedResume = resumes.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── AI VACANCY MATCHING & RECOMMENDATIONS SECTION ── */}
      {!hasUploadedResume ? (
        <section className="relative rounded-3xl p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              AI Career Recommendation Engine
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Unlock Personalized Vacancy Matches
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Upload your verified CV in the resume builder to enable automatic AI matching against top employer requirements and see your personalized match percentage.
            </p>
          </div>
          <Link to="/student/resume" className="shrink-0">
            <Button icon="upload_file" size="sm">
              Upload CV to Activate
            </Button>
          </Link>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">auto_awesome</span>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                Recommended for You (AI Matched)
              </h3>
            </div>
            <Link to="/student/vacancies" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Browse All Vacancies →
            </Link>
          </div>

          {recommendationsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Analyzing your resume and matching active vacancies...
            </div>
          ) : recommendedVacancies.length === 0 ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No matching vacancies found for your profile at this moment. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedVacancies.map((vac) => (
                <div
                  key={vac.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md cursor-pointer"
                  onClick={() => navigate(`/student/vacancies/${vac.id}`)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {vac.matchPercentage !== undefined ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                          {vac.matchPercentage}% Match
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">work</span>
                          Open Role
                        </span>
                      )}
                      {vac.jobType && vac.jobType !== 'NOT_SPECIFIED' && <Badge variant="neutral" className="text-[10px]">{vac.jobType}</Badge>}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {vac.title}
                    </h4>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {vac.companyName || 'Corporate Partner'}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {vac.matchedSkills?.slice(0, 3).map((sk, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">check</span>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{vac.location || 'Colombo'}</span>
                    <Button 
                      size="xs" 
                      variant="primary" 
                      icon="send"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/vacancies/${vac.id}`);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2-Column Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Recent Event Registrations */}
        <div className="lg:col-span-7 glass-card rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-slate-900 dark:text-white">Recent Event Registrations</h3>
            <Link to="/student/events" className="font-button-text text-button-text text-secondary hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin" /></div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 text-[36px]">event_busy</span>
              <p className="font-body-base text-body-base text-slate-400 mt-2">No event registrations yet.</p>
              <Link to="/events" className="btn-outline h-8 text-[12px] mt-3 inline-flex">Browse Events</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Event Name</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {registrations.slice(0, 5).map((reg) => (
                    <tr key={reg.id}>
                      <td className="font-medium text-slate-900 dark:text-white">{reg.eventTitle || reg.eventId}</td>
                      <td className="text-slate-600 dark:text-slate-400">{new Date(reg.registeredAt || Date.now()).toLocaleDateString()}</td>
                      <td><span className="badge-success text-[10px]">{reg.status || 'REGISTERED'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Job Applications */}
        <div className="lg:col-span-5 glass-card rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-slate-900 dark:text-white">Recent Job Applications</h3>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin" /></div>
            ) : applications.length === 0 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-slate-400 text-[36px]">work_off</span>
                <p className="font-body-base text-body-base text-slate-400 mt-2">No applications yet.</p>
                <Link to="/student/vacancies" className="btn-outline h-8 text-[12px] mt-3 inline-flex">Browse Vacancies</Link>
              </div>
            ) : (
              applications.slice(0, 4).map((app) => (
                <div key={app.id} className="flex items-start gap-4 p-4 border border-outline-variant/30 rounded bg-white dark:bg-slate-800/60 hover:bg-surface transition-colors">
                  <div className="w-10 h-10 rounded bg-surface dark:bg-slate-700 flex items-center justify-center border border-outline-variant/50 shrink-0">
                    <span className="material-symbols-outlined text-secondary">corporate_fare</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-body-medium text-body-medium text-slate-900 dark:text-white truncate">
                        {app.vacancyTitle || app.positionTitle || 'Position'}
                      </h4>
                      {app.matchPercentage && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {app.matchPercentage}% Fit
                        </span>
                      )}
                    </div>
                    <p className="font-caption text-caption text-slate-600 dark:text-slate-400">{app.companyName || 'Company'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`badge-${app.status === 'SHORTLISTED' ? 'info' : app.status === 'PLACED' ? 'placed' : 'neutral'} text-[10px]`}>
                        {app.status || 'APPLIED'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
