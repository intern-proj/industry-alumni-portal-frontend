import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { applicationService } from '../../services/applicationService';
import { vacancyService } from '../../services/vacancyService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

export default function ViewCandidatesApplications({ vacancy, onBack }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeVacancy, setActiveVacancy] = useState(vacancy || location.state?.vacancy || null);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [recalculatingMatches, setRecalculatingMatches] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [user, activeVacancy?.id]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let list = [];
      if (activeVacancy?.id) {
        const res = await applicationService.getApplicationsByVacancy(activeVacancy.id);
        const data = res.data?.data !== undefined ? res.data.data : res.data;
        list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
      } else {
        // Fetch partner vacancies first to isolate only this partner's applicants
        const partnerKey = user?.username || user?.id || '';
        let partnerVacs = [];
        if (partnerKey) {
          try {
            const vRes = await vacancyService.getPartnerVacancies(partnerKey, { page: 0, size: 100 });
            const rawV = vRes.data?.data !== undefined ? vRes.data.data : vRes.data;
            partnerVacs = Array.isArray(rawV) ? rawV : (Array.isArray(rawV?.content) ? rawV.content : []);
          } catch {
            // fallback public
            const pRes = await vacancyService.getPublicVacancies({ page: 0, size: 100 }).catch(() => null);
            const rawP = pRes?.data?.data !== undefined ? pRes.data.data : pRes?.data;
            const allP = Array.isArray(rawP) ? rawP : (Array.isArray(rawP?.content) ? rawP.content : []);
            partnerVacs = allP.filter(v => 
              (v.companyName && user?.companyName && v.companyName.toLowerCase().includes(user.companyName.toLowerCase())) ||
              (v.partnerId && (v.partnerId === partnerKey || v.partnerId === String(user?.id)))
            );
          }
        }
        const vacIdSet = new Set(partnerVacs.map(v => String(v.id || v.vacancyId)));
        const vacMap = new Map(partnerVacs.map(v => [String(v.id || v.vacancyId), v.title || '']));

        const res = await applicationService.getApplications();
        const data = res.data?.data !== undefined ? res.data.data : res.data;
        const all = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
        
        list = all.filter(a => vacIdSet.has(String(a.vacancyId))).map(a => ({
          ...a,
          vacancyTitle: a.vacancyTitle || vacMap.get(String(a.vacancyId)) || ''
        }));
      }

      // Automatically order applicants by match percentage descending (best match first)
      const sorted = [...list].sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
      setApplications(sorted);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateMatches = async () => {
    if (applications.length === 0) return;
    setRecalculatingMatches(true);
    try {
      const res = await aiService.matchApplicantsBulk(
        vacancy?.id,
        vacancy?.title || 'Job Vacancy',
        vacancy?.description || '',
        vacancy?.requirements || '',
        vacancy?.tags || '',
        applications
      );
      const ranked = res.data?.ranked_applicants || [];
      if (ranked.length > 0) {
        setApplications(prev => {
          const updated = prev.map(app => {
            const match = ranked.find(r => String(r.applicant_id) === String(app.id));
            if (match) {
              return {
                ...app,
                matchPercentage: match.match_percentage,
                matchedSkills: match.matched_skills?.join(', '),
                missingSkills: match.missing_skills?.join(', '),
                fitSummary: match.fit_summary,
                scoreBreakdown: JSON.stringify(match.score_breakdown)
              };
            }
            return app;
          });
          return updated.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
        });
      }
    } catch (err) {
      window.toast.error("AI match recalculation deferred. Please try again in a few moments.");
    } finally {
      setRecalculatingMatches(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp || !newStatus) return;
    setUpdating(true);
    try {
      await applicationService.updateStatus(selectedApp.id, { 
        newStatus, 
        changedBy: user?.id || 'system', 
        changeReason: 'Recruiter updated candidate status' 
      });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      setSelectedApp(null);
    } catch {
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      setSelectedApp(null);
    } finally {
      setUpdating(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const name = app.studentName || app.name || '';
    const vacTitle = app.vacancyTitle || app.vacancy || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const parseBreakdown = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const columns = [
    { 
      key: 'candidate', 
      header: 'Candidate',
      render: (row) => {
        const raw = row.studentName || row.name || '';
        const clean = raw.replace(/\s+Candidate$/i, '').trim() || row.studentId || row.alumniId || '';
        return (
          <span className="font-semibold text-slate-900 dark:text-white">
            {clean}
          </span>
        );
      }
    },
    {
      key: 'matchPercentage',
      header: 'AI Match Score',
      render: (row) => {
        const pct = row.matchPercentage;
        if (pct === null || pct === undefined) {
          return <span className="text-xs text-slate-400 italic">N/A</span>;
        }

        let colorClass = "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
        if (pct >= 85) {
          colorClass = "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
        } else if (pct >= 70) {
          colorClass = "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700";
        } else if (pct >= 50) {
          colorClass = "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
        }

        return (
          <span className={`px-2.5 py-1 rounded-full border text-xs font-extrabold inline-block ${colorClass}`}>
            {pct}%
          </span>
        );
      }
    },
    { 
      key: 'vacancy', 
      header: 'Position',
      render: (row) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{row.vacancyTitle || vacancy?.title || (row.vacancyId ? `Position #${row.vacancyId}` : '')}</span>
    },
    { 
      key: 'date', 
      header: 'Applied Date', 
      render: (row) => {
        const dateVal = row.appliedAt || row.createdAt;
        return dateVal ? new Date(dateVal).toLocaleDateString() : '';
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        let variant = 'info';
        if (row.status === 'UNDER_REVIEW') variant = 'warning';
        if (row.status === 'SHORTLISTED') variant = 'info';
        if (row.status === 'INTERVIEW') variant = 'warning';
        if (row.status === 'PLACED') variant = 'success';
        if (row.status === 'REJECTED') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.resumeUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              icon="description"
              onClick={() => window.open(row.resumeUrl, '_blank')}
            >
              Resume
            </Button>
          )}
          <Button 
            variant="primary" 
            size="sm" 
            icon="visibility"
            onClick={() => navigate(`/partner/applications/${row.id}`)}
          >
            See Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {activeVacancy ? `Applications for ${activeVacancy.title}` : 'Candidate Applications & ATS Pipeline'}
              </h1>
              {activeVacancy && (
                <button
                  type="button"
                  onClick={() => setActiveVacancy(null)}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                  Clear Filter
                </button>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Ranked with AI-powered resume matching. Best matching candidates appear first.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon="refresh"
            loading={recalculatingMatches}
            onClick={handleRecalculateMatches}
          >
            Recalculate AI Matches
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Candidates ({filteredApps.length})</CardTitle>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search candidate name or degree..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            <div className="w-40">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW">Interview</option>
                <option value="PLACED">Placed</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredApps} loading={loading} />
        </CardContent>
      </Card>

      {/* Stage Management Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedApp.studentName || selectedApp.name}</h3>
                <p className="text-xs text-slate-500">{selectedApp.vacancyTitle || selectedApp.vacancy}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Email: {selectedApp.studentEmail || selectedApp.email || 'student@nsbm.ac.lk'}</p>
                <p className="text-slate-500">Degree: {selectedApp.program || 'Faculty of Computing'}</p>
                {selectedApp.resumeUrl && (
                  <a href={selectedApp.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">description</span>
                    View Full Resume
                  </a>
                )}
              </div>

              {selectedApp.coverNote && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Candidate Cover Note:</span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedApp.coverNote}
                  </p>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Update Recruitment Stage</label>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="APPLIED">APPLIED (New Application)</option>
                  <option value="SHORTLISTED">SHORTLISTED (Selected for Next Stage)</option>
                  <option value="INTERVIEW">INTERVIEW (Interview Scheduled)</option>
                  <option value="PLACED">PLACED (Offer Extended & Accepted)</option>
                  <option value="REJECTED">REJECTED (Not Selected)</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
              <Button loading={updating} onClick={handleUpdateStatus} icon="check">Update Stage</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
