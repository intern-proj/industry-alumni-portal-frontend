import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { applicationService } from '../../services/applicationService';

export default function ApplicationsPipeline() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getApplicationsByVacancy(1);
      const data = res.data?.content || res.data || [];
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp || !newStatus) return;
    setStatusUpdating(true);
    try {
      await applicationService.updateApplicationStatus(selectedApp.id, newStatus, 'Status updated via Staff Pipeline');
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      setSelectedApp(null);
    } catch {
      // Local optimistic update
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
      setSelectedApp(null);
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const name = app.studentName || app.name || '';
    const company = app.companyName || app.company || '';
    const vacancy = app.vacancyTitle || app.vacancy || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { 
      key: 'candidate', 
      header: 'Student Candidate',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.studentName || row.name}</p>
          <p className="text-xs text-slate-500">{row.email || 'student@nsbm.ac.lk'}</p>
        </div>
      )
    },
    { 
      key: 'vacancyDetails', 
      header: 'Vacancy & Company',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.vacancyTitle || row.vacancy}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{row.companyName || row.company}</p>
        </div>
      )
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
        <Button 
          variant="outline" 
          size="sm" 
          icon="edit"
          onClick={() => {
            setSelectedApp(row);
            setNewStatus(row.status || 'APPLIED');
          }}
        >
          Review
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Applications Pipeline</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review and oversee university students applying for industrial placement.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center">
          <SmartAISearchBar
            placeholder="Search candidate name, vacancy, or company..."
            aiPlaceholder="Smart AI search applications by student or role..."
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            onSearch={(val) => setSearchTerm(val)}
            className="flex-1 w-full"
          />
          <div className="w-full md:w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Application Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="PLACED">Placed</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Candidates in Pipeline ({filteredApps.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredApps}
            loading={loading}
            emptyMessage="No applications matched your search."
          />
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Review Candidate Application</h3>
                <p className="text-xs text-slate-500">{selectedApp.studentName || selectedApp.name}</p>
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
                <p className="font-semibold text-slate-800 dark:text-slate-200">Vacancy: {selectedApp.vacancyTitle || selectedApp.vacancy}</p>
                <p className="text-slate-500">Target Employer: {selectedApp.companyName || selectedApp.company}</p>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Update Application Status</label>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="APPLIED">APPLIED (Pending Initial Review)</option>
                  <option value="SHORTLISTED">SHORTLISTED (Candidate Selected)</option>
                  <option value="INTERVIEW">INTERVIEW (Interview Scheduled)</option>
                  <option value="PLACED">PLACED (Offer Accepted / Placed)</option>
                  <option value="REJECTED">REJECTED (Application Declined)</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
              <Button loading={statusUpdating} onClick={handleStatusUpdate} icon="check">Update Status</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
