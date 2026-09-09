import React, { useState, useEffect } from 'react';
import { platformService } from '../../services/platformService';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select, Textarea } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

export default function PartnerManagement() {
  const [activeTab, setActiveTab] = useState('STAGE_1'); // STAGE_1, STAGE_2, REGISTERED
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  const { user, hasAnyRole } = useAuth();
  const isViewOnly = hasAnyRole('FACULTY_MANAGEMENT');
  const canDelete = hasAnyRole('SYSTEM_ADMIN', 'INTERNSHIP_COORDINATOR');

  // Stage 1 State
  const [pendingPartners, setPendingPartners] = useState([]);
  
  // Stage 2 State
  const [verifications, setVerifications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Registered State
  const [registeredPartners, setRegisteredPartners] = useState([]);

  // Modals
  const [selectedPendingPartner, setSelectedPendingPartner] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [selectedVerificationDocs, setSelectedVerificationDocs] = useState([]);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  useEffect(() => {
    if (selectedVerification) {
      // Fetch documents for the selected verification
      platformService.listPartnerDocuments(selectedVerification.id)
        .then(res => setSelectedVerificationDocs(res.data || []))
        .catch(err => console.error("Failed to fetch documents", err));
    } else {
      setSelectedVerificationDocs([]);
    }
  }, [selectedVerification]);

  const fetchData = async () => {
    setLoading(true);
    setGlobalError('');
    try {
      if (activeTab === 'STAGE_1') {
        const res = await authService.getPendingPartners();
        setPendingPartners(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'STAGE_2') {
        const [verifRes, partnersRes] = await Promise.all([
          platformService.getPartnerVerifications(statusFilter || undefined),
          authService.getIndustryPartners()
        ]);
        const data = verifRes.data?.content || verifRes.data || [];
        setVerifications(Array.isArray(data) ? data : []);
        setRegisteredPartners(Array.isArray(partnersRes.data) ? partnersRes.data : []);
      } else if (activeTab === 'REGISTERED') {
        const res = await authService.getIndustryPartners();
        setRegisteredPartners(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setGlobalError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Stage 1 Actions
  const handleStage1Decision = async (id, decision) => {
    setProcessing(true);
    try {
      if (decision === 'APPROVE') {
        await authService.approvePendingPartner(id);
        setGlobalSuccess('Application approved. Registration email sent to partner.');
      } else {
        await authService.rejectPendingPartner(id);
        setGlobalSuccess('Application rejected and removed.');
      }
      fetchData();
      setTimeout(() => setGlobalSuccess(''), 4000);
    } catch (err) {
      setGlobalError(err.response?.data?.message || `Failed to ${decision.toLowerCase()} application.`);
      setTimeout(() => setGlobalError(''), 4000);
    } finally {
      setProcessing(false);
    }
  };

  // Stage 2 Actions
  const handleStage2Decision = async (status) => {
    if (!selectedVerification) return;
    if ((status === 'REJECTED' || status === 'MORE_INFO_REQUIRED') && !reviewNotes.trim()) {
      setDialogError(`A reason is required to ${status === 'REJECTED' ? 'decline' : 'request changes'}.`);
      return;
    }
    setProcessing(true);
    setDialogError('');
    try {
      const payload = {
        decision: status === 'APPROVED' ? 'APPROVE' : (status === 'MORE_INFO_REQUIRED' ? 'REQUEST_MORE_INFO' : 'REJECT'),
        decisionNotes: reviewNotes || 'No notes provided.',
        rejectionReason: (status === 'REJECTED' || status === 'MORE_INFO_REQUIRED') ? reviewNotes : null,
        actingUserId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user?.id) 
          ? user.id 
          : '00000000-0000-0000-0000-000000000000'
      };
      await platformService.submitPartnerDecision(selectedVerification.id, payload);
      setGlobalSuccess(`Document verification ${status.toLowerCase()} successfully.`);
      setSelectedVerification(null);
      fetchData();
      setTimeout(() => setGlobalSuccess(''), 4000);
    } catch (err) {
      setDialogError(err.response?.data?.message || 'Failed to submit partner review decision.');
    } finally {
      setProcessing(false);
    }
  };

  // Registered Actions
  const handleToggleStatus = async (partner) => {
    try {
      await authService.toggleIndustryPartnerStatus(partner.id);
      setGlobalSuccess(`Account status updated for ${partner.companyName}.`);
      fetchData();
      setTimeout(() => setGlobalSuccess(''), 4000);
    } catch (err) {
      setGlobalError('Failed to update account status.');
      setTimeout(() => setGlobalError(''), 4000);
    }
  };

  const confirmDeletePartner = async () => {
    if (!deleteTarget) return;
    try {
      await authService.deleteIndustryPartner(deleteTarget.id);
      // We should also delete user profile and auth credentials via standard admin endpoint
      await authService.deleteAdmin(deleteTarget.email).catch(e => console.warn(e));
      setGlobalSuccess('Partner account and associated data deleted.');
      fetchData();
      setTimeout(() => setGlobalSuccess(''), 4000);
    } catch (err) {
      setGlobalError('Failed to delete partner.');
      setTimeout(() => setGlobalError(''), 4000);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Filters
  const filteredStage1 = pendingPartners.filter(p => p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const filteredStage2 = verifications.filter(v => {
    const company = v.companyName || v.organizationNameSnapshot || '';
    const matchesSearch = company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRegistered = registeredPartners.filter(p => p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Columns Configuration
  const stage1Columns = [
    { key: 'companyName', header: 'Company Name', cellClassName: 'font-semibold' },
    { key: 'representativeFullName', header: 'Representative', render: (row) => `${row.representativeFullName} (${row.representativeJobRole})` },
    { key: 'email', header: 'Contact Email' },
    { key: 'companyIndustry', header: 'Industry' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" icon="info" onClick={(e) => { e.stopPropagation(); setSelectedPendingPartner(row); }}>
            Details
          </Button>
          {!isViewOnly && (
            <>
              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" loading={processing} onClick={(e) => { e.stopPropagation(); handleStage1Decision(row.id, 'APPROVE'); }}>Approve</Button>
              <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" loading={processing} onClick={(e) => { e.stopPropagation(); handleStage1Decision(row.id, 'REJECT'); }}>Reject</Button>
            </>
          )}
        </div>
      )
    }
  ];

  const stage2Columns = [
    { key: 'companyName', header: 'Company Name', cellClassName: 'font-semibold', render: (row) => row.companyName || row.organizationNameSnapshot || 'Unknown' },
    { key: 'email', header: 'Contact Email', render: (row) => row.contactEmailSnapshot || 'N/A' },
    { key: 'submittedDate', header: 'Submitted', render: (row) => new Date(row.submittedDate || Date.now()).toLocaleDateString() },
    { 
      key: 'status', 
      header: 'Verification Status',
      render: (row) => {
        let variant = 'warning';
        if (row.status === 'APPROVED') variant = 'success';
        if (row.status === 'REJECTED') variant = 'danger';
        return <Badge variant={variant}>{row.status || 'PENDING_REVIEW'}</Badge>;
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
          onClick={async (e) => {
            e.stopPropagation();
            if (row.status === 'PENDING_REVIEW' && !isViewOnly) {
              try {
                const reviewerId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user?.id) 
                  ? user.id 
                  : '00000000-0000-0000-0000-000000000000';
                await platformService.claimPartnerVerification(row.id, reviewerId);
                row.status = 'UNDER_REVIEW'; // optimistic update
              } catch (err) {
                console.error("Failed to claim verification", err);
              }
            }
            setSelectedVerification(row);
            setReviewNotes('');
          }}
        >
          {isViewOnly ? 'View Details' : 'Review Docs'}
        </Button>
      )
    }
  ];

  const registeredColumns = [
    { key: 'companyName', header: 'Company Name', cellClassName: 'font-semibold' },
    { key: 'email', header: 'Email' },
    { 
      key: 'status', 
      header: 'Account Status',
      render: (row) => {
        const status = row.accountStatus || 'ACTIVE';
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-500'}`}>
            <span className={`w-2 h-2 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {status}
          </span>
        );
      }
    },
    {
      key: 'verification',
      header: 'Stage 2 Verification',
      render: (row) => {
        const verif = verifications.find(v => v.organizationNameSnapshot === row.username);
        if (!verif) return <span className="text-xs text-slate-400">Not Started</span>;
        
        const isVerified = verif.status === 'APPROVED';
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {verif.status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}>
            {row.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          {canDelete && (
            <Button variant="outline" size="sm" className="text-rose-600 hover:border-rose-300" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  if (selectedVerification) {
    const fullPartner = registeredPartners.find(p => p.username === selectedVerification.organizationNameSnapshot);
    const docToView = viewingDocument || (selectedVerificationDocs.length > 0 ? selectedVerificationDocs[0] : null);

    return (
      <div className="flex flex-col h-full min-h-[calc(100vh-8rem)] pb-10 fade-in max-w-[1400px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedVerification(null); setViewingDocument(null); setDialogError(''); }} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review Verification Documents</h2>
              <p className="text-sm text-slate-500">{fullPartner?.companyName || selectedVerification.organizationNameSnapshot}</p>
            </div>
          </div>
          {!isViewOnly && (
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" loading={processing} onClick={() => handleStage2Decision('MORE_INFO_REQUIRED')}>Request Changes</Button>
              <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" loading={processing} onClick={() => handleStage2Decision('REJECTED')}>Decline</Button>
              <Button loading={processing} icon="verified" onClick={() => handleStage2Decision('APPROVED')}>Approve Stage 2</Button>
            </div>
          )}
        </div>

        {dialogError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span><span>{dialogError}</span>
          </div>
        )}

        <div className="flex flex-col xl:flex-row flex-1 gap-6 min-h-[600px]">
          {/* Left Panel - Information & Document List */}
          <div className="w-full xl:w-1/3 flex flex-col gap-6 overflow-y-auto pb-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Company Information</h4>
              <p className="font-semibold text-slate-900 dark:text-white mb-1">
                {fullPartner?.email || selectedVerification.contactEmailSnapshot} ({fullPartner?.phone || 'N/A'})
              </p>
              <p className="text-sm text-slate-500">
                {fullPartner?.companyAddress || 'Address Not Provided'}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Industry: {fullPartner?.companyIndustry || 'Unknown'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Submitted Documents</h4>
              {selectedVerificationDocs.length === 0 ? (
                <p className="text-slate-400 text-sm italic">No documents uploaded.</p>
              ) : (
                <div className="space-y-3">
                  {selectedVerificationDocs.map(doc => {
                    const isSelected = docToView?.id === doc.id;
                    return (
                      <div 
                        key={doc.id} 
                        onClick={() => setViewingDocument(doc)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 shadow-md shadow-sky-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                              <span className="material-symbols-outlined">description</span>
                            </div>
                            <div className="overflow-hidden">
                              <p className={`font-semibold truncate text-sm ${isSelected ? 'text-sky-900 dark:text-sky-100' : 'text-slate-700 dark:text-slate-300'}`}>{doc.originalFilename}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">{doc.documentType}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-auto pt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Review Notes</label>
              <Textarea rows={4} placeholder="Add internal approval notes or justification for rejection..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} disabled={isViewOnly} />
            </div>
          </div>

          {/* Right Panel - Document Viewer */}
          <div className="w-full xl:w-2/3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {docToView ? (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[300px] sm:max-w-md">{docToView.originalFilename}</h3>
                  </div>
                  <a 
                    href={storageService.getFileDownloadUrl(docToView.storageFileId, false)} 
                    target="_blank" rel="noopener noreferrer" download={docToView.originalFilename}
                  >
                    <Button variant="outline" size="sm" icon="download">Download</Button>
                  </a>
                </div>
                <div className="flex-1 w-full h-full p-4 relative">
                  <iframe 
                    src={storageService.getFileDownloadUrl(docToView.storageFileId, true)}
                    className="w-full h-full rounded-xl bg-white shadow-sm border border-slate-200 dark:border-slate-800"
                    title={docToView.originalFilename}
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">draft</span>
                <p>Select a document to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Partner Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage industry partner applications, document verifications, and registered accounts.
          </p>
        </div>
      </div>

      {globalSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          {globalSuccess}
        </div>
      )}
      
      {globalError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {globalError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'STAGE_1' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('STAGE_1')}
        >
          Stage 1: Applications
        </button>
        <button
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'STAGE_2' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('STAGE_2')}
        >
          Stage 2: Document Verification
        </button>
        <button
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'REGISTERED' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('REGISTERED')}
        >
          Registered Partners
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>
            {activeTab === 'STAGE_1' && `Pending Applications (${filteredStage1.length})`}
            {activeTab === 'STAGE_2' && `Verification Queue (${filteredStage2.length})`}
            {activeTab === 'REGISTERED' && `Registered Accounts (${filteredRegistered.length})`}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <SmartAISearchBar 
              placeholder="Search companies..." 
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onSearch={(val) => setSearchTerm(val)}
              showAiToggle={false}
              className="w-full sm:w-72" 
            />
            {activeTab === 'STAGE_2' && (
              <div className="w-full sm:w-44">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="PENDING_DOCUMENTS">Pending Documents</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="MORE_INFO_REQUIRED">More Info Required</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeTab === 'STAGE_1' && <DataTable columns={stage1Columns} data={filteredStage1} loading={loading} keyField="id" onRowClick={(row) => setSelectedPendingPartner(row)} />}
          {activeTab === 'STAGE_2' && <DataTable columns={stage2Columns} data={filteredStage2} loading={loading} keyField="id" />}
          {activeTab === 'REGISTERED' && <DataTable columns={registeredColumns} data={filteredRegistered} loading={loading} keyField="id" onRowClick={(row) => setSelectedPendingPartner(row)} />}
        </CardContent>
      </Card>

      {/* Stage 1: Pending Partner Details Modal */}
      {selectedPendingPartner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Partner Application Details</h3>
              <button onClick={() => setSelectedPendingPartner(null)} className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Company Name</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPendingPartner.companyName}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Industry</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPendingPartner.companyIndustry || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Representative</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPendingPartner.representativeFullName}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Job Role</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPendingPartner.representativeJobRole}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Email</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPendingPartner.email}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Phone</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPendingPartner.phone}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">Company Address</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{selectedPendingPartner.companyAddress}</p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">Company Description</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{selectedPendingPartner.companyDescription}</p>
              </div>
            </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setSelectedPendingPartner(null)}>Close</Button>
                {!isViewOnly && activeTab === 'STAGE_1' && (
                  <>
                    <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" loading={processing} onClick={() => {
                      handleStage1Decision(selectedPendingPartner.id, 'REJECT');
                      setSelectedPendingPartner(null);
                    }}>Reject</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" loading={processing} onClick={() => {
                      handleStage1Decision(selectedPendingPartner.id, 'APPROVE');
                      setSelectedPendingPartner(null);
                    }}>Approve</Button>
                  </>
                )}
              </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Registered Partner"
        message={`Are you sure you want to permanently delete the account for "${deleteTarget?.companyName}"? This will revoke all access.`}
        onConfirm={confirmDeletePartner}
        onCancel={() => setDeleteTarget(null)}
        loading={processing}
      />
    </div>
  );
}
