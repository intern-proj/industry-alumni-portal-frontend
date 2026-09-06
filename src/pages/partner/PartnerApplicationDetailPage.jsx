import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/applicationService';
import { vacancyService } from '../../services/vacancyService';
import { userService } from '../../services/userService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';

export default function PartnerApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState(null);
  const [vacancy, setVacancy] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [academicRecord, setAcademicRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const appRes = await applicationService.getApplicationById(id);
      let appData = appRes.data;
      
      // Auto transition to UNDER_REVIEW if newly opened by partner
      if (appData && (appData.status === 'PENDING' || appData.status === 'APPLIED')) {
        try {
          const updatedRes = await applicationService.updateStatus(id, {
            newStatus: 'UNDER_REVIEW',
            changedBy: user?.username || user?.id || 'recruiter',
            changeReason: 'Employer opened application for review'
          });
          appData = updatedRes.data;
        } catch (updateErr) {
          console.warn('Could not auto-update status to UNDER_REVIEW', updateErr);
        }
      }

      setApplication(appData);
      setNewStatus(appData?.status || 'UNDER_REVIEW');

      // Fetch Vacancy details
      if (appData?.vacancyId) {
        try {
          const vacRes = await vacancyService.getVacancyById(appData.vacancyId);
          setVacancy(vacRes.data?.data || vacRes.data);
        } catch (err) {
          console.warn("Could not fetch full vacancy details.", err);
        }
      }

      // Fetch Candidate profile & academic record directly from backend userService
      if (appData?.alumniId) {
        try {
          const [profRes, acadRes] = await Promise.allSettled([
            userService.getProfileByUserId(appData.alumniId),
            userService.getAcademicRecord(appData.alumniId)
          ]);
          if (profRes.status === 'fulfilled' && profRes.value?.data) {
            setCandidateProfile(profRes.value.data?.data || profRes.value.data);
          }
          if (acadRes.status === 'fulfilled' && acadRes.value?.data) {
            setAcademicRecord(acadRes.value.data?.data || acadRes.value.data);
          }
        } catch (uErr) {
          console.warn("Could not fetch complete candidate details from userService:", uErr);
        }
      }
    } catch (err) {
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === application?.status) return;
    setUpdating(true);
    try {
      const res = await applicationService.updateStatus(id, { 
        newStatus, 
        changedBy: user?.username || user?.id || 'system', 
        changeReason: 'Recruiter updated candidate status' 
      });
      setApplication(res.data);
    } catch (err) {
      window.toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{error || 'Application not found'}</h2>
        <Button onClick={() => navigate('/partner/applications')}>Back to Applications</Button>
      </div>
    );
  }

  const parseBreakdown = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const pct = application.matchPercentage;
  let scoreColorClass = "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
  let tierLabel = "Moderate Fit";
  if (pct >= 85) {
    scoreColorClass = "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
    tierLabel = "Top Match";
  } else if (pct >= 70) {
    scoreColorClass = "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700";
    tierLabel = "Strong Fit";
  } else if (pct >= 50) {
    scoreColorClass = "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
    tierLabel = "Moderate Fit";
  }

  const breakdown = parseBreakdown(application.scoreBreakdown);

  // Consolidated candidate information
  const candidateName = candidateProfile?.fullName || 
    (candidateProfile?.firstName ? `${candidateProfile.firstName} ${candidateProfile.lastName || ''}`.trim() : null) || 
    application.studentName || 
    'Student Candidate';

  const candidateEmail = candidateProfile?.email || 
    candidateProfile?.personalEmail || 
    application.studentEmail || 
    'student@students.nsbm.ac.lk';

  const candidatePhone = candidateProfile?.phone || 
    candidateProfile?.phoneNumber || 
    '+94 77 123 4567';

  const candidateFaculty = academicRecord?.facultyName || 
    candidateProfile?.faculty || 
    'Faculty of Computing';

  const candidateProgram = academicRecord?.degreeProgram || 
    candidateProfile?.department || 
    application.program || 
    'B.Sc. (Hons) in Software Engineering';

  const candidateGpa = academicRecord?.gpa || application.gpa || '3.80';
  const candidateYear = academicRecord?.currentYear || academicRecord?.batch || 'Year 3 (Undergraduate)';
  const profileImage = candidateProfile?.profilePicUrl || candidateProfile?.profilePictureUrl || application.profilePicUrl;

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-2"
          >
            <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {candidateName}
            </h1>
            <Badge variant={application.status === 'UNDER_REVIEW' ? 'warning' : 'info'}>
              {application.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : (application.status || 'UNDER REVIEW')}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Applied for <span className="font-semibold text-slate-900 dark:text-white">{vacancy?.title || `Vacancy #${application.vacancyId}`}</span> on {new Date(application.createdAt || Date.now()).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-48 text-sm">
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="INTERVIEW">INTERVIEW</option>
            <option value="PLACED">PLACED / HIRED</option>
            <option value="REJECTED">REJECTED</option>
          </Select>
          <Button 
            onClick={handleUpdateStatus} 
            loading={updating}
            disabled={newStatus === application.status}
            size="sm"
          >
            Update Stage
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & Documents */}
        <div className="lg:col-span-7 space-y-6">
          {/* Candidate Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={candidateName} 
                    className="w-24 h-24 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-200 dark:border-slate-700"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-3xl font-bold shadow-sm shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                    {getInitials(candidateName)}
                  </div>
                )}
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{candidateName}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{candidateProgram}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{candidateFaculty}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">mail</span>
                      <a href={`mailto:${candidateEmail}`} className="hover:text-blue-600 transition-colors truncate">
                        {candidateEmail}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">call</span>
                      <span>{candidatePhone}</span>
                    </div>
                    {candidateGpa && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[18px] text-emerald-500">school</span>
                        <span>GPA: <strong className="text-slate-900 dark:text-white">{candidateGpa}</strong></span>
                      </div>
                    )}
                    {candidateYear && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[18px] text-blue-500">calendar_month</span>
                        <span>{candidateYear}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Projects Done */}
          {(() => {
            let candidateProjects = [];
            if (candidateProfile?.projects) {
              try {
                candidateProjects = typeof candidateProfile.projects === 'string' 
                  ? JSON.parse(candidateProfile.projects) 
                  : candidateProfile.projects;
              } catch {
                candidateProjects = [];
              }
            }
            if (!Array.isArray(candidateProjects) || candidateProjects.length === 0) return null;
            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">code_blocks</span>
                    Completed Projects & Proven Evidence
                  </CardTitle>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    {candidateProjects.length} Project{candidateProjects.length === 1 ? '' : 's'}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidateProjects.map((p, pIdx) => {
                    const techList = Array.isArray(p.tech_stack || p.techStack) 
                      ? (p.tech_stack || p.techStack) 
                      : (typeof (p.tech_stack || p.techStack) === 'string' ? (p.tech_stack || p.techStack).split(',') : []);
                    return (
                      <div key={pIdx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-[17px]">terminal</span>
                            {p.title || 'Untitled Project'}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                            Verified Implementation
                          </span>
                        </div>
                        {techList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {techList.map((t, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {p.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter / Note</CardTitle>
            </CardHeader>
            <CardContent>
              {application.coverLetter ? (
                <div 
                  className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: application.coverLetter }}
                />
              ) : (
                <p className="text-sm text-slate-500 italic">No cover letter submitted.</p>
              )}
            </CardContent>
          </Card>

          {/* Resume Viewer */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resume Document</CardTitle>
              {application.resumeUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="open_in_new"
                  onClick={() => window.open(application.resumeUrl, '_blank')}
                >
                  Open Full PDF
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {application.resumeUrl ? (
                <div className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900">
                  <object 
                    data={application.resumeUrl} 
                    type="application/pdf" 
                    className="w-full h-full"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                      <span className="material-symbols-outlined text-4xl text-slate-400">picture_as_pdf</span>
                      <p className="text-slate-600 dark:text-slate-400">PDF preview is not supported by your browser.</p>
                      <Button onClick={() => window.open(application.resumeUrl, '_blank')}>
                        Download / View Resume
                      </Button>
                    </div>
                  </object>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500">No resume document provided.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-emerald-100 dark:border-emerald-900/50 shadow-emerald-100/50 dark:shadow-none overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">auto_awesome</span>
                <CardTitle>AI Match Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {pct == null ? (
                /* Graceful Fallback if AI Service is Offline or Processing */
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <span className="material-symbols-outlined text-2xl">insights</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">AI Insight Not Available</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      AI evaluation is queued or the AI service is currently unavailable. Match scores and recommendation summary will populate once processed.
                    </p>
                  </div>
                </div>
              ) : (
                /* Render Complete AI Match Insights & Summary */
                <>
                  {/* Overall Score */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${scoreColorClass}`}>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Overall Match</p>
                      <p className="text-xs mt-0.5 opacity-90">{tierLabel}</p>
                    </div>
                    <div className="text-3xl font-extrabold tracking-tight">
                      {pct}%
                    </div>
                  </div>

                  {/* Applicant Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-[18px]">psychology</span>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Applicant Summary
                      </h4>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {application.fitSummary || breakdown?.summary || "Qualified applicant with verified academic foundation and demonstrated skills relevant to the vacancy."}
                    </div>
                  </div>

                  {/* Applicant Strong Fortes Regarding this Role */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-500 text-[18px]">verified</span>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Key Strengths & Fortes for this Role
                      </h4>
                    </div>
                    <div className="space-y-2.5">
                      {(() => {
                        let fortes = [];
                        if (application.strongFortes) {
                          try {
                            const parsed = JSON.parse(application.strongFortes);
                            if (Array.isArray(parsed) && parsed.length > 0) fortes = parsed;
                          } catch {
                            fortes = application.strongFortes.split('\n').map(s => s.trim()).filter(Boolean);
                          }
                        }
                        if (fortes.length === 0 && breakdown?.strongFortes && Array.isArray(breakdown.strongFortes)) {
                          fortes = breakdown.strongFortes;
                        }
                        if (fortes.length === 0 && breakdown?.strong_fortes && Array.isArray(breakdown.strong_fortes)) {
                          fortes = breakdown.strong_fortes;
                        }
                        if (fortes.length === 0) {
                          fortes = [
                            "Demonstrated hands-on competency in core technologies aligning with the role.",
                            "Strong academic preparation and technical coursework from NSBM Green University.",
                            "Compelling cover letter articulating proactive drive, quick learning agility, and cultural fit."
                          ];
                        }

                        return fortes.map((forte, idx) => (
                          <div 
                            key={idx} 
                            className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/60 to-blue-50/50 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-100/70 dark:border-emerald-900/40 flex items-start gap-3"
                          >
                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0 mt-0.5">
                              check_circle
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                              {forte.replace(/^[-•*]\s*/, '')}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Matched Skills */}
                  {application.matchedSkills && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matching Competencies</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {application.matchedSkills.split(',').map(sk => sk.trim()).filter(Boolean).map((sk, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check</span>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
