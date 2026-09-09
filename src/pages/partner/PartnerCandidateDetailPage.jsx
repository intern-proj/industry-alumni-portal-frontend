import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { userService } from '../../services/userService';
import { aiService } from '../../services/aiService';

export default function PartnerCandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [candidate, setCandidate] = useState(null);
  const [academicRecord, setAcademicRecord] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewPdf, setPreviewPdf] = useState(false);

  // Real LLM AI Summary state
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadCandidateFullProfile();
  }, [id]);

  const loadCandidateFullProfile = async () => {
    setLoading(true);
    try {
      const [profRes, acadRes, skillRes, resumeRes] = await Promise.allSettled([
        userService.getProfileByUserId(id),
        userService.getAcademicRecord(id),
        userService.getSkillsByUserId(id),
        userService.getResumesByUserId(id),
      ]);

      // 1. User Profile from DB
      let candidateProfile = null;
      if (profRes.status === 'fulfilled' && profRes.value?.data?.data) {
        candidateProfile = profRes.value.data.data;
      } else if (location.state?.candidate) {
        candidateProfile = location.state.candidate;
      }

      let parsedCandidate = null;
      if (candidateProfile) {
        const cleanLast = (candidateProfile.lastName && candidateProfile.lastName.toLowerCase() !== 'candidate')
          ? candidateProfile.lastName
          : '';
        const fullName = candidateProfile.fullName || `${candidateProfile.firstName || ''} ${cleanLast}`.trim() || candidateProfile.name || candidateProfile.username || '';

        parsedCandidate = {
          ...candidateProfile,
          fullName,
          email: candidateProfile.email || candidateProfile.personalEmail || '',
          phone: candidateProfile.phone || candidateProfile.phoneNumber || '',
          bio: candidateProfile.bio || '',
          profilePicUrl: candidateProfile.profilePicUrl || location.state?.candidate?.profilePicUrl || null,
          isActivelyLooking: candidateProfile.isActivelyLooking === true,
        };
        setCandidate(parsedCandidate);
      }

      // 2. Academic Record from DB (strictly no hardcoded fallbacks)
      let parsedAcad = null;
      if (acadRes.status === 'fulfilled' && acadRes.value?.data?.data) {
        parsedAcad = acadRes.value.data.data;
        setAcademicRecord(parsedAcad);
      } else if (location.state?.candidate?.academicRecord) {
        parsedAcad = location.state.candidate.academicRecord;
        setAcademicRecord(parsedAcad);
      } else {
        setAcademicRecord(null);
      }

      // 3. Skills from DB
      let parsedSkills = [];
      if (skillRes.status === 'fulfilled' && Array.isArray(skillRes.value?.data?.data)) {
        parsedSkills = skillRes.value.data.data;
        setSkills(parsedSkills);
      } else if (Array.isArray(candidateProfile?.skills)) {
        parsedSkills = candidateProfile.skills.map((s) => (typeof s === 'string' ? { skillName: s } : s));
        setSkills(parsedSkills);
      } else {
        setSkills([]);
      }

      // 4. Resumes: ONLY the Primary Resume from DB
      if (resumeRes.status === 'fulfilled' && Array.isArray(resumeRes.value?.data?.data)) {
        const list = resumeRes.value.data.data;
        const primary = list.find((r) => r.isPrimary) || list[0] || null;
        setPrimaryResume(primary);
      } else {
        setPrimaryResume(null);
      }

      // 5. Projects Done
      let parsedProjects = [];
      if (candidateProfile?.projects) {
        try {
          parsedProjects = typeof candidateProfile.projects === 'string'
            ? JSON.parse(candidateProfile.projects)
            : candidateProfile.projects;
        } catch {
          parsedProjects = [];
        }
      }
      setProjects(Array.isArray(parsedProjects) ? parsedProjects : []);

      // 6. Trigger Real LLM Candidate Summary via AI Service
      if (parsedCandidate) {
        fetchRealAISummary(parsedCandidate, parsedAcad, parsedSkills, parsedProjects);
      }
    } catch (err) {
      console.error('Failed to load candidate details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealAISummary = async (cand, acad, skList, projList = []) => {
    setAiLoading(true);
    try {
      const skillsArray = Array.isArray(skList)
        ? skList.map((s) => (typeof s === 'string' ? s : (s.skillName || s.name))).filter(Boolean)
        : [];

      const payload = {
        user_id: id,
        candidate_name: cand.fullName || '',
        degree_program: acad?.degreeProgram || '',
        faculty: acad?.faculty || '',
        gpa: acad?.gpa ? parseFloat(acad.gpa) : null,
        skills: skillsArray,
        bio: cand.bio || '',
        projects: projList,
      };

      const res = await aiService.generateCandidateSummary(payload);
      if (res.data?.summary) {
        setAiSummary(res.data.summary);
      }
    } catch (err) {
      console.warn('Real LLM candidate summary generation failed:', err);
      // If AI service is busy or unreachable, keep blank or minimal fallback
      setAiSummary('');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[36px]">person_off</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Candidate Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested student profile could not be loaded. Please return to the Talent Discovery page.
        </p>
        <Button onClick={() => navigate('/partner/talent-search')} icon="arrow_back">
          Back to Talent Discovery
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/partner/talent-search')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Talent Discovery
      </button>

      {/* Hero Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-purple-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-emerald-500/20 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar */}
            {candidate.profilePicUrl ? (
              <img
                src={candidate.profilePicUrl}
                alt={candidate.fullName}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500/30 shadow-md shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                {candidate.fullName ? candidate.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : ''}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {candidate.fullName}
                </h1>
                {candidate.isActivelyLooking && (
                  <Badge variant="success" className="text-xs px-2.5 py-0.5">
                    Actively Seeking Opportunities
                  </Badge>
                )}
              </div>

              {academicRecord?.degreeProgram && (
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {academicRecord.degreeProgram}
                </p>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {academicRecord?.faculty && <span>{academicRecord.faculty}</span>}
                {academicRecord?.gpa && <span>• Cumulative GPA: {academicRecord.gpa}</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            {primaryResume?.fileUrl && (
              <a href={primaryResume.fileUrl} target="_blank" rel="noreferrer">
                <Button size="sm" icon="download" className="text-xs">
                  Download Primary CV
                </Button>
              </a>
            )}
            {candidate.email && (
              <a href={`mailto:${candidate.email}`}>
                <Button size="sm" variant="outline" icon="mail" className="text-xs">
                  Contact Candidate
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: AI Summary, Academic Record & Primary Resume */}
        <div className="lg:col-span-2 space-y-8">
          {/* Real AI Candidate Executive Summary (Generated via LLM) */}
          <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <span className="material-symbols-outlined text-emerald-500">auto_awesome</span>
                  AI Candidate Executive Summary
                </CardTitle>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Neural LLM Synthesis
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {aiLoading ? (
                <div className="space-y-2 py-2 animate-pulse">
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Synthesizing real-time candidate executive summary via AI Engine...
                  </div>
                  <div className="h-3.5 bg-emerald-200/50 dark:bg-emerald-900/40 rounded w-full" />
                  <div className="h-3.5 bg-emerald-200/50 dark:bg-emerald-900/40 rounded w-5/6" />
                  <div className="h-3.5 bg-emerald-200/50 dark:bg-emerald-900/40 rounded w-4/6" />
                </div>
              ) : aiSummary ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {aiSummary}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  AI executive profile summary could not be synthesized at this time.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Academic Performance Card (Strictly fetched from DB, blanks if not present) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">school</span>
                Academic Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {academicRecord ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Degree Program</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {academicRecord.degreeProgram || ''}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty & Department</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {[academicRecord.faculty, academicRecord.department].filter(Boolean).join(' • ') || ''}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative GPA</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {academicRecord.gpa || ''}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Stage & Batch</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {[
                        academicRecord.year,
                        academicRecord.semester,
                        academicRecord.batch ? `Batch ${academicRecord.batch}` : ''
                      ].filter(Boolean).join(', ') || ''}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  No official academic records have been published by the student.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Completed Projects & Evidence Section */}
          {projects && projects.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">code_blocks</span>
                    Completed Projects & Implementation Evidence
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified technical implementations extracted from the candidate's primary resume.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  {projects.length} Project{projects.length === 1 ? '' : 's'}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {projects.map((proj, pIdx) => {
                    const techList = Array.isArray(proj.tech_stack || proj.techStack) 
                      ? (proj.tech_stack || proj.techStack) 
                      : (typeof (proj.tech_stack || proj.techStack) === 'string' ? (proj.tech_stack || proj.techStack).split(',') : []);
                    return (
                      <div 
                        key={pIdx} 
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">terminal</span>
                            {proj.title || 'Untitled Project'}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                            Verified Implementation
                          </span>
                        </div>

                        {techList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {techList.map((t, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold"
                              >
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {proj.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary Resume Section (ONLY Primary Resume is Visible) */}
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">description</span>
                  Primary Verified Resume
                </CardTitle>
                {primaryResume && (
                  <Badge variant="success" className="text-[10px]">
                    Verified Primary CV
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {primaryResume ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {primaryResume.title || primaryResume.fileName || ''}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {[primaryResume.fileName, primaryResume.fileSize].filter(Boolean).join(' • ')}
                        </p>
                        {primaryResume.targetRole && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Target Role: {primaryResume.targetRole}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        icon={previewPdf ? 'visibility_off' : 'visibility'}
                        onClick={() => setPreviewPdf(!previewPdf)}
                      >
                        {previewPdf ? 'Hide Preview' : 'Preview CV'}
                      </Button>
                      <a href={primaryResume.fileUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" icon="download" className="text-xs">
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Inline PDF Preview */}
                  {previewPdf && primaryResume.fileUrl && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-900">
                      <iframe
                        src={primaryResume.fileUrl}
                        title="Primary Resume Preview"
                        className="w-full h-[600px] border-none"
                      />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Institutional Privacy Note: Only the student's designated primary resume is accessible to partner organizations.
                  </p>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-slate-400">file_copy_off</span>
                  <p className="text-xs text-slate-500">The candidate has not yet published a primary resume.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Skills & Contact Info */}
        <div className="space-y-6">
          {/* Verified Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">psychology</span>
                Verified Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No explicit skills listed.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, idx) => {
                    const skillName = typeof s === 'string' ? s : (s.skillName || s.name);
                    const skillLevel = typeof s === 'object' ? s.skillLevel : null;
                    if (!skillName) return null;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {skillName}
                        {skillLevel && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                            ({skillLevel})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Details (strictly from DB, blank if not present) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">contact_page</span>
                Candidate Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {candidate.email && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Institutional Email</p>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold break-all">{candidate.email}</p>
                </div>
              )}

              {candidate.phone && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone</p>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">{candidate.phone}</p>
                </div>
              )}

              {candidate.bio && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Bio</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{candidate.bio}</p>
                </div>
              )}

              {candidate.email && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a href={`mailto:${candidate.email}?subject=Opportunity%20Inquiry%20from%20NSBM%20Partner`}>
                    <Button className="w-full text-xs" icon="mail">
                      Send Direct Message / Offer
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
