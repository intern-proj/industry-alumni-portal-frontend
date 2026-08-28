import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { vacancyService } from '../../services/vacancyService';
import { applicationService } from '../../services/applicationService';
import { platformService } from '../../services/platformService';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPartnerData() {
      setLoading(true);
      try {
        const [vacRes, appRes, verifRes] = await Promise.allSettled([
          vacancyService.getMyVacancies(user?.id || 1),
          applicationService.getApplicationsByVacancy(1),
          platformService.getMyVerificationStatus()
        ]);

        if (vacRes.status === 'fulfilled') {
          const vData = vacRes.value?.data?.content || vacRes.value?.data || [];
          setVacancies(Array.isArray(vData) ? vData : []);
        }
        if (appRes.status === 'fulfilled') {
          const aData = appRes.value?.data?.content || appRes.value?.data || [];
          setApplications(Array.isArray(aData) ? aData : []);
        }
        if (verifRes.status === 'fulfilled') {
          setVerificationStatus(verifRes.value?.data);
        }
      } catch {
        setVacancies([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }
    loadPartnerData();
  }, [user?.id]);

  const metrics = [
    { label: 'Active Vacancies', value: vacancies.filter(v => v.status === 'APPROVED').length, icon: 'work', color: 'text-primary' },
    { label: 'Total Applications', value: applications.length, icon: 'group', color: 'text-secondary' },
    { label: 'Pending Review', value: vacancies.filter(v => v.status === 'PENDING').length, icon: 'pending_actions', color: 'text-info' },
    { label: 'Shortlisted', value: applications.filter(a => a.status === 'SHORTLISTED').length, icon: 'assignment_turned_in', color: 'text-emerald-500' },
  ];

  const columns = [
    { key: 'studentName', header: 'Candidate Name', cellClassName: 'font-medium text-slate-900 dark:text-white' },
    { key: 'vacancyTitle', header: 'Vacancy' },
    { key: 'appliedAt', header: 'Applied Date', render: (row) => new Date(row.appliedAt || Date.now()).toLocaleDateString() },
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Partner Dashboard</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Welcome back, {user?.username || 'Partner'} representative.</p>
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
