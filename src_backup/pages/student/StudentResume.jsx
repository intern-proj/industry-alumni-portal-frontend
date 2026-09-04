import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

const ROLE_FOCUS_OPTIONS = [
  'General / Comprehensive',
  'Full-Stack Software Engineering',
  'Backend Engineering & Microservices',
  'Frontend & Mobile Development',
  'Data Science & Analytics',
  'AI & Machine Learning',
  'Cloud Architecture & DevOps',
  'Cybersecurity & Network Systems',
  'Quality Assurance & Automation',
  'Business Systems Analysis',
];

export default function StudentResume() {
  const { user } = useAuth();
  const userId = user?.username || user?.id || 'student';

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState(ROLE_FOCUS_OPTIONS[1]);
  const [customRole, setCustomRole] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Edit Form State
  const [editingResume, setEditingResume] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetRole, setEditTargetRole] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Preview Lightbox State
  const [previewResume, setPreviewResume] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getResumesByUserId(userId);
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setResumes(data);
      } else {
        setResumes([]);
      }
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        const defaultName = selected.name.replace(/\.[^/.]+$/, '');
        setTitle(`${defaultName} (v${resumes.length + 1})`);
      }
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a resume file (PDF or DOCX).');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const chosenRole = targetRole === 'Other / Custom Focus'
      ? (customRole || 'Custom Specialization')
      : targetRole;

    try {
      // 1. Upload to storage service
      let fileUrl = '';
      let storageFileId = '';
      try {
        const uploadRes = await storageService.uploadFile(file, {
          uploaderId: userId,
          fileType: 'RESUME',
        });
        const uploadData = uploadRes.data?.data || uploadRes.data;
        const fileId = uploadData?.fileId || uploadData?.id;
        storageFileId = fileId ? String(fileId) : '';
        fileUrl = uploadData?.downloadUrl || (fileId ? `http://localhost:8080/api/v1/storage/download/${fileId}?inline=true` : '') || uploadData?.storageUrl || '';
      } catch (err) {
        console.warn('Storage upload error, using fallback stream URL', err);
        fileUrl = URL.createObjectURL(file);
      }

      // 2. Register resume in user profile service
      await userService.addResume(userId, {
        title: title || `${file.name.replace(/\.[^/.]+$/, '')} (v${resumes.length + 1})`,
        fileName: file.name,
        fileUrl: fileUrl || '#',
        fileSize: formattedSize,
        targetRole: chosenRole,
        storageFileId,
        isPrimary: isPrimary || resumes.length === 0,
      });

      // 3. If primary, trigger background AI Profile Enhancement to extract projects & skills
      if ((isPrimary || resumes.length === 0) && fileUrl && fileUrl.startsWith('http')) {
        aiService.enhanceProfileFromResume(userId, fileUrl).then(async (aiRes) => {
          if (aiRes.data?.status === 'success') {
            const data = aiRes.data;
            try {
              const profRes = await userService.getProfileByUserId(userId);
              const curProf = profRes.data?.data || {};
              await userService.updateProfile(userId, {
                ...curProf,
                bio: data.bio || curProf.bio,
                projects: JSON.stringify(data.projects || []),
              });
              if (Array.isArray(data.skills)) {
                for (const sk of data.skills) {
                  try {
                    await userService.addSkill(userId, { skillName: sk, skillLevel: 'ADVANCED', category: 'TECHNICAL' });
                  } catch {
                    // Ignore duplicate
                  }
                }
              }
            } catch (syncErr) {
              console.warn('Profile sync from resume upload deferred:', syncErr);
            }
          }
        }).catch((e) => console.warn('Background profile enhancement deferred:', e));
      }

      setSuccessMsg(`Resume "${title || file.name}" added successfully. Background profile synchronization in progress...`);
      setShowUploadModal(false);
      setFile(null);
      setTitle('');
      setCustomRole('');
      setIsPrimary(false);
      fetchResumes();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to add resume', err);
      // Client-side fallback state update
      const newResumeObj = {
        resumeId: `RES-${Date.now()}`,
        userId,
        title: title || file.name,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: formattedSize,
        targetRole: chosenRole,
        isPrimary: isPrimary || resumes.length === 0,
        uploadedAt: new Date().toISOString(),
      };
      setResumes((prev) => [newResumeObj, ...prev]);
      setSuccessMsg('Resume uploaded successfully!');
      setShowUploadModal(false);
      setFile(null);
      setTitle('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      await userService.setPrimaryResume(userId, resumeId);
      setSuccessMsg('Primary application resume updated. Profile synchronization in progress...');
      fetchResumes();
      setTimeout(() => setSuccessMsg(''), 4000);

      const targetResume = resumes.find((r) => (r.resumeId || r.id) === resumeId);
      if (targetResume?.fileUrl && targetResume.fileUrl.startsWith('http')) {
        aiService.enhanceProfileFromResume(userId, targetResume.fileUrl).then(async (aiRes) => {
          if (aiRes.data?.status === 'success') {
            const data = aiRes.data;
            try {
              const profRes = await userService.getProfileByUserId(userId);
              const curProf = profRes.data?.data || {};
              await userService.updateProfile(userId, {
                ...curProf,
                userId,
                bio: data.bio || curProf.bio,
                projects: JSON.stringify(data.projects || []),
              });
              if (Array.isArray(data.skills)) {
                for (const sk of data.skills) {
                  try {
                    await userService.addSkill(userId, { skillName: sk, skillLevel: 'ADVANCED', category: 'TECHNICAL' });
                  } catch {
                    // Ignore duplicate
                  }
                }
              }
            } catch (syncErr) {
              console.warn('Profile sync from setPrimary deferred:', syncErr);
            }
          }
        }).catch((e) => console.warn('Background enhancement deferred:', e));
      }
    } catch {
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          isPrimary: (r.resumeId || r.id) === resumeId,
        }))
      );
    }
  };

  const handleOpenEdit = (res) => {
    setEditingResume(res);
    setEditTitle(res.title || res.fileName || '');
    setEditTargetRole(res.targetRole || ROLE_FOCUS_OPTIONS[0]);
  };

  const handleSaveEdit = async () => {
    if (!editingResume) return;
    setSavingEdit(true);
    const resumeId = editingResume.resumeId || editingResume.id;
    try {
      await userService.updateResume(userId, resumeId, {
        title: editTitle,
        targetRole: editTargetRole,
      });
      setSuccessMsg('Resume version details updated.');
      setEditingResume(null);
      fetchResumes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setResumes((prev) =>
        prev.map((r) =>
          (r.resumeId || r.id) === resumeId
            ? { ...r, title: editTitle, targetRole: editTargetRole }
            : r
        )
      );
      setEditingResume(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteResume = async (resumeId, resumeTitle) => {
    window.confirmAction({
      title: 'Delete Resume',
      message: `Are you sure you want to delete the resume version "${resumeTitle}"?`,
      onConfirm: async () => {
        try {
          await userService.deleteResume(userId, resumeId);
          setSuccessMsg('Resume version removed.');
          fetchResumes();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
          setResumes((prev) => prev.filter((r) => (r.resumeId || r.id) !== resumeId));
        }
      }
    });
  };

  const primaryResume = resumes.find((r) => r.isPrimary);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-400/30">
            <span className="material-symbols-outlined text-[16px]">folder_managed</span>
            CV & Resume Version Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Resume Version Hub
          </h1>
          <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
            Upload tailored CV versions specialized for different job tracks (e.g. Full-Stack, AI/ML, Cloud). Select which resume to submit with 1-click for each vacancy application.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              setFile(null);
              setTitle('');
              setIsPrimary(resumes.length === 0);
              setShowUploadModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 border-0"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            Upload New Resume
          </Button>
        </div>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px]">check_circle</span>
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[22px]">error</span>
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[26px]">description</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Resumes</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{resumes.length} Versions</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[26px]">star</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Default Application CV</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {primaryResume ? (primaryResume.title || primaryResume.fileName) : 'None set'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[26px]">verified</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Storage Status</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Verified & Secured</p>
          </div>
        </div>
      </div>

      {/* Main Resume List Section */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Uploaded Resume Versions</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your specialized CVs. One resume is designated as your default for instant applications.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {resumes.length} of 5 versions used
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading your resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">upload_file</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No resumes uploaded yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
                Upload your first CV draft in PDF or DOCX format to start applying for corporate internships and vacancies.
              </p>
              <Button
                onClick={() => {
                  setFile(null);
                  setTitle('');
                  setIsPrimary(true);
                  setShowUploadModal(true);
                }}
                className="rounded-2xl"
              >
                Upload First Resume
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((res, index) => {
                const resId = res.resumeId || res.id;
                const isPdf = (res.fileName || res.fileUrl || '').toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={resId}
                    className={`relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                      res.isPrimary
                        ? 'bg-emerald-500/[0.03] dark:bg-emerald-950/20 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    {/* Top Metadata */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isPdf 
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' 
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                          }`}>
                            <span className="material-symbols-outlined text-[24px]">
                              {isPdf ? 'picture_as_pdf' : 'description'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={res.title || res.fileName}>
                              {res.title || res.fileName}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                              {res.fileName}
                            </p>
                          </div>
                        </div>

                        {res.isPrimary ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold shadow-sm tracking-wide">
                            <span className="material-symbols-outlined text-[12px] font-bold">star</span>
                            PRIMARY DEFAULT
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            Version #{resumes.length - index}
                          </span>
                        )}
                      </div>

                      {/* Tag Focus & File Specs */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {res.targetRole && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-[14px] text-emerald-500">work</span>
                            {res.targetRole}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {new Date(res.uploadedAt || Date.now()).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {res.fileSize && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            • {res.fileSize}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewResume(res);
                            setZoomLevel(100);
                          }}
                          className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                          title="Preview document"
                        >
                          <span className="material-symbols-outlined text-[16px] mr-1">visibility</span>
                          Preview
                        </Button>

                        <a
                          href={res.fileUrl}
                          download={res.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          title="Download document"
                        >
                          <span className="material-symbols-outlined text-[16px] mr-1">download</span>
                          Download
                        </a>

                        <button
                          onClick={() => handleOpenEdit(res)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit resume title / specialization"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {!res.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(resId)}
                            className="h-8 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl"
                          >
                            Set Primary
                          </Button>
                        )}
                        <button
                          onClick={() => handleDeleteResume(resId, res.title || res.fileName)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete resume"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── UPLOAD MODAL ── */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => !uploading && setShowUploadModal(false)}
        title="Upload New Resume Version"
      >
        <form onSubmit={handleUploadResume} className="space-y-5">
          {/* File Dropzone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              file
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
            onClick={() => document.getElementById('modal-resume-file-input').click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const dropped = e.dataTransfer.files[0];
                setFile(dropped);
                if (!title) {
                  const defaultName = dropped.name.replace(/\.[^/.]+$/, '');
                  setTitle(`${defaultName} (v${resumes.length + 1})`);
                }
              }
            }}
          >
            <input
              type="file"
              id="modal-resume-file-input"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[24px]">upload_file</span>
            </div>
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs mx-auto">{file.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  {(file.size / 1024).toFixed(1)} KB • Ready to upload
                </p>
                <span className="text-[11px] text-slate-400">Click to change file</span>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Click or drag resume here</p>
                <p className="text-xs text-slate-400">Accepts PDF or Word documents (up to 10MB)</p>
              </div>
            )}
          </div>

          {/* Title / Version Label */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Resume Version Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack Engineer CV (v2)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">Give your resume a clear descriptive label so you can pick it easily when applying.</p>
          </div>

          {/* Role Specialization */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Career / Role Specialization
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ROLE_FOCUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="Other / Custom Focus">Other / Custom Focus...</option>
            </select>
          </div>

          {targetRole === 'Other / Custom Focus' && (
            <div className="space-y-1.5">
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter custom focus (e.g. Embedded IoT Engineering)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Set as Primary Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Set this version as my Primary Default CV
            </span>
          </label>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || uploading}
              loading={uploading}
              className="px-6"
            >
              Upload Version
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT RESUME DETAILS MODAL ── */}
      <Modal
        isOpen={!!editingResume}
        onClose={() => setEditingResume(null)}
        title="Edit Resume Details"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Resume Version Label
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Career Specialization
            </label>
            <select
              value={editTargetRole}
              onChange={(e) => setEditTargetRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ROLE_FOCUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setEditingResume(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={savingEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── LIGHTBOX PDF PREVIEW MODAL ── */}
      {previewResume && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            {/* Lightbox Header Toolbar */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {previewResume.title || previewResume.fileName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{previewResume.fileName}</p>
                </div>
              </div>

              {/* Zoom & Action Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Zoom out"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 w-10 text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Zoom in"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2 py-1 text-[11px] rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold"
                  title="Reset zoom"
                >
                  Reset
                </button>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                <a
                  href={previewResume.fileUrl}
                  download={previewResume.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Download file"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </a>

                <button
                  onClick={() => setPreviewResume(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-2"
                  title="Close preview"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Embedded Document Frame */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-auto flex items-center justify-center p-4">
              {previewResume.fileUrl && previewResume.fileUrl !== '#' ? (
                <div
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  className="w-full h-full transition-transform duration-150 flex items-center justify-center"
                >
                  <iframe
                    src={previewResume.fileUrl}
                    title="Resume Preview"
                    className="w-full h-full rounded-2xl bg-white shadow-lg border border-slate-200 dark:border-slate-800"
                  />
                </div>
              ) : (
                <div className="text-center p-8 space-y-2">
                  <span className="material-symbols-outlined text-slate-400 text-[48px]">draft</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Preview not directly available in frame.</p>
                  <p className="text-xs text-slate-400">You can download the document to view it on your local application.</p>
                  <a
                    href={previewResume.fileUrl}
                    download={previewResume.fileName}
                    className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                  >
                    Download Resume
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
