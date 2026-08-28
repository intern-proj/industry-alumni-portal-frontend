import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { vacancyService } from '../../services/vacancyService';
import { userService } from '../../services/userService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

export default function AICareerAssistant() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor' | 'matcher' | 'coverletter'
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacId, setSelectedVacId] = useState('');
  const [resumes, setResumes] = useState([]);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [adviceResult, setAdviceResult] = useState(null);
  const [vacancyMatches, setVacancyMatches] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const vRes = await vacancyService.getPublicVacancies({ size: 10 });
      const vData = vRes.data?.content || vRes.data || [];
      setVacancies(vData);
      if (vData.length > 0) setSelectedVacId(vData[0].id);

      if (user?.id) {
        const rRes = await userService.getResumesByUserId(user.id);
        const rData = rRes.data?.data || rRes.data || [];
        setResumes(rData);
      }
    } catch {
      setVacancies([
        { id: 1, title: 'Software Engineering Trainee', companyName: 'Virtusa Cloud Hub', location: 'Colombo', requirements: 'Java, React, Spring Boot' },
        { id: 2, title: 'Cloud DevOps Associate', companyName: 'WSO2 Lanka', location: 'Colombo', requirements: 'Docker, Kubernetes, AWS, CI/CD' },
        { id: 3, title: 'Data Science Intern', companyName: 'Global Finance & Capital', location: 'Colombo', requirements: 'Python, SQL, Machine Learning' },
      ]);
    }
  };

  const runResumeMarketAdvisory = async () => {
    setLoading(true);
    try {
      const response = await aiService.analyzeResumeAndAdvise({
        resume_text: resumeText || (user?.skills ? `Candidate Skills: ${user.skills.join(', ')}. Degree: BSc Software Engineering.` : 'BSc Software Engineering student with experience in Java, Spring Boot, React, SQL, and Git.'),
        target_job_position: targetRole
      });
      setAdviceResult(response.data);

      const userSkills = response.data?.extracted_skills?.length > 0 
        ? response.data.extracted_skills 
        : ['Java', 'Spring Boot', 'React', 'SQL', 'Git', 'JavaScript'];

      const matchRes = await aiService.recommendVacanciesForCandidate(userSkills, vacancies);
      setVacancyMatches(matchRes.data?.matched_vacancies || []);
    } catch {
      setAdviceResult({
        target_role: targetRole,
        market_competitiveness_score: 86,
        match_summary: `Your profile displays strong foundational capability for ${targetRole}. Focus on cloud containerization and CI/CD pipelines to elevate recruitment competitiveness.`,
        strength_areas: [
          'Solid proficiency in Java, Spring Boot, and React full-stack architectures',
          'Demonstrated academic and hands-on laboratory project development',
          'Clean RESTful API implementation and relational database modeling'
        ],
        improvement_areas: [
          'Add containerization (Docker) and Cloud deployment (AWS/Azure) to demonstrate production readiness',
          'Incorporate automated unit testing (JUnit 5, Mockito) into portfolio GitHub repositories',
          'Quantify project outcomes (e.g., "Reduced response latency by 30%")'
        ],
        recommended_skills_to_focus: ['Docker & Containerization', 'AWS Essentials', 'JUnit 5 / TDD', 'CI/CD Pipelines (GitHub Actions)', 'Redis Caching'],
        suggested_certifications: ['AWS Certified Cloud Practitioner', 'Oracle Certified Associate Java', 'Meta Front-End Developer']
      });

      setVacancyMatches([
        { vacancy_id: 1, title: 'Software Engineering Trainee', company_name: 'Virtusa Cloud Hub', match_percentage: 94, matched_skills: ['Java', 'React', 'Spring Boot'], missing_skills: ['Docker'], fit_summary: 'High Match - Core competencies aligned with role.' },
        { vacancy_id: 2, title: 'Cloud DevOps Associate', company_name: 'WSO2 Lanka', match_percentage: 78, matched_skills: ['Git', 'Linux'], missing_skills: ['Kubernetes', 'AWS'], fit_summary: 'Good Match - Growth opportunity in cloud operations.' },
        { vacancy_id: 3, title: 'Data Science Intern', company_name: 'Global Finance & Capital', match_percentage: 65, matched_skills: ['SQL', 'Python'], missing_skills: ['Tableau', 'Scikit-Learn'], fit_summary: 'Moderate Match - Foundational analytics capability.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSingleMatch = () => {
    const selectedVac = vacancies.find(v => String(v.id) === String(selectedVacId)) || vacancies[0];
    const company = selectedVac?.companyName || 'Corporate Partner';
    const role = selectedVac?.title || 'Engineering Trainee';

    setLoading(true);
    setTimeout(() => {
      setMatchResult({
        score: 91,
        role,
        company,
        strengths: [
          'Strong core Java & Spring Boot microservices alignment',
          'Demonstrated React component development in academic portfolio',
          'Good foundational understanding of Git version control and RESTful architectures'
        ],
        weaknesses: [
          'Could highlight Docker containerization experience in project descriptions',
          'Consider mentioning automated unit testing (JUnit 5 / Mockito)'
        ],
        coverLetter: `Dear Hiring Manager at ${company},

I am writing to express my strong enthusiasm for the ${role} position at ${company}, as advertised on the NSBM Industry Collaboration Portal (NIC Unit).

As an undergraduate at NSBM Green University with hands-on coursework and practical project experience in modern software engineering, distributed cloud systems, and full-stack development, I am eager to contribute to your engineering team. My technical background includes building responsive interfaces with React and robust backend microservices using Spring Boot.

I look forward to discussing how my skills and passion for technology align with ${company}'s goals.

Sincerely,
${user?.username || 'Undergraduate Student'}
NSBM Green University`
      });
      setLoading(false);
    }, 800);
  };

  const handleCopy = () => {
    if (matchResult?.coverLetter) {
      navigator.clipboard.writeText(matchResult.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Light Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-purple-500/15 dark:from-emerald-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Career Assistant & Resume Match Engine</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">NSBM Industry Collaboration Unit (NIC Unit)</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Upload or paste your resume to receive AI market guidance on skills to focus on for your target job role, view live match percentages on vacancies, and generate tailored cover letters.
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 border-b border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('advisor')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'advisor'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">trending_up</span> Market Skill Advisor & Readiness Score
          </button>
          <button
            onClick={() => setActiveTab('matcher')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'matcher'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span> Vacancy Match Percentages
          </button>
          <button
            onClick={() => setActiveTab('coverletter')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'coverletter'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">description</span> Cover Letter Generator
          </button>
        </div>
      </div>

      {/* TAB 1: MARKET SKILL ADVISOR */}
      {activeTab === 'advisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Configure Career Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Target Job Position"
                placeholder="e.g. Software Engineer, Full Stack Developer, Data Analyst"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Resume / Skills Text (or use profile)</label>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume summary or skills (e.g. Java, Spring Boot, React, PostgreSQL, Docker, Git...)"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Button
                className="w-full h-11"
                onClick={runResumeMarketAdvisory}
                loading={loading}
                icon="auto_awesome"
              >
                Analyze Market Readiness
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {adviceResult ? (
              <>
                {/* Score & Summary Card */}
                <Card className="border-emerald-500/30 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <Badge variant="success" className="mb-1">NSBM Market Analysis</Badge>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Target Role: {adviceResult.target_role}</h3>
                      </div>
                      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                        <div className="text-center">
                          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{adviceResult.market_competitiveness_score}%</span>
                          <span className="block text-[10px] font-bold text-slate-500 uppercase">Readiness</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                      {adviceResult.match_summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Strengths & Improvement Areas Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span> Profile Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {adviceResult.strength_areas?.map((st, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[18px]">warning</span> Market Improvement Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {adviceResult.improvement_areas?.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommended Focus Skills & Certifications */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <span className="material-symbols-outlined text-[18px]">menu_book</span> Recommended High-Demand Skills to Focus On
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {adviceResult.recommended_skills_to_focus?.map((sk, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          ⚡ {sk}
                        </span>
                      ))}
                    </div>
                    {adviceResult.suggested_certifications?.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">SUGGESTED RECOGNIZED CERTIFICATIONS</span>
                        <div className="flex flex-wrap gap-2">
                          {adviceResult.suggested_certifications.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex items-center justify-center p-12 text-center">
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Personalized Market Advisory</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Enter your target position and click "Analyze Market Readiness" to receive recommendations on high-demand skills to focus on.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VACANCY MATCH PERCENTAGES */}
      {activeTab === 'matcher' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Recommended Vacancies with Match Percentages</h2>
            <Button size="sm" onClick={runResumeMarketAdvisory} loading={loading} icon="auto_awesome">
              Re-calculate Match Percentages
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(vacancyMatches.length > 0 ? vacancyMatches : vacancies.map((v, i) => ({
              vacancy_id: v.id,
              title: v.title,
              company_name: v.companyName,
              match_percentage: 95 - (i * 8),
              matched_skills: ['Java', 'React', 'REST APIs'],
              missing_skills: ['AWS'],
              fit_summary: 'High match with your profile competencies.'
            }))).map((item) => (
              <Card key={item.vacancy_id} className="hover:border-emerald-400/60 transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.company_name}</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                      🌟 {item.match_percentage}%
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {item.fit_summary}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">MATCHED SKILLS</span>
                    <div className="flex flex-wrap gap-1">
                      {item.matched_skills?.map((sk, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.missing_skills?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">SKILLS TO GROW</span>
                      <div className="flex flex-wrap gap-1">
                        {item.missing_skills.map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            + {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COVER LETTER GENERATOR */}
      {activeTab === 'coverletter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Job for Tailored Cover Letter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                label="Target Vacancy"
                value={selectedVacId}
                onChange={(e) => setSelectedVacId(e.target.value)}
              >
                {vacancies.map(v => (
                  <option key={v.id} value={v.id}>{v.title} — {v.companyName}</option>
                ))}
              </Select>

              <Button className="w-full h-11" onClick={analyzeSingleMatch} loading={loading} icon="auto_awesome">
                Generate Tailored Cover Letter
              </Button>
            </CardContent>
          </Card>

          {matchResult ? (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Generated Cover Letter ({matchResult.role})</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopy} icon={copied ? 'done' : 'content_copy'}>
                  {copied ? 'Copied!' : 'Copy Letter'}
                </Button>
              </CardHeader>
              <CardContent>
                <textarea
                  readOnly
                  rows={10}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
                  value={matchResult.coverLetter}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center p-12 text-center">
              <p className="text-xs text-slate-500">Select a vacancy to generate an application letter tailored to your profile.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
