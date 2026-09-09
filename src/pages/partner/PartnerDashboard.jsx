import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { vacancyService } from '../../services/vacancyService';
import { applicationService } from '../../services/applicationService';
import { platformService } from '../../services/platformService';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPartnerData() {
      setLoading(true);
      try {
        const partnerKey = user?.username || user?.id || '';

        // 1. Fetch partner vacancies dynamically from vacancy-service
        let vacList = [];
        if (partnerKey) {
          try {
            const vacRes = await vacancyService.getPartnerVacancies(partnerKey, { page: 0, size: 100 });
            const raw = vacRes.data?.data !== undefined ? vacRes.data.data : vacRes.data;
            if (Array.isArray(raw)) vacList = raw;
            else if (Array.isArray(raw?.content)) vacList = raw.content;
          } catch {
            // fallback attempt with user.id if distinct
            if (user?.id && user.id !== partnerKey) {
              try {
                const fallbackRes = await vacancyService.getPartnerVacancies(user.id, { page: 0, size: 100 });
                const raw = fallbackRes.data?.data !== undefined ? fallbackRes.data.data : fallbackRes.data;
                if (Array.isArray(raw)) vacList = raw;
                else if (Array.isArray(raw?.content)) vacList = raw.content;
              } catch {
                // keep empty
              }
            }
          }
        }

        // If partner-specific endpoint returned empty, cross-match with public vacancies
        if (vacList.length === 0) {
          try {
            const pubRes = await vacancyService.getPublicVacancies({ page: 0, size: 100 });
            const rawPub = pubRes.data?.data !== undefined ? pubRes.data.data : pubRes.data;
            const allPub = Array.isArray(rawPub) ? rawPub : (Array.isArray(rawPub?.content) ? rawPub.content : []);
            const uName = (user?.username || '').toLowerCase().trim();
            const cName = (user?.companyName || '').toLowerCase().trim();
            const uId = String(user?.id || '').trim();
            vacList = allPub.filter(v => {
              const vComp = (v.companyName || v.company_name || '').toLowerCase().trim();
              const vPart = String(v.partnerId || v.partner_id || '').toLowerCase().trim();
              return (uName && (vPart === uName || vComp === uName)) ||
                     (cName && (vComp === cName || vComp.includes(cName))) ||
                     (uId && vPart === uId);
            });
          } catch {
            // keep empty
          }
        }

        setVacancies(vacList);

        // 2. Fetch candidate applications for this partner's vacancies
        let appList = [];
        try {
          const appRes = await applicationService.getApplications();
          const rawApp = appRes.data?.data !== undefined ? appRes.data.data : appRes.data;
          const allApps = Array.isArray(rawApp) ? rawApp : (Array.isArray(rawApp?.content) ? rawApp.content : []);

          if (vacList.length > 0) {
            const vacIdSet = new Set(vacList.map(v => String(v.id || v.vacancyId)));
            const vacTitleMap = new Map(vacList.map(v => [String(v.id || v.vacancyId), v.title || '']));
            
            appList = allApps.filter(a => vacIdSet.has(String(a.vacancyId))).map(a => ({
              ...a,
              vacancyTitle: a.vacancyTitle || vacTitleMap.get(String(a.vacancyId)) || ''
            }));
          } else {
            appList = allApps;
          }
        } catch {
          appList = [];
        }
        setApplications(appList);

        // 3. Fetch verification status
        try {
          const verifRes = await platformService.getMyVerificationStatus();
          setVerificationStatus(verifRes.data);
        } catch {
          setVerificationStatus(null);
        }
      } catch (err) {
        console.warn('Error loading partner dashboard data:', err);
        setVacancies([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }
    loadPartnerData();
  }, [user]);

  const metrics = [
    { label: 'Active Vacancies', value: vacancies.filter(v => v.status === 'APPROVED').length, icon: 'work', color: 'text-primary' },
    { label: 'Total Applications', value: applications.length, icon: 'group', color: 'text-secondary' },
    { label: 'Pending Review', value: vacancies.filter(v => v.status === 'PENDING').length, icon: 'pending_actions', color: 'text-info' },
    { label: 'Shortlisted', value: applications.filter(a => a.status === 'SHORTLISTED').length, icon: 'assignment_turned_in', color: 'text-emerald-500' },
  ];

  const columns = [
    {
      key: 'studentName',
      header: 'Candidate Name',
      cellClassName: 'font-medium text-slate-900 dark:text-white',
      render: (row) => {
        const raw = row.studentName || row.candidateName || '';
        return raw.replace(/\s+Candidate$/i, '').trim() || row.studentId || row.alumniId || '';
      }
    },
    {
      key: 'vacancyTitle',
      header: 'Vacancy',
      render: (row) => row.vacancyTitle || (row.vacancyId ? `Position #${row.vacancyId}` : '')
    },
    {
      key: 'appliedAt',
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
        let variant = 'neutral';
        if (row.status === 'SHORTLISTED') variant = 'info';
        if (row.status === 'INTERVIEW') variant = 'warning';
        if (row.status === 'PLACED') variant = 'placed';
        if (row.status === 'REJECTED') variant = 'danger';
        return <Badge variant={variant}>{row.status || 'APPLIED'}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => navigate(`/partner/applications/${row.id}`)}
          className="text-xs"
        >
          See Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Partner Dashboard</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Welcome back{user?.companyName ? `, ${user.companyName}` : (user?.username ? `, ${user.username}` : '')}.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/partner/vacancies">
            <Button icon="add">Post Vacancy</Button>
          </Link>
        </div>
      </div>

      {verificationStatus && verificationStatus.status !== 'APPROVED' && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${verificationStatus.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">
              {verificationStatus.status === 'REJECTED' ? 'cancel' : 'pending_actions'}
            </span>
            <div>
              <h4 className="font-semibold">
                {verificationStatus.status === 'REJECTED' ? 'Verification Declined' : 'Verification Pending'}
              </h4>
              <p className="text-sm opacity-90 mt-0.5">
                {verificationStatus.status === 'PENDING_DOCUMENTS' && 'Please upload your corporate documents to complete verification.'}
                {verificationStatus.status === 'PENDING_REVIEW' && 'Your documents are currently under review.'}
                {verificationStatus.status === 'MORE_INFO_REQUIRED' && 'Changes have been requested on your verification documents.'}
                {verificationStatus.status === 'REJECTED' && 'Your organization verification was declined.'}
              </p>
            </div>
          </div>
          <Link to="/partner/verification">
            <Button variant="outline" className={`bg-white ${verificationStatus.status === 'REJECTED' ? 'border-rose-200 text-rose-700 hover:bg-rose-100' : 'border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
              View Verification
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold">{m.label}</span>
              <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${m.color} mt-2`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Recent Candidate Applications</CardTitle>
          <Link to="/partner/applications" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
            View All →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading applicant data...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <span className="material-symbols-outlined text-slate-400 text-[32px]">assignment_late</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No Candidate Applications Yet</p>
              <p className="text-xs text-slate-500">Applications submitted for your job postings will appear here.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={applications} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
