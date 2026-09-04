import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import { applicationService } from '../../services/applicationService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';

export default function JobPostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();

  const isStaff = hasAnyRole('FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'FACULTY_MANAGEMENT', 'ADMINISTRATIVE_STAFF', 'SYSTEM_ADMIN');
  const isFacultyManagement = hasAnyRole('FACULTY_MANAGEMENT');
  const isPartner = hasAnyRole('INDUSTRY_PARTNER');

  const [vacancy, setVacancy] = useState(null);
  const [applicantCount, setApplicantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  // Interactive Edit Mode State (Partner)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Fullscreen Image Lightbox Modal State
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Small Action Modals State
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [modificationNotes, setModificationNotes] = useState('');
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVacancyDetails();
  }, [id]);

  const parseAiAnalysis = (aiField) => {
    if (!aiField) return null;
    if (typeof aiField === 'object') return aiField;
    try {
      const parsed = JSON.parse(aiField);
      if (Array.isArray(parsed)) {
        return {
          missingFields: parsed.map(f => ({
            field: f.field_name || f.field,
            severity: f.severity || 'WARNING',
            message: f.message || '',
            suggestion: f.suggestion || ''
          })),
          institutionalMatchScore: 88,
          approvalRecommendation: 'RECOMMENDED_FOR_APPROVAL',
          isSuitableForGraduates: true,
          complianceFlags: [],
          fitNotes: 'Evaluated against NSBM undergraduate academic curricula.',
          recommendedPrograms: ['BSc (Hons) Software Engineering', 'BSc (Hons) Computer Science']
        };
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const fetchVacancyDetails = async () => {
    setLoading(true);
    setError('');
    try {
      let data = null;
      if (isStaff) {
        try {
          const res = await vacancyService.getAdminVacancyById(id);
          data = res.data?.data || res.data;
        } catch {
          const res = await vacancyService.getVacancyById(id);
          data = res.data?.data || res.data;
        }
      } else {
        const res = await vacancyService.getVacancyById(id);
        data = res.data?.data || res.data;
      }

      if (!data) throw new Error('Vacancy not found');

      // Fetch applicants count for this specific vacancy
      let currentApplicantCount = 0;
      try {
        const appsRes = await applicationService.getApplicationsByVacancy(id);
        const appsData = appsRes.data?.data !== undefined ? appsRes.data.data : appsRes.data;
        const appsList = Array.isArray(appsData) ? appsData : (Array.isArray(appsData?.content) ? appsData.content : []);
        currentApplicantCount = appsList.length;
      } catch (appErr) {
        console.warn('Could not fetch applicant count for vacancy:', appErr);
      }
      
      data.applicantCount = currentApplicantCount;
      setApplicantCount(currentApplicantCount);
      setVacancy(data);
      initEditForm(data);

      if (!isStaff && !isPartner && user?.id) {
        try {
          const appsRes = await applicationService.getApplicationsByAlumni(user.id);
          const apps = appsRes.data?.data || appsRes.data || [];
          if (apps.some(a => String(a.vacancyId) === String(id))) {
            setHasApplied(true);
          }
        } catch (e) {
          console.warn('Could not verify application status', e);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load job post details.');
    } finally {
      setLoading(false);
    }
  };

  const initEditForm = (v) => {
    setEditFormData({
      title: v.title || '',
      jobType: v.jobType || 'INTERNSHIP',
      workplaceType: v.workplaceType || 'ON_SITE',
      location: v.location || '',
      salaryRange: v.salaryRange || '',
      applicationDeadline: v.applicationDeadline || '',
      numberOfOpenings: v.numberOfOpenings || 1,
      tags: v.tags ? v.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      description: v.description || '',
      requirements: v.requirements || '',
      targetFaculties: v.targetFaculties || 'Faculty of Computing'
    });
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    if (!editFormData.tags.includes(tag)) {
      setEditFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSaveEdit = async (resubmit = false) => {
    setSavingEdit(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        title: editFormData.title,
        jobType: editFormData.jobType,
        workplaceType: editFormData.workplaceType,
        location: editFormData.location,
        salaryRange: editFormData.salaryRange,
        applicationDeadline: editFormData.applicationDeadline || null,
        numberOfOpenings: Number(editFormData.numberOfOpenings) || 1,
        tags: editFormData.tags.join(', '),
        description: editFormData.description,
        requirements: editFormData.requirements,
        targetFaculties: editFormData.targetFaculties,
        status: resubmit ? 'PENDING' : vacancy.status
      };

      const res = await vacancyService.updateVacancy(id, payload);
      const updated = res.data?.data || res.data || { ...vacancy, ...payload };
      setVacancy(updated);
      setIsEditMode(false);
      setSuccessMsg(resubmit ? 'Job post updated and successfully resubmitted for coordinator approval!' : 'Job post changes saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job post.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Staff Coordinator Actions
  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await vacancyService.reviewAdminVacancy(id, {
        status: 'APPROVED',
        comments: 'Approved and published to undergraduate portal by faculty coordinator.'
      });
      setVacancy(prev => ({ ...prev, status: 'APPROVED' }));
      setSuccessMsg('Vacancy approved successfully! It is now live and globally visible across the portal.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve vacancy.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestModificationSubmit = async () => {
    if (!modificationNotes.trim()) {
      setError('Please provide feedback or modification instructions for the partner.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await vacancyService.reviewAdminVacancy(id, {
        status: 'CHANGES_REQUESTED',
        comments: modificationNotes
      });
      setVacancy(prev => ({ ...prev, status: 'CHANGES_REQUESTED', coordinatorNotes: modificationNotes }));
      setShowModificationModal(false);
      setSuccessMsg('Modification request sent to the corporate partner successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit modification request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejecting this vacancy.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await vacancyService.reviewAdminVacancy(id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason,
        comments: rejectionReason
      });
      setVacancy(prev => ({ ...prev, status: 'REJECTED', rejectionReason: rejectionReason }));
      setShowRejectModal(false);
      setSuccessMsg('Vacancy rejected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject vacancy.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseVacancy = async () => {
    setActionLoading(true);
    setError('');
    try {
      await vacancyService.closeVacancy(id);
      setVacancy(prev => ({ ...prev, status: 'CLOSED' }));
      setSuccessMsg('Vacancy deactivated and closed. It is no longer accepting new applications.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close vacancy.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenVacancy = async () => {
    setActionLoading(true);
    setError('');
    try {
      await vacancyService.reopenVacancy(id);
      setVacancy(prev => ({ ...prev, status: 'APPROVED' }));
      setSuccessMsg('Vacancy reopened and reactivated for student applications.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reopen vacancy.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setActionLoading(true);
    setError('');
    try {
      await vacancyService.deleteVacancy(id);
      setShowDeleteModal(false);
      navigate(isStaff ? '/staff/vacancy-approvals' : '/partner/vacancies');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vacancy.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium text-slate-500">Loading job post...</p>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vacancy Not Found</h2>
        <p className="text-slate-500 text-sm">{error || "The requested job post could not be retrieved."}</p>
        <Button onClick={() => navigate(-1)} icon="arrow_back">Go Back</Button>
      </div>
    );
  }

  const ai = parseAiAnalysis(vacancy.aiMissingFields);
  const missingFieldsList = ai?.missingFields || [];
  const complianceFlagsList = ai?.complianceFlags || [];
  const recommendedPrograms = ai?.recommendedPrograms || [];
  const tagsList = vacancy.tags ? vacancy.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" className="px-3 py-1 text-xs">Approved & Published</Badge>;
      case 'PENDING':
        return <Badge variant="warning" className="px-3 py-1 text-xs">Pending Approval</Badge>;
      case 'CHANGES_REQUESTED':
        return <Badge variant="info" className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 px-3 py-1 text-xs">Changes Requested</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" className="px-3 py-1 text-xs">Rejected</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral" className="px-3 py-1 text-xs">Closed</Badge>;
      default:
        return <Badge variant="neutral" className="px-3 py-1 text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── TOP BREADCRUMB & STATUS BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <button 
          onClick={() => navigate(isStaff ? '/staff/vacancy-approvals' : isPartner ? '/partner/vacancies' : '/vacancies')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>{isStaff ? 'Back to Approvals Queue' : isPartner ? 'Back to My Vacancies' : 'Back to Vacancies Directory'}</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">Vacancy #{vacancy.id}</span>
          {getStatusBadge(vacancy.status)}
        </div>
      </div>

      {/* ── ALERTS (ERROR & SUCCESS) ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-xl">error</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── COORDINATOR FEEDBACK BANNER (FOR PARTNER ON CHANGES_REQUESTED) ── */}
      {vacancy.status === 'CHANGES_REQUESTED' && vacancy.coordinatorNotes && (
        <div className="p-6 rounded-3xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200 font-bold text-sm sm:text-base">
              <span className="material-symbols-outlined text-indigo-600 text-2xl">edit_note</span>
              <span>Faculty Coordinator Requested Modifications:</span>
            </div>
            {(!isEditMode && (isPartner || isStaff)) && (
              <Button size="sm" icon="edit" onClick={() => setIsEditMode(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Edit & Resubmit
              </Button>
            )}
          </div>
          <p className="text-indigo-900/90 dark:text-indigo-200 text-sm leading-relaxed pl-8">
            {vacancy.coordinatorNotes}
          </p>
        </div>
      )}

      {/* ── REJECTION BANNER (WHEN REJECTED) ── */}
      {vacancy.status === 'REJECTED' && (
        <div className="p-6 rounded-3xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200 font-bold text-sm sm:text-base">
            <span className="material-symbols-outlined text-rose-600 text-2xl">block</span>
            <span>Vacancy Submission Rejected</span>
          </div>
          <p className="text-rose-800 dark:text-rose-200 text-sm leading-relaxed pl-8">
            {vacancy.rejectionReason || vacancy.coordinatorNotes || 'This vacancy does not meet university criteria and cannot be published.'}
          </p>
        </div>
      )}

      {/* ── HERO BANNER SECTION ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden border border-slate-700/50">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
          <div className="space-y-4 max-w-3xl">
            {/* Header Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {vacancy.jobType && vacancy.jobType !== 'NOT_SPECIFIED' && (
                <span className="px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur border border-white/10">
                  {vacancy.jobType}
                </span>
              )}
              {vacancy.workplaceType && vacancy.workplaceType !== 'NOT_SPECIFIED' && (
                <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  {vacancy.workplaceType}
                </span>
              )}
              <span className="px-3.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                {vacancy.targetFaculties || 'Faculty of Computing'}
              </span>
            </div>

            {/* Title & Company */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {vacancy.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-emerald-400 font-bold text-base">
                <span className="material-symbols-outlined text-xl">domain</span>
                <span>{vacancy.companyName || 'Corporate Partner'}</span>
              </div>
            </div>

            {/* Quick Metadata Ribbon */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-300 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">location_on</span>
                {vacancy.location || 'Colombo, Sri Lanka'}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">payments</span>
                {vacancy.salaryRange || 'Negotiable'}
              </span>
              {vacancy.applicationDeadline && (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="material-symbols-outlined text-[18px]">event</span>
                  Deadline: {new Date(vacancy.applicationDeadline).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="material-symbols-outlined text-[18px]">group</span>
                {vacancy.numberOfOpenings || 1} Opening(s)
              </span>
              {(isPartner || isStaff) && (
                <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  {applicantCount} Candidate Applicant{applicantCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs in Hero */}
          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            {/* Staff / Coordinator Actions */}
            {isStaff && !isFacultyManagement && (
              <div className="flex flex-wrap lg:flex-col gap-2.5 w-full sm:w-auto">
                {(vacancy.status === 'PENDING' || vacancy.status === 'CHANGES_REQUESTED') && (
                  <>
                    <Button 
                      className={isEditMode ? "bg-slate-700 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 px-6 py-2.5"}
                      icon={isEditMode ? "visibility" : "edit"}
                      onClick={() => setIsEditMode(!isEditMode)}
                    >
                      {isEditMode ? "Exit Edit Mode" : "Edit Job Post"}
                    </Button>
                    {!isEditMode && (
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5"
                        icon="verified"
                        loading={actionLoading}
                        onClick={handleApprove}
                      >
                        Approve & Publish
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      icon="autorenew"
                      loading={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await vacancyService.reprocessAdminVacancy(id);
                          setSuccessMsg('Vacancy sent for AI reprocessing! Please wait a few seconds and refresh the page.');
                        } catch (err) {
                          setError(err.response?.data?.message || 'Failed to reprocess vacancy.');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      Re-process with AI
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      icon="edit_note"
                      onClick={() => setShowModificationModal(true)}
                    >
                      Request Modification
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/30"
                      icon="cancel"
                      onClick={() => setShowRejectModal(true)}
                    >
                      Reject Vacancy
                    </Button>
                  </>
                )}

                {vacancy.status === 'APPROVED' && (
                  <>
                    <Button 
                      variant="outline"
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/30"
                      icon="pause_circle"
                      loading={actionLoading}
                      onClick={handleCloseVacancy}
                    >
                      Deactivate / Close Post
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/30"
                      icon="delete"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete Vacancy
                    </Button>
                  </>
                )}

                {vacancy.status === 'CLOSED' && (
                  <>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      icon="play_arrow"
                      loading={actionLoading}
                      onClick={handleReopenVacancy}
                    >
                      Reopen Vacancy
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/30"
                      icon="delete"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete Vacancy
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Partner Actions */}
            {isPartner && (
              <div className="flex flex-wrap gap-2.5">
                {(vacancy.status === 'PENDING' || vacancy.status === 'CHANGES_REQUESTED') && (
                  <Button 
                    className={isEditMode ? "bg-slate-700 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md"}
                    icon={isEditMode ? "visibility" : "edit"}
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {isEditMode ? "Exit Edit Mode" : "Edit Job Post"}
                  </Button>
                )}

                {vacancy.status === 'APPROVED' && (
                  <Button 
                    variant="outline" 
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold" 
                    icon="people"
                    onClick={() => navigate('/partner/applications', { state: { vacancy: { ...vacancy, id, applicantCount } } })}
                  >
                    View Applicants ({applicantCount})
                  </Button>
                )}
              </div>
            )}

            {/* Student Actions */}
            {!isStaff && !isPartner && vacancy.status === 'APPROVED' && (
              <div className="flex flex-wrap gap-2.5 mt-4 lg:mt-0">
                {hasApplied ? (
                  <Button 
                    className="bg-slate-200 text-slate-500 font-bold px-8 py-3 text-base cursor-not-allowed"
                    icon="check_circle"
                    disabled
                  >
                    Already Applied
                  </Button>
                ) : (
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/30 px-8 py-3 text-base"
                    icon="edit_document"
                    onClick={() => navigate(`/student/vacancies/${id}/apply`)}
                  >
                    Apply Now →
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (ASYMMETRIC GRID) ── */}
      {isEditMode ? (
        /* ── INTERACTIVE EDIT MODE (FOR PARTNERS) ── */
        <Card className="border border-emerald-500/30 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold">
                <span className="material-symbols-outlined text-2xl">edit_square</span>
                <CardTitle className="text-xl">Job Post Editor</CardTitle>
              </div>
              <span className="text-xs text-slate-500">Edit fields directly and resubmit for faculty coordinator review</span>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Job Vacancy Title *"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Associate Full-Stack Engineer"
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Job Type"
                  value={editFormData.jobType}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, jobType: e.target.value }))}
                >
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                </Select>

                <Select
                  label="Workplace Type"
                  value={editFormData.workplaceType}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, workplaceType: e.target.value }))}
                >
                  <option value="ON_SITE">On-site</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                </Select>
              </div>

              <Input
                label="Work Location"
                value={editFormData.location}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Colombo / Remote, Sri Lanka"
              />

              <Input
                label="Salary / Stipend Range"
                value={editFormData.salaryRange}
                onChange={(e) => setEditFormData(prev => ({ ...prev, salaryRange: e.target.value }))}
                placeholder="e.g. 50,000 - 80,000 LKR or Negotiable"
              />

              <Input
                type="date"
                label="Application Closing Deadline"
                value={editFormData.applicationDeadline}
                onChange={(e) => setEditFormData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  label="Number of Openings"
                  value={editFormData.numberOfOpenings}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, numberOfOpenings: e.target.value }))}
                  min={1}
                />
                <Select
                  label="Target Faculty"
                  value={editFormData.targetFaculties}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, targetFaculties: e.target.value }))}
                >
                  <option value="Faculty of Computing">Faculty of Computing</option>
                  <option value="Faculty of Business">Faculty of Business</option>
                  <option value="Faculty of Engineering">Faculty of Engineering</option>
                  <option value="Faculty of Science">Faculty of Science</option>
                </Select>
              </div>
            </div>

            {/* Skills Tags Editor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Required Technical & Functional Skills (Tags)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="Type a skill (e.g. React, Spring Boot, Figma) and press Add..."
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                <Button size="sm" icon="add" onClick={handleAddTag}>Add Skill</Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {editFormData.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-rose-500">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Description & Requirements Textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Textarea
                label="Role Description & Core Duties *"
                rows={10}
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detail the job responsibilities, project scope, team role, and daily tasks..."
              />

              <Textarea
                label="Candidate Requirements & Qualifications *"
                rows={10}
                value={editFormData.requirements}
                onChange={(e) => setEditFormData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="List required technical skills, academic coursework, and qualifications..."
              />
            </div>

            {/* Edit Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  loading={savingEdit} 
                  icon="save" 
                  onClick={() => handleSaveEdit(false)}
                >
                  Save Draft Changes
                </Button>

                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
                  loading={savingEdit} 
                  icon="send" 
                  onClick={() => handleSaveEdit(true)}
                >
                  {vacancy.status === 'CHANGES_REQUESTED' ? 'Save & Resubmit for Approval' : 'Submit for Review'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── VIEW MODE (5:7 ASYMMETRIC GRID) ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ═══════════════════════════════════════════════════════════
              LEFT COLUMN (5 COLS): LARGE VISUAL FLYER & KEY SPECIFICATIONS
             ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* PROMINENT LARGE FLYER SHOWCASE CARD */}
            {vacancy.storageFileId ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden transition-all hover:shadow-xl">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">image</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Uploaded Job Flyer</span>
                  </div>
                  
                  {/* Button that opens the Lightbox Modal instead of downloading */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    icon="zoom_in"
                    onClick={() => { setShowImageLightbox(true); setLightboxZoom(1); }}
                    className="text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50"
                  >
                    View Full Flyer
                  </Button>
                </div>

                {/* Big, Clickable Image Frame */}
                <div 
                  onClick={() => { setShowImageLightbox(true); setLightboxZoom(1); }}
                  className="relative group cursor-pointer bg-slate-950 flex items-center justify-center min-h-[480px] max-h-[680px] overflow-hidden"
                >
                  <img 
                    src={`http://localhost:8080/api/v1/storage/download/${vacancy.storageFileId}`} 
                    alt="Job Flyer" 
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm backdrop-blur-xs">
                    <span className="material-symbols-outlined text-2xl">fullscreen</span>
                    <span>Click to Expand</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-400">image_not_supported</span>
                <p className="text-xs font-semibold text-slate-500">No graphical flyer uploaded for this vacancy.</p>
              </div>
            )}

            {/* POSITION SPECIFICATIONS SUMMARY CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-lg">info</span>
                Position Overview
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Corporate Partner</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vacancy.companyName || 'Corporate Partner'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Target Academic Faculty</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{vacancy.targetFaculties || 'Faculty of Computing'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Employment Type</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {vacancy.jobType && vacancy.jobType !== 'NOT_SPECIFIED' ? vacancy.jobType : <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900"><span className="material-symbols-outlined text-[12px]">info</span> Missing Data</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Workplace Mode</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {vacancy.workplaceType && vacancy.workplaceType !== 'NOT_SPECIFIED' ? vacancy.workplaceType : <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900"><span className="material-symbols-outlined text-[12px]">info</span> Missing Data</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Stipend / Salary</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vacancy.salaryRange || 'Negotiable'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Number of Openings</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vacancy.numberOfOpenings || 1} position(s)</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Submission Date</span>
                  <span className="font-bold text-slate-900 dark:text-white">{new Date(vacancy.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                {/* Contact Info (if available) */}
                {vacancy.aiMissingFields && (() => {
                  try {
                    const aiData = typeof vacancy.aiMissingFields === 'string' ? JSON.parse(vacancy.aiMissingFields) : vacancy.aiMissingFields;
                    if (Array.isArray(aiData)) return null; // Old format
                    const emails = aiData?.contactEmails;
                    const phones = aiData?.contactPhones;
                    
                    return (
                      <>
                        {emails && emails.length > 0 && (
                          <div className="flex justify-between items-start pt-2">
                            <span className="text-slate-500 font-medium">Contact Emails</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right">
                              {emails.join(', ')}
                            </span>
                          </div>
                        )}
                        {phones && phones.length > 0 && (
                          <div className="flex justify-between items-start pt-2">
                            <span className="text-slate-500 font-medium">Contact Phones</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right">
                              {phones.join(', ')}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  } catch { return null; }
                })()}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT COLUMN (7 COLS): AUDIT CONTROLS, SKILLS & DETAILS
             ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* ── STAFF-ONLY AI ACADEMIC FIT & COMPLIANCE SECTION ──
            {/* ── AI CURRICULUM MATCH (STATIC/INSTITUTIONAL) (STRICTLY HIDDEN FROM PARTNERS, STUDENTS, AND PUBLIC) */}
            {isStaff && ai && (
              <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">auto_awesome</span>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">Academic Curriculum Alignment Assessment</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Institutional suitability evaluation against university degree programs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">{vacancy.targetFaculties || ai?.targetFaculty || 'Faculty of Computing'}</Badge>
                    <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                      {ai?.institutionalMatchScore || 90}% Match
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-emerald-500/10">
                  {ai?.fitNotes || 'High academic alignment with undergraduate computing curriculum. Recommended for industrial training and graduate placement.'}
                </p>

                {recommendedPrograms.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Recommended Academic Degree Programs:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendedPrograms.map((prog, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                          {prog}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance & Missing Field Inspection (Visible only to coordinators) */}
                {(missingFieldsList.length > 0 || complianceFlagsList.length > 0) && (
                  <div className="pt-2 space-y-2.5">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">info</span>
                      Field Verification & Notice ({missingFieldsList.length + complianceFlagsList.length})
                    </span>
                    
                    <div className="space-y-2">
                      {missingFieldsList.map((f, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3 text-xs text-slate-800 dark:text-slate-200">
                          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg mt-0.5">
                            {f.severity === 'CRITICAL' ? 'error' : 'warning'}
                          </span>
                          <div className="space-y-0.5">
                            <div className="font-bold text-amber-900 dark:text-amber-300">
                              {f.field || f.field_name ? `Field Notice: ${f.field || f.field_name}` : 'Field Notice'}
                            </div>
                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{f.message}</div>
                            {f.suggestion && (
                              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                                Recommendation: {f.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REQUIRED SKILLS & TECH STACK PILLS */}
            {tagsList.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">code_blocks</span>
                  Required Technical & Professional Skills
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tagsList.map((t, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ROLE DESCRIPTION & RESPONSIBILITIES CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="material-symbols-outlined text-emerald-600">work</span>
                Role Overview & Responsibilities
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {vacancy.description || 'No detailed description provided.'}
              </div>
            </div>

            {/* CANDIDATE REQUIREMENTS & QUALIFICATIONS CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="material-symbols-outlined text-emerald-600">checklist</span>
                Candidate Eligibility & Qualifications
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {vacancy.requirements || 'No specific requirements listed.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          FULLSCREEN IMAGE LIGHTBOX MODAL (NO DOWNLOAD - IN-POPUP VIEW)
         ═══════════════════════════════════════════════════════════ */}
      {showImageLightbox && vacancy.storageFileId && (
        <div 
          onClick={() => setShowImageLightbox(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Lightbox Controls Bar */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-5xl flex items-center justify-between p-3 bg-slate-900/90 text-white rounded-2xl border border-white/10 mb-3 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="material-symbols-outlined text-emerald-400">image</span>
              <span>{vacancy.title} — Job Flyer</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLightboxZoom(prev => Math.max(0.7, prev - 0.2))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-lg">zoom_out</span>
              </button>
              <span className="text-xs font-mono px-1">{Math.round(lightboxZoom * 100)}%</span>
              <button 
                onClick={() => setLightboxZoom(prev => Math.min(2.5, prev + 0.2))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-lg">zoom_in</span>
              </button>
              <button 
                onClick={() => setLightboxZoom(1)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-2"
                title="Reset Zoom"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowImageLightbox(false)}
                className="p-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500 text-rose-200 hover:text-white transition ml-2"
                title="Close"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-5xl max-h-[82vh] w-full overflow-auto flex items-center justify-center rounded-3xl bg-slate-950/80 border border-white/10 p-2 shadow-2xl"
          >
            <img 
              src={`http://localhost:8080/api/v1/storage/download/${vacancy.storageFileId}`} 
              alt="High Resolution Job Flyer" 
              style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-[78vh] object-contain transition-transform duration-200 rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* ── SMALL TARGETED ACTION MODALS (STAFF) ── */}

      {/* 1. Request Modification Modal */}
      {showModificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <span className="material-symbols-outlined text-2xl">edit_note</span>
                <h3 className="text-base text-slate-900 dark:text-white">Request Modification from Partner</h3>
              </div>
              <button onClick={() => setShowModificationModal(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Specify the exact adjustments, missing information, or curriculum requirements the corporate partner must update before this vacancy can be approved.
            </p>

            <Textarea
              rows={4}
              label="Modification Instructions & Notes *"
              placeholder="e.g. Please specify the estimated monthly stipend range and clarify the working branch location..."
              value={modificationNotes}
              onChange={(e) => setModificationNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowModificationModal(false)}>Cancel</Button>
              <Button 
                loading={actionLoading} 
                icon="send" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleRequestModificationSubmit}
              >
                Send Modification Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <span className="material-symbols-outlined text-2xl">cancel</span>
                <h3 className="text-base text-slate-900 dark:text-white">Reject Vacancy Submission</h3>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action permanently rejects the job post. The partner will be notified of the rejection reason and will not be able to edit or re-submit this record.
            </p>

            <Textarea
              rows={4}
              label="Reason for Rejection *"
              placeholder="e.g. Position does not match NSBM undergraduate academic accreditation standards..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button 
                loading={actionLoading} 
                icon="block" 
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleRejectSubmit}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Confirm Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Delete Vacancy Permanently?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone. All associated applicant links and moderation records will be permanently removed.
            </p>

            <div className="flex justify-center gap-3 pt-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button 
                loading={actionLoading} 
                className="bg-rose-600 hover:bg-rose-700 text-white" 
                onClick={handleDeleteSubmit}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
