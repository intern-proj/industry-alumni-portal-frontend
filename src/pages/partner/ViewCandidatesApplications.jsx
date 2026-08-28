import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { applicationService } from '../../services/applicationService';
import { useAuth } from '../../contexts/AuthContext';

export default function ViewCandidatesApplications({ vacancy, onBack }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getApplicationsByVacancy(vacancy?.id || 1);
      const data = res.data?.content || res.data || [];
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp || !newStatus) return;
    setUpdating(true);
    try {
      await applicationService.updateApplicationStatus(selectedApp.id, newStatus, 'Recruiter updated candidate status');
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      setSelectedApp(null);
    } catch {
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      setSelectedApp(null);
    } finally {
      setUpdating(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const name = app.studentName || app.name || '';
    const vacancy = app.vacancyTitle || app.vacancy || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { 
      key: 'candidate', 
      header: 'Undergraduate Candidate',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.studentName || row.name}</p>
          <p className="text-xs text-slate-500">{row.program || 'Faculty of Computing'} • GPA {row.gpa}</p>
        </div>
      )
    },
    { 
      key: 'vacancy', 
      header: 'Applied Position',
      render: (row) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{row.vacancyTitle || row.vacancy}</span>
    },
    { 
      key: 'date', 
      header: 'Applied Date', 
      render: (row) => new Date(row.appliedAt || row.date || Date.now()).toLocaleDateString() 
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
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            icon="how_to_reg"
            onClick={() => {
              setSelectedApp(row);
              setNewStatus(row.status || 'APPLIED');
            }}
          >
            Manage Stage
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Applications for {vacancy?.title || 'Vacancy'}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Review, shortlist, and manage candidate applications.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Candidates ({filteredApps.length})</CardTitle>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search candidate name or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            <div className="w-40">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW">Interview</option>
                <option value="PLACED">Placed</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredApps} loading={loading} />
        </CardContent>
      </Card>

      {/* Stage Management Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedApp.studentName || selectedApp.name}</h3>
                <p className="text-xs text-slate-500">{selectedApp.vacancyTitle || selectedApp.vacancy}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Email: {selectedApp.email || 'student@nsbm.ac.lk'}</p>
                <p className="text-slate-500">Degree: {selectedApp.program} (GPA {selectedApp.gpa})</p>
              </div>

              {selectedApp.coverNote && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Candidate Cover Note:</span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedApp.coverNote}
                  </p>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Update Recruitment Stage</label>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="APPLIED">APPLIED (New Application)</option>
                  <option value="SHORTLISTED">SHORTLISTED (Selected for Next Stage)</option>
                  <option value="INTERVIEW">INTERVIEW (Interview Scheduled)</option>
                  <option value="PLACED">PLACED (Offer Extended & Accepted)</option>
                  <option value="REJECTED">REJECTED (Not Selected)</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
              <Button loading={updating} onClick={handleUpdateStatus} icon="check">Update Stage</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
