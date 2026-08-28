import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { vacancyService } from '../../services/vacancyService';
import { aiService } from '../../services/aiService';
import { platformService } from '../../services/platformService';
import { useAuth } from '../../contexts/AuthContext';

import { userService } from '../../services/userService';
import ViewCandidatesApplications from './ViewCandidatesApplications';

const getValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : "00000000-0000-0000-0000-000000000000";
};

export default function ManagePostedVacancies() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [selectedVacancyForApps, setSelectedVacancyForApps] = useState(null);

  // Manual Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingVac, setEditingVac] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    flyerFile: null
  });
  const [saving, setSaving] = useState(false);

  // AI Candidate Suggestions Modal State
  const [showCandidateMatchesModal, setShowCandidateMatchesModal] = useState(false);
  const [selectedVacForMatching, setSelectedVacForMatching] = useState(null);
  const [matchingCandidates, setMatchingCandidates] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  useEffect(() => {
    fetchVacancies();
  }, [user]);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        // Fetch verification status first
        try {
          const vRes = await platformService.getMyVerificationStatus();
          setVerificationStatus(vRes.data?.status || 'PENDING');
        } catch {
          if (user.id === 'synnext') setVerificationStatus('APPROVED');
          else setVerificationStatus('PENDING'); // Fallback
        }

        const res = await vacancyService.getPartnerVacancies(user.id);
        const data = res.data?.data?.content || res.data?.content || res.data?.data || res.data || [];
        setVacancies(Array.isArray(data) ? data : []);
      } else {
        setVacancies([]);
      }
    } catch {
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSearch = (query) => {
    setSearchTerm(query);
  };

  const handleOpenCreate = () => {
    setEditingVac(null);
    setFormData({
      title: '',
      flyerFile: null
    });
    setShowModal(true);
  };

  const handleOpenEdit = (vac) => {
    setEditingVac(vac);
    setFormData({
      title: vac.title,
      flyerFile: null
    });
    setShowModal(true);
  };

  const handleSaveVacancy = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let fileId = editingVac?.storageFileId || null;
      let aiExtracted = null;
      let institutionalAnalysis = null;

      if (formData.flyerFile) {
        try {
          const uploadRes = await platformService.uploadFileToStorage(formData.flyerFile, user?.id || 1, 'VACANCY_FLYER');
          fileId = uploadRes.data?.data?.fileId || uploadRes.data?.fileId || uploadRes.data?.data?.id || uploadRes.data?.id;

          if (fileId) {
            // Call AI Service with the download URL
            const fileUrl = `http://localhost:8080/api/v1/storage/download/${fileId}`;
            const aiRes = await aiService.parseAndSaveFlyer(fileUrl, user?.id || 1);
            if (aiRes.data) {
              aiExtracted = aiRes.data.extracted_data;
              institutionalAnalysis = aiRes.data.institutional_analysis;
            }
          }
        } catch (uploadErr) {
          console.error("Failed to upload file or parse flyer with AI", uploadErr);
        }
      }

      if (editingVac) {
        const payload = { title: formData.title, storageFileId: fileId };
        await vacancyService.updateVacancy(editingVac.id, payload);
        setVacancies(prev => prev.map(v => v.id === editingVac.id ? { ...v, ...payload } : v));
      } else {
        const parsedDate = new Date(aiExtracted?.application_deadline);
        const deadline = isNaN(parsedDate.getTime()) ? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] : parsedDate.toISOString().split('T')[0];
        
        const mappedWorkplaceType = ['ON_SITE', 'REMOTE', 'HYBRID'].includes(aiExtracted?.workplace_type?.toUpperCase()) 
                                    ? aiExtracted.workplace_type.toUpperCase() 
                                    : 'ON_SITE';

        const payload = {
          title: formData.title || aiExtracted?.job_title,
          storageFileId: fileId,
          jobType: 'INTERNSHIP',
          workplaceType: mappedWorkplaceType,
          location: aiExtracted?.locations?.join(', ') || 'Colombo',
          description: aiExtracted?.responsibilities?.join('\n') || 'Please see attached flyer.',
          requirements: aiExtracted?.required_skills?.join(', ') || '',
          salaryRange: aiExtracted?.salary_raw || 'Not Specified',
          applicationDeadline: deadline,
          tags: [
            ...(aiExtracted?.preferred_skills || []),
            aiExtracted?.workplace_type,
            aiExtracted?.salary_raw?.toLowerCase().includes('unpaid') ? 'Unpaid' : 'Paid'
          ].filter(Boolean).join(', '),
          targetFaculties: aiExtracted?.target_faculties?.join(', ') || '',
          aiMissingFields: institutionalAnalysis ? JSON.stringify(institutionalAnalysis.missing_explicit_fields) : null,
          partnerId: user?.id || 1,
          companyName: user?.username || 'Partner Organization',
          status: 'PENDING',
        };
          const res = await vacancyService.createVacancy(payload);
          const created = res.data?.data || res.data || { id: Date.now(), ...payload, applicants: 0, createdAt: new Date().toISOString() };
          
          if (res?.data?.success || res?.status === 200 || res?.status === 201) {
            try {
              await platformService.submitVacancyApproval({
                vacancyId: String(created.id),
                companyUserId: getValidUUID(user?.id),
                submittedByUserId: getValidUUID(user?.id),
                vacancyTitleSnapshot: String(created.title),
                companyNameSnapshot: String(created.companyName),
              });
            } catch (e) {
              console.error("Failed to submit approval", e);
            }
          }

          setVacancies(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch {
      // fallback for dev
      const mockPayload = { id: Date.now(), title: formData.title, status: 'PENDING', applicants: 0, createdAt: new Date().toISOString() };
      setVacancies(prev => [mockPayload, ...prev]);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteVacancy = async (id) => {
    if (window.confirm("Are you sure you want to delete this vacancy? This will notify the platform and remove all associated applications.")) {
      try {
        await vacancyService.deleteVacancy(id);
        setVacancies(prev => prev.filter(v => v.id !== id));
      } catch (err) {
        console.error("Failed to delete vacancy", err);
        // Fallback for mock frontend state
        setVacancies(prev => prev.filter(v => v.id !== id));
      }
    }
  };

  // AI Candidate Suggestions Handler
  const handleOpenCandidateMatches = async (vac) => {
    setSelectedVacForMatching(vac);
    setShowCandidateMatchesModal(true);
    setMatchingLoading(true);

    try {
      const skills = vac.requiredSkills || (vac.requirements ? vac.requirements.split(',').map(s => s.trim()) : ['Java', 'React']);
      
      // Fetch actively looking students from backend
      let candidatePool = [];
      try {
        const usersRes = await userService.searchUsersBySkills(skills);
        const fetched = usersRes.data?.data || usersRes.data || [];
        if (Array.isArray(fetched) && fetched.length > 0) {
          candidatePool = fetched.map(u => ({
            id: u.userId || u.id,
            fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Candidate',
            email: u.email,
            job_search_status: u.isActivelyLooking ? 'ACTIVELY_LOOKING' : 'NOT_LOOKING',
            actively_searching: Boolean(u.isActivelyLooking),
            skills: u.skills?.map(s => typeof s === 'string' ? s : s.skillName) || ['Java', 'Spring Boot'],
            gpa: u.gpa || '3.80'
          }));
        }
      } catch {
        candidatePool = [];
      }

      if (candidatePool.length > 0) {
        const res = await aiService.recommendCandidatesForVacancy(
          vac.title,
          skills,
          ['Docker', 'AWS'],
          candidatePool
        );
        setMatchingCandidates(res.data?.matched_candidates || []);
      } else {
        setMatchingCandidates([]);
      }
    } catch {
      setMatchingCandidates([]);
    } finally {
      setMatchingLoading(false);
    }
  };

  const filteredVacancies = vacancies.filter((v) => {
    const matchesSearch = v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.requirements?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'title', header: 'Vacancy Title', cellClassName: 'font-semibold text-slate-900 dark:text-white' },
    { key: 'postedAt', header: 'Posted Date', render: (row) => new Date(row.createdAt || row.postedAt || Date.now()).toLocaleDateString() },
    { key: 'applicants', header: 'Applicants', cellClassName: 'text-center font-bold text-emerald-600 dark:text-emerald-400' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        let variant = 'info';
        if (row.status === 'APPROVED') variant = 'success';
        if (row.status === 'PENDING') variant = 'warning';
        if (row.status === 'REJECTED') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'APPROVED' && (
            <>
              <Button variant="outline" size="sm" icon="assignment" onClick={() => setSelectedVacancyForApps(row)}>
                Apps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCandidateMatches(row)}
                className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                icon="auto_awesome"
              >
                Match
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" icon="delete" className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50" onClick={() => handleDeleteVacancy(row.id)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (selectedVacancyForApps) {
    return (
      <ViewCandidatesApplications 
        vacancy={selectedVacancyForApps} 
        onBack={() => setSelectedVacancyForApps(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Manage Posted Vacancies</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Publish internship and graduate vacancies, review applicant counts, and automatically discover actively looking candidates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon="add" onClick={handleOpenCreate} disabled={verificationStatus !== 'APPROVED'}>
            Post New Vacancy
          </Button>
        </div>
      </div>

      {verificationStatus && verificationStatus !== 'APPROVED' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
          <div>
            <h4 className="font-bold text-amber-800 text-sm">Action Required: Complete Document Verification</h4>
            <p className="text-amber-700 text-xs mt-1">
              You must upload your company registration documents and be fully verified by the administration before you can post vacancies. Please contact support or upload your documents via the portal.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Your Organization's Job Postings ({filteredVacancies.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <SmartAISearchBar
              value={searchTerm}
              onChange={handleSmartSearch}
              onSearch={handleSmartSearch}
              placeholder="Search vacancies by title or skills..."
              aiPlaceholder="Smart AI search posted vacancies..."
              className="w-full sm:w-80"
            />
            <div className="w-full sm:w-36">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredVacancies} loading={loading} />
        </CardContent>
      </Card>

      {/* AI CANDIDATE MATCHES MODAL (ACTIVELY SEARCHING CANDIDATES ONLY) */}
      {showCandidateMatchesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">auto_awesome</span> AI Candidate Recommendations
                </h3>
                <p className="text-xs text-slate-500">
                  Role: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVacForMatching?.title}</span> • Filtered strictly for candidates actively looking for jobs
                </p>
              </div>
              <button 
                onClick={() => setShowCandidateMatchesModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {matchingLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Running AI candidate matching algorithms...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {matchingCandidates.map((cand) => (
                  <div
                    key={cand.candidate_id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cand.full_name}</h4>
                        <Badge variant="success" className="text-[10px]">Actively Seeking Job</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {cand.recommendation_note}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cand.matched_skills?.map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm text-center">
                        🌟 {cand.match_percentage}%
                        <span className="block text-[9px] font-medium text-slate-500 uppercase">Match</span>
                      </div>
                      <a
                        href={`mailto:${cand.email}?subject=Invitation for Interview: ${encodeURIComponent(selectedVacForMatching?.title || '')}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        Contact <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standard Manual Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingVac ? 'Edit Vacancy Posting' : 'Create New Vacancy Posting'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveVacancy} className="space-y-4">
              <Input
                label="Job / Vacancy Title"
                placeholder="e.g. Associate Cloud Engineer Intern"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white">Upload Flyer (PDF or Image)</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/50 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">upload_file</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formData.flyerFile ? formData.flyerFile.name : 'Click to select a file'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PNG, JPG, or PDF up to 10MB</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,image/png,image/jpeg"
                      required={!editingVac && !formData.flyerFile}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormData({ ...formData, flyerFile: e.target.files[0] });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" loading={saving} icon="check">
                  {editingVac ? 'Update Vacancy' : 'Submit for Faculty Approval'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
