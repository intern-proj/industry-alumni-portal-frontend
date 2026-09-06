import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { platformService } from '../../services/platformService';
import { authService } from '../../services/authService';
import { vacancyService } from '../../services/vacancyService';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';

export default function StudentCompanies() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [universalSearchDirective, setUniversalSearchDirective] = useState(null);

  useEffect(() => {
    fetchApprovedPartners();
    if (location.state?.universalSearchQuery) {
      setSearchTerm(location.state.universalSearchQuery);
      // Clear the state so it doesn't persist on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchApprovedPartners = async () => {
    setLoading(true);
    try {
      const [dirRes, vacRes] = await Promise.allSettled([
        authService.getPartnerDirectory(),
        vacancyService.getPublicVacancies({ page: 0, size: 100 })
      ]);

      const dirList = dirRes.status === 'fulfilled' ? (dirRes.value?.data?.data || dirRes.value?.data || []) : [];
      let vacList = [];
      if (vacRes.status === 'fulfilled') {
        const rawVac = vacRes.value?.data?.data !== undefined ? vacRes.value.data.data : vacRes.value?.data;
        if (Array.isArray(rawVac)) vacList = rawVac;
        else if (Array.isArray(rawVac?.content)) vacList = rawVac.content;
      }

      const countVacancies = (p) => {
        const pName = (p.companyName || p.name || '').toLowerCase().trim();
        const pUser = (p.username || '').toLowerCase().trim();
        const pId = String(p.id || '').trim();
        return vacList.filter(v => {
          const vComp = (v.companyName || v.company_name || '').toLowerCase().trim();
          const vPart = String(v.partnerId || v.partner_id || '').toLowerCase().trim();
          return (pName && (vComp === pName || vComp.includes(pName) || pName.includes(vComp))) ||
                 (pUser && (vPart === pUser || vComp === pUser)) ||
                 (pId && vPart === pId);
        }).length;
      };

      if (Array.isArray(dirList) && dirList.length > 0) {
        setPartners(dirList.map(p => ({
          id: p.id,
          name: p.companyName || '',
          industry: p.companyIndustry || '',
          location: p.companyAddress || '',
          tier: p.accountStatus === 'ACTIVE' ? 'Verified Partner' : '',
          mouStatus: p.accountStatus === 'ACTIVE' ? 'Active Partner' : '',
          description: p.companyDescription || '',
          logoUrl: p.logoUrl || null,
          website: p.website || null,
          vacancyCount: countVacancies(p),
          tags: [p.companyIndustry].filter(Boolean)
        })));
        return;
      }

      // 2. Fallback: platform-management verification records
      const res = await platformService.getPartnerVerifications('APPROVED').catch(() => null);
      const data = res?.data?.content || res?.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setPartners(data.map(p => ({
          id: p.id,
          name: p.companyName || p.organizationName || '',
          industry: p.industry || '',
          location: p.address || '',
          tier: 'Verified Partner',
          mouStatus: 'Active Partner',
          description: p.notes || p.description || '',
          logoUrl: p.logoUrl || null,
          website: p.website || null,
          tags: p.tags ? (typeof p.tags === 'string' ? p.tags.split(',') : p.tags) : []
        })));
        return;
      } else {
        setPartners([]);
      }
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversalSearch = (response) => {
    setUniversalSearchDirective(response.directive);
    
    if (response.detected_domain === 'companies') {
      const results = response.results || [];
      if (results.length > 0) {
        setPartners(results.map(r => {
          const p = r.item;
          return {
            id: p.id,
            name: p.companyName || p.organizationName || 'Industry Partner',
            industry: p.industry || 'Industry & Technology',
            location: p.address || 'Sri Lanka',
            tier: 'Verified Partner',
            mouStatus: 'Active MoU',
            description: p.notes || p.description || 'Verified industrial partner collaborating with NSBM Green University.',
            tags: p.tags ? (typeof p.tags === 'string' ? p.tags.split(',') : p.tags) : ['Industry Collaboration'],
            matchScore: r.match_score,
            matchReasons: r.highlight_reasons
          };
        }));
      } else {
        setPartners([]);
      }
    }
  };

  const filteredPartners = partners.filter(p => {
    // Bypass local text search if we are currently displaying AI universal search results
    if (universalSearchDirective && universalSearchDirective.action === 'DISPLAY_RESULTS') {
      return industryFilter === 'ALL' || p.industry.toLowerCase().includes(industryFilter.toLowerCase());
    }

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = industryFilter === 'ALL' || p.industry.toLowerCase().includes(industryFilter.toLowerCase());
    return matchesSearch && matchesIndustry;
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
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Corporate Partners & Industry Directory</h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Verified NSBM Industry Network</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-normal">
          Toggle <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">auto_awesome</span> Intelligent Matching</span> to search corporate partners by industry, hiring technology, or placement opportunities.
        </p>

        {/* Dynamic Running Border AI Search Bar & Filter */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between pt-1">
          <div className="flex-1 w-full max-w-2xl">
            <SmartAISearchBar 
              placeholder="Search by company name, technology, or tag..."
              aiPlaceholder="Smart AI search by company, technology, or location..."
              value={searchTerm}
              onChange={(val) => { setSearchTerm(val); setUniversalSearchDirective(null); }}
              onSearch={(val) => setSearchTerm(val)}
              enableUniversalSearch={true}
              onUniversalSearch={handleUniversalSearch}
            />
          </div>

          <div className="relative w-full md:w-56 shrink-0">
            <select 
              value={industryFilter} 
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Industries</option>
              <option value="IT">IT & Software</option>
              <option value="Banking">Banking & Finance</option>
              <option value="Media">Media & Design</option>
              <option value="Cyber">Cybersecurity</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">Loading approved partner directory...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="p-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">domain_disabled</span>
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Corporate Partners Listed</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Approved partner organizations will appear here once faculty coordinators complete institutional verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPartners.map((partner) => (
            <Card
              key={partner.id}
              className="hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/student/companies/${partner.id}`)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="w-12 h-12 rounded-2xl object-contain border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                        {partner.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {partner.name}
                        </h3>
                        {partner.mouStatus && (
                          <Badge variant="success" className="text-[10px]">
                            {partner.mouStatus}
                          </Badge>
                        )}
                        <Badge variant="neutral" className="text-[10px] flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[12px]">work</span>
                          {partner.vacancyCount} {partner.vacancyCount === 1 ? 'Vacancy' : 'Vacancies'}
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{partner.industry}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {partner.location}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0">
                    {partner.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {partner.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {partner.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                      {tag}
                    </span>
                  ))}
                </div>

                {partner.matchScore && (
                  <div className="pt-2">
                    <div className="px-2.5 py-0.5 rounded-full w-max bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 mb-2">
                      <span className="material-symbols-outlined text-[14px] text-emerald-500">auto_awesome</span>
                      {partner.matchScore}% Match
                    </div>
                    {partner.matchReasons?.length > 0 && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check</span>
                        {partner.matchReasons.join(' • ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    Company Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                  <Link to="/student/vacancies">
                    <Button size="sm" variant="outline" className="text-xs">
                      View Vacancies
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
