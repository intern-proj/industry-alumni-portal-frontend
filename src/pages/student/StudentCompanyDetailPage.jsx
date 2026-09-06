import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { vacancyService } from '../../services/vacancyService';

export default function StudentCompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      let foundPartner = null;
      try {
        const res = await authService.getPartnerById(id);
        foundPartner = res.data;
      } catch {
        const dirRes = await authService.getPartnerDirectory();
        const list = dirRes.data || [];
        foundPartner = list.find(p => String(p.id) === String(id) || p.companyName?.toLowerCase() === id.toLowerCase());
      }

      if (foundPartner) {
        setPartner(foundPartner);
        fetchCompanyVacancies(foundPartner);
      } else {
        setPartner(null);
      }
    } catch (err) {
      console.error('Failed to load company details:', err);
      setPartner(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyVacancies = async (partnerData) => {
    setVacanciesLoading(true);
    try {
      const res = await vacancyService.getPublicVacancies({ page: 0, size: 100 });
      let list = [];
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw?.content)) {
        list = raw.content;
      }

      const pName = (partnerData?.companyName || '').toLowerCase().trim();
      const pUsername = (partnerData?.username || '').toLowerCase().trim();
      const pId = String(partnerData?.id || id || '').trim();

      const filtered = list.filter(v => {
        const vComp = (v.companyName || v.company_name || '').toLowerCase().trim();
        const vPart = String(v.partnerId || v.partner_id || '').toLowerCase().trim();
        return (pName && (vComp === pName || vComp.includes(pName) || pName.includes(vComp))) ||
               (pUsername && (vPart === pUsername || vComp === pUsername)) ||
               (pId && vPart === pId);
      });
      setVacancies(filtered);
    } catch (err) {
      console.warn('Could not fetch company vacancies:', err);
      setVacancies([]);
    } finally {
      setVacanciesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
        <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[36px]">business_messages</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Company Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested corporate partner profile could not be located or may be pending verification.
        </p>
        <Button onClick={() => navigate('/student/companies')} icon="arrow_back">
          Back to Companies Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/student/companies')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Companies Directory
      </button>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-purple-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-emerald-500/20 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo */}
            {partner.logoUrl ? (
              <img
                src={partner.logoUrl}
                alt={partner.companyName}
                className="w-24 h-24 rounded-3xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-md shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                {partner.companyName ? partner.companyName.substring(0, 2).toUpperCase() : ''}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {partner.companyName || ''}
                </h1>
                {partner.accountStatus === 'ACTIVE' && (
                  <Badge variant="success" className="text-xs px-2.5 py-0.5 inline-flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Verified Industry Partner
                  </Badge>
                )}
                <Badge variant="primary" className="text-xs px-2.5 py-0.5 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px]">work</span>
                  {vacanciesLoading ? 'Loading vacancies...' : `${vacancies.length} Open ${vacancies.length === 1 ? 'Vacancy' : 'Vacancies'}`}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                {partner.companyIndustry && (
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="material-symbols-outlined text-[16px]">domain</span>
                    {partner.companyIndustry}
                  </span>
                )}
                {partner.companyAddress && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {partner.companyAddress}
                  </span>
                )}
                {partner.companySize && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    {partner.companySize}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 shrink-0">
            {partner.website && (
              <a
                href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm" icon="open_in_new" className="w-full text-xs">
                  Visit Corporate Website
                </Button>
              </a>
            )}
            <a href="#vacancies" className="inline-flex">
              <Button size="sm" icon="work" className="w-full text-xs">
                View Open Vacancies ({vacancies.length})
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: About & Vacancies */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Company Card (strictly from DB, blank if not set) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">article</span>
                Company Overview & Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner.companyDescription ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {partner.companyDescription}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">No detailed corporate description provided.</p>
              )}

              {(partner.companyIndustry || partner.companySize) && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partner.companyIndustry && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Industry Sector</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {partner.companyIndustry}
                      </p>
                    </div>
                  )}
                  {partner.companySize && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Workforce Size</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {partner.companySize}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Vacancies Section */}
          <div id="vacancies" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">work</span>
                Open Vacancies at {partner.companyName || 'Company'}
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {vacancies.length} active {vacancies.length === 1 ? 'position' : 'positions'}
              </span>
            </div>

            {vacanciesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading open opportunities...</div>
            ) : vacancies.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">work_history</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Current Vacancies Open</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {partner.companyName || 'This company'} does not have any active vacancy postings at this moment.
                </p>
                <Link to="/student/vacancies" className="inline-block pt-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    Browse All Vacancies
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {vacancies.map((vac) => {
                  const vacId = vac.id || vac.vacancyId || vac.vacancy_id;
                  return (
                    <Card key={vacId} className="hover:border-emerald-500/40 hover:shadow-md transition-all">
                      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">
                              {vac.title || vac.jobTitle || ''}
                            </h4>
                            {(vac.jobType || vac.workplaceType) && (
                              <Badge variant="success" className="text-[10px]">
                                {vac.jobType || vac.workplaceType}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            {vac.location && <span>{vac.location}</span>}
                            {vac.salaryRange && <span>• {vac.salaryRange}</span>}
                          </p>
                        </div>
                        <Link to={`/student/vacancies/${vacId}`}>
                          <Button size="sm" icon="arrow_forward" className="text-xs shrink-0">
                            View Position
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Corporate Contact & Headquarters */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">contact_mail</span>
                Corporate Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {partner.email && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Corporate Email</p>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold break-all">
                    {partner.email}
                  </p>
                </div>
              )}

              {partner.phone && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone Number</p>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">{partner.phone}</p>
                </div>
              )}

              {partner.website && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Website</p>
                  <a
                    href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold break-all"
                  >
                    {partner.website}
                  </a>
                </div>
              )}

              {partner.companyAddress && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Headquarters / Address</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {partner.companyAddress}
                  </p>
                </div>
              )}

              {partner.accountStatus && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status</p>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {partner.accountStatus} Partner
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
