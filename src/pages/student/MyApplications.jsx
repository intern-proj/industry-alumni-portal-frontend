import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/applicationService';
import { vacancyService } from '../../services/vacancyService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [user?.id]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const res = await applicationService.getApplicationsByAlumni(user.id);
        const data = res.data?.content || res.data || [];
        const appList = Array.isArray(data) ? data : [];
        
        // Enrich with vacancy details
        const enrichedApps = await Promise.all(
          appList.map(async (app) => {
            if (app.vacancyTitle && app.companyName) return app;
            try {
              const vacRes = await vacancyService.getVacancyById(app.vacancyId);
              const vac = vacRes.data?.data || vacRes.data;
              return {
                ...app,
                vacancyTitle: vac?.title || `Vacancy #${app.vacancyId}`,
                companyName: vac?.companyName || 'Unknown Company'
              };
            } catch (err) {
              return {
                ...app,
                vacancyTitle: `Vacancy #${app.vacancyId}`,
                companyName: 'Unknown Company'
              };
            }
          })
        );
        
        setApplications(enrichedApps);
      } else {
        setApplications([]);
      }
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    window.confirmAction({
      title: 'Delete Application',
      message: 'Are you sure you want to delete this application? This action cannot be undone.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await applicationService.deleteApplication(id, user.id);
          setApplications(prev => prev.filter(app => app.id !== id));
        } catch (error) {
          window.toast.error('Failed to delete application. Please try again.');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const columns = [
    { key: 'vacancyTitle', header: 'Position / Role' },
    { key: 'companyName', header: 'Company' },
    { 
      key: 'appliedAt', 
      header: 'Applied Date',
      render: (row) => new Date(row.appliedAt || Date.now()).toLocaleDateString()
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
        return <Badge variant={variant}>{row.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : (row.status || 'APPLIED')}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Link to={`/student/applications/${row.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
          >
            {deletingId === row.id ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Job Applications</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track status, stage transitions, and recruiter updates for your internship applications.
          </p>
        </div>
        <Link to="/student/vacancies">
          <Button icon="search">Browse Vacancies</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application History ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={applications}
            loading={loading}
            emptyMessage="No job applications found yet. Browse vacancies to submit your first placement application!"
          />
        </CardContent>
      </Card>
    </div>
  );
}
