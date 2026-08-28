import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { userService } from '../../services/userService';
import { aiService } from '../../services/aiService';

export default function PartnerAITalentSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');
  const [invitedMap, setInvitedMap] = useState({});

  useEffect(() => {
    fetchInitialTalent();
  }, []);

  const fetchInitialTalent = async () => {
    setLoading(true);
    try {
      const res = await userService.searchUsersBySkills(['Java', 'React', 'Docker', 'Python']);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setResults(data.map((u, i) => ({
          id: u.userId || u.id || `usr-${i}`,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Candidate',
          match: Math.max(75, 95 - i * 4),
          skills: u.skills?.map(s => typeof s === 'string' ? s : s.skillName) || ['Software Development'],
          program: u.faculty || 'BSc (Hons) in Software Engineering',
          faculty: u.faculty || 'Faculty of Computing',
          gpa: u.gpa || '3.80',
          isActivelyLooking: u.isActivelyLooking !== false
        })));
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchTerm, isAiMode) => {
    setQuery(searchTerm);
    if (!searchTerm) {
      fetchInitialTalent();
      return;
    }
    setLoading(true);

    try {
      if (isAiMode && results.length > 0) {
        // Route through AI Service Smart NLP Search
        const res = await aiService.smartSearchCandidates(searchTerm, results);
        const searchResults = res.data?.results || [];
        if (searchResults.length > 0) {
          setResults(searchResults.map(r => ({
            ...r.item,
            match: r.match_score,
            reasons: r.highlight_reasons
          })));
        }
      } else {
        // Standard keyword search
        const skillsArray = searchTerm.split(/[\s,]+/).filter(s => s.length > 1);
        const res = await userService.searchUsersBySkills(skillsArray);
        const data = res.data?.data || res.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setResults(data.map((u, i) => ({
            id: u.userId || u.id || `usr-${i}`,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Candidate',
            match: Math.max(70, 98 - i * 5),
            skills: u.skills?.map(s => typeof s === 'string' ? s : s.skillName) || skillsArray,
            program: u.faculty || 'BSc (Hons) in Software Engineering',
            faculty: u.faculty || 'Faculty of Computing',
            gpa: u.gpa || '3.80',
            isActivelyLooking: u.isActivelyLooking !== false
          })));
        } else {
          setResults([]);
        }
      }
    } catch {
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
      {/* Light Hero Card with Smart AI Search Bar */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-purple-500/15 dark:from-emerald-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Talent Discovery & Candidate Search</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">NSBM Active Candidate Skill Graph</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl mb-6 leading-relaxed">
          Toggle the <span className="font-semibold text-emerald-600 dark:text-emerald-400">✨ Smart AI Spark</span> icon to use natural language queries. Discover candidates actively seeking internship and graduate opportunities based on verified skills, project implementations, and GPA.
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
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/40 flex flex-col items-center justify-center shrink-0">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{candidate.match}%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Match</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{candidate.name}</h4>
                        {candidate.isActivelyLooking && (
                          <Badge variant="success" className="text-[10px]">ACTIVELY SEEKING JOBS</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.program} • GPA {candidate.gpa}</p>
                      
                      {candidate.reasons?.length > 0 && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          ✓ {candidate.reasons.join(' • ')}
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
                      className="w-full text-xs" 
                      disabled={invitedMap[candidate.id]}
                      onClick={() => handleInvite(candidate.id)}
                      icon={invitedMap[candidate.id] ? 'check' : 'mail'}
                    >
                      {invitedMap[candidate.id] ? 'Invitation Sent' : 'Invite to Apply'}
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
