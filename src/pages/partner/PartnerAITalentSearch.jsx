import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { userService } from '../../services/userService';
import { aiService } from '../../services/aiService';

export default function PartnerAITalentSearch() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [candidatePool, setCandidatePool] = useState([]);
  const [query, setQuery] = useState('');

  const mapCandidate = (u, i) => {
    const cleanLast = (u.lastName && u.lastName.toLowerCase() !== 'candidate') ? u.lastName : '';
    const candidateName = `${u.firstName || ''} ${cleanLast}`.trim() || u.username || '';
    let parsedProjects = [];
    if (u.projects) {
      try {
        parsedProjects = typeof u.projects === 'string' ? JSON.parse(u.projects) : u.projects;
      } catch {
        parsedProjects = [];
      }
    }
    return {
      id: u.userId || u.id || `usr-${i}`,
      userId: u.userId || u.id,
      name: candidateName,
      match: Math.max(75, 96 - i * 4),
      skills: u.skills?.map(s => typeof s === 'string' ? s : (s.skillName || s.name)) || [],
      projects: Array.isArray(parsedProjects) ? parsedProjects : [],
      program: u.academicRecord?.degreeProgram || u.degreeProgram || '',
      faculty: u.academicRecord?.faculty || u.faculty || '',
      gpa: u.academicRecord?.gpa || u.gpa || '',
      profilePicUrl: u.profilePicUrl || null,
      isActivelyLooking: u.isActivelyLooking === true
    };
  };

  useEffect(() => {
    fetchInitialTalent();
  }, []);

  const fetchInitialTalent = async () => {
    setLoading(true);
    try {
      const res = await userService.searchUsersBySkills(['Java', 'React', 'Docker', 'Python', 'Spring Boot', 'TypeScript', 'Node.js', 'Git']);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapCandidate);
        setResults(mapped);
        setCandidatePool(mapped);
      } else {
        setResults([]);
        setCandidatePool([]);
      }
    } catch {
      setResults([]);
      setCandidatePool([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchTerm, isAiMode) => {
    setQuery(searchTerm);
    const trimmed = (searchTerm || '').trim();
    if (!trimmed) {
      setResults(candidatePool);
      return;
    }
    setLoading(true);

    try {
      if (isAiMode) {
        // AI NLP Semantic Search Mode
        let pool = candidatePool.length > 0 ? candidatePool : results;
        if (pool.length === 0) {
          const res = await userService.searchUsersBySkills(['Java', 'React', 'Docker', 'Python']);
          const raw = res.data?.data || res.data || [];
          pool = Array.isArray(raw) ? raw.map(mapCandidate) : [];
          setCandidatePool(pool);
        }

        if (pool.length > 0) {
          const res = await aiService.smartSearchCandidates(trimmed, pool);
          const searchResults = res.data?.results || [];
          if (searchResults.length > 0) {
            setResults(searchResults.map(r => ({
              ...r.item,
              match: r.match_score,
              reasons: r.highlight_reasons
            })));
          } else {
            setResults([]);
          }
        } else {
          setResults([]);
        }
      } else {
        // Standard keyword search
        const qLower = trimmed.toLowerCase();
        const clientMatches = candidatePool.filter(c =>
          c.name.toLowerCase().includes(qLower) ||
          c.program.toLowerCase().includes(qLower) ||
          c.faculty.toLowerCase().includes(qLower) ||
          c.skills.some(s => s.toLowerCase().includes(qLower))
        );

        if (clientMatches.length > 0) {
          setResults(clientMatches);
        } else {
          // Try backend skills search
          const skillsArray = trimmed.split(/[\s,]+/).filter(s => s.length > 1);
          const res = await userService.searchUsersBySkills(skillsArray).catch(() => null);
          const data = res?.data?.data || res?.data || [];
          if (Array.isArray(data) && data.length > 0) {
            setResults(data.map(mapCandidate));
          } else {
            setResults([]);
          }
        }
      }
    } catch (err) {
      console.error('Talent search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (candidateId) => {
    setInvitedMap(prev => ({ ...prev, [candidateId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Sleek Compact AI Hero Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-purple-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-purple-950/30 border border-emerald-500/20 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">AI Talent Discovery & Candidate Search</h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">NSBM Active Candidate Skill Graph</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl mb-4 leading-normal">
          Toggle <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">auto_awesome</span> Intelligent Matching</span> to search candidates using natural language across verified skills, projects, and academic background.
        </p>

        {/* Dynamic Running Border AI Search Bar */}
        <div className="max-w-3xl">
          <SmartAISearchBar
            value={query}
            onSearch={handleSearch}
            onChange={(val, isAi) => isAi ? null : handleSearch(val, false)}
            placeholder="Search candidates by skill, name, or program..."
            aiPlaceholder="Smart AI candidate search (e.g. software engineer with React and Spring Boot)..."
            searchType="candidates"
            loading={loading}
          />
        </div>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>AI Matchmaking Results ({results.length} Actively Seeking Candidates)</CardTitle>
          <Badge variant="success">
            Verified NSBM Talent
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Scanning student skill graph...</div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">person_search</span>
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Matching Candidates Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active students matched your search criteria. Try broadening your skill keywords or switching to AI natural language mode.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((candidate) => (
                <div key={candidate.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-4 cursor-pointer" onClick={() => navigate(`/partner/talent/${candidate.userId || candidate.id}`, { state: { candidate } })}>
                    <div className="relative shrink-0">
                      {candidate.profilePicUrl ? (
                        <img
                          src={candidate.profilePicUrl}
                          alt={candidate.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-base flex items-center justify-center shadow-sm">
                          {candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{candidate.name}</h4>
                        {candidate.isActivelyLooking && (
                          <Badge variant="success" className="text-[10px]">ACTIVELY SEEKING JOBS</Badge>
                        )}
                        {(candidate.match !== undefined && candidate.match !== null) ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                            {candidate.match}% Match
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                            {candidate.matchPercentage || (candidate.gpa ? Math.min(98, Math.round(Number(candidate.gpa) * 24)) : 90)}% Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {[candidate.program, candidate.gpa ? `GPA ${candidate.gpa}` : ''].filter(Boolean).join(' • ')}
                      </p>
                      
                      {candidate.reasons?.length > 0 ? (
                        <div className="space-y-0.5 pt-0.5">
                          {candidate.reasons.map((r, rIdx) => (
                            <p key={rIdx} className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
                              {r}
                            </p>
                          ))}
                        </div>
                      ) : candidate.projects?.length > 0 && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pt-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Verified Projects: </span>
                          {candidate.projects.slice(0, 2).map((p) => p.title).join(' • ')}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {candidate.skills?.map(skill => (
                          <Badge key={typeof skill === 'object' ? skill.skillName : skill} variant="neutral" className="text-[10px]">
                            {typeof skill === 'object' ? skill.skillName : skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                    <Button 
                      size="sm" 
                      variant="primary"
                      className="w-full text-xs font-semibold px-4 flex items-center justify-center gap-1.5" 
                      onClick={() => navigate(`/partner/talent/${candidate.userId || candidate.id}`, { state: { candidate } })}
                      icon="visibility"
                    >
                      See Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
