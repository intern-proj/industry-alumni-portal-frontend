import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/applicationService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [user?.id]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const res = await applicationService.getApplicationsByAlumni(user.id);
        const data = res.data?.content || res.data || [];
        setApplications(Array.isArray(data) ? data : []);
      } else {
        setApplications([]);
      }
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
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
        if (row.status === 'SHORTLISTED') variant = 'info';
        if (row.status === 'INTERVIEW') variant = 'warning';
        if (row.status === 'PLACED') variant = 'success';
        if (row.status === 'REJECTED') variant = 'danger';
        return <Badge variant={variant}>{row.status || 'APPLIED'}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedApp(row)}
        >
          View Details
        </Button>
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

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedApp.vacancyTitle}</h3>
                <p className="text-xs text-slate-500">{selectedApp.companyName}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Current Status:</span>
                <Badge variant="info">{selectedApp.status || 'APPLIED'}</Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Submitted On:</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {new Date(selectedApp.appliedAt || Date.now()).toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recruiter Feedback / Notes:</span>
                <p className="text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedApp.notes || 'Your application profile is currently under review by the hiring manager.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedApp(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
