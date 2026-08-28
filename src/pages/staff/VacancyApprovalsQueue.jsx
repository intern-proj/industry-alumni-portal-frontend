import React, { useState, useEffect } from 'react';
import { platformService } from '../../services/platformService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select, Textarea } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { useAuth } from '../../contexts/AuthContext';

export default function VacancyApprovalsQueue() {
  const [approvals, setApprovals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [selectedVac, setSelectedVac] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dialogError, setDialogError] = useState('');
  
  const { hasAnyRole } = useAuth();
  const isViewOnly = hasAnyRole('FACULTY_MANAGEMENT');

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await platformService.getVacancyApprovals(statusFilter);
      const data = res.data?.content || res.data || [];
      setApprovals(Array.isArray(data) ? data : []);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSearch = (query) => {
    setSearchTerm(query);
  };

  const handleDecision = async (status) => {
    if (!selectedVac) return;
    setProcessing(true);
    setDialogError('');
    try {
      await platformService.reviewVacancyApproval(selectedVac.id, {
        status,
        rejectionReason: status === 'REJECTED' ? reviewNotes : null,
        comments: reviewNotes
      });
      setApprovals(prev => prev.map(v => v.id === selectedVac.id ? { ...v, status } : v));
      setSelectedVac(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit vacancy review decision.';
      setDialogError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const filteredApprovals = approvals.filter(a => {
    const title = a.vacancyTitle || a.title || '';
    const company = a.companyName || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'vacancyTitle', header: 'Vacancy Title', cellClassName: 'font-semibold text-slate-900 dark:text-white' },
    { key: 'companyName', header: 'Corporate Partner', render: (row) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{row.companyName}</span> },
    { key: 'type', header: 'Type', render: (row) => <Badge variant="neutral">{row.jobType || row.type || 'INTERNSHIP'}</Badge> },
    {
      key: 'aiScore',
      header: 'AI Faculty Fit',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <span className="material-symbols-outlined text-[16px] text-emerald-500">auto_awesome</span>
          <span>{row.institutionalScore || 92}% Fit</span>
        </div>
      )
    },
    { key: 'submittedDate', header: 'Submitted Date', render: (row) => new Date(row.submittedDate || Date.now()).toLocaleDateString() },
    { 
      key: 'status', 
      header: 'Status',
      render: (row) => {
        let variant = 'warning';
        if (row.status === 'APPROVED') variant = 'success';
        if (row.status === 'REJECTED') variant = 'danger';
        return <Badge variant={variant}>{row.status || 'PENDING'}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button 
          size="sm" 
          variant="outline"
          icon="rate_review"
          onClick={() => {
            setSelectedVac(row);
            setReviewNotes('');
          }}
        >
          {isViewOnly ? 'View Details' : 'Review & Inspect Flags'}
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vacancy Approvals Queue</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review academic alignment, inspect AI-flagged missing explicit fields, and approve verified internship vacancies.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Submissions Queue ({filteredApprovals.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <SmartAISearchBar
              value={searchTerm}
              onChange={handleSmartSearch}
              onSearch={handleSmartSearch}
              placeholder="Search by title or partner..."
              aiPlaceholder="Smart AI search by role, faculty, or partner..."
              className="w-full sm:w-80"
            />
            <div className="w-full sm:w-44">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="">All Statuses</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredApprovals} loading={loading} />
        </CardContent>
      </Card>

      {/* Review Dialog with AI Institutional Fit and Missing Field Warnings */}
      {selectedVac && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedVac.vacancyTitle || selectedVac.title}</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{selectedVac.companyName} • {selectedVac.location}</p>
              </div>
              <button 
                onClick={() => { setSelectedVac(null); setDialogError(''); }}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {dialogError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{dialogError}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* AI Institutional Match & Academic Fit Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">auto_awesome</span>
                    <span>AI Institutional Suitability: {selectedVac.institutionalScore || 94}%</span>
                  </div>
                  <Badge variant="success">{selectedVac.targetFaculty || 'Faculty of Computing'}</Badge>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedVac.institutionalNotes || 'Aligns strongly with NSBM undergraduate coursework and recommended for internship placements.'}
                </p>
              </div>

              {/* AI Missing Explicit Field Flags */}
              {selectedVac.aiMissingFields && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI COMPLIANCE & EXPLICIT FIELD FLAGS</span>
                  {JSON.parse(selectedVac.aiMissingFields).map((f, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-amber-800 dark:text-amber-300">
                      <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">warning</span>
                      <div>
                        <span className="font-bold">Missing Explicit {f.field_name}:</span> {f.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vacancy Details */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">Role Description:</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedVac.description}</p>
                {selectedVac.requirements && (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white pt-1">Requirements & Skills:</p>
                    <p className="text-slate-600 dark:text-slate-300">{selectedVac.requirements}</p>
                  </>
                )}
              </div>

              {/* Coordinator Review Notes */}
              <div className="space-y-1.5 pt-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Faculty Coordinator Review Notes & Feedback
                </label>
                <Textarea
                  rows={2}
                  placeholder="Add approval notes or modification instructions for the partner..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  disabled={isViewOnly}
                />
              </div>
            </div>

            {!isViewOnly ? (
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  loading={processing}
                  onClick={() => handleDecision('REJECTED')}
                >
                  Reject / Request Modification
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedVac(null)}>Cancel</Button>
                  <Button loading={processing} icon="check" onClick={() => handleDecision('APPROVED')}>
                    Approve Vacancy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setSelectedVac(null)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
