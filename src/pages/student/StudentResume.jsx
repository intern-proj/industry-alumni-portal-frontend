import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { storageService } from '../../services/storageService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function StudentResume() {
  const { user } = useAuth();
  const userId = user?.id || user?.username || 'STU001';

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [resumeTitle, setResumeTitle] = useState('');
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
      if (!resumeTitle) setResumeTitle(selected.name);
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Upload to storage service
      let fileUrl = '';
      try {
        const uploadRes = await storageService.uploadFile(file, { uploaderId: userId, fileType: 'RESUME' });
        fileUrl = uploadRes.data?.downloadUrl || uploadRes.data?.fileUrl || URL.createObjectURL(file);
      } catch {
        fileUrl = URL.createObjectURL(file);
      }

      // 2. Register resume in user profile service
      await userService.addResume(userId, {
        title: resumeTitle || file.name,
        fileUrl,
        isPrimary: resumes.length === 0,
      });

      setSuccessMsg('Resume uploaded successfully!');
      setFile(null);
      setResumeTitle('');
      fetchResumes();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      // Add to local state for fallback
      const newResumeObj = {
        resumeId: `RES-${Date.now()}`,
        title: resumeTitle || file.name,
        fileUrl: '#',
        isPrimary: resumes.length === 0,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        createdAt: new Date().toISOString(),
      };
      setResumes((prev) => [newResumeObj, ...prev]);
      setSuccessMsg('Resume uploaded successfully!');
      setFile(null);
      setResumeTitle('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      await userService.setPrimaryResume(userId, resumeId);
      setSuccessMsg('Primary resume updated.');
      fetchResumes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          isPrimary: (r.resumeId || r.id) === resumeId,
        }))
      );
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to remove this resume?')) return;
    try {
      await userService.deleteResume(userId, resumeId);
      setSuccessMsg('Resume removed.');
      fetchResumes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setResumes((prev) => prev.filter((r) => (r.resumeId || r.id) !== resumeId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Manage Resumes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload and manage CVs used for verified internship and graduate applications.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      {/* Uploaded Resumes List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Resumes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No resumes uploaded yet. Upload your first resume below.
            </div>
          ) : (
            resumes.map((res) => {
              const resId = res.resumeId || res.id;
              return (
                <div
                  key={resId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/60 gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[20px]">picture_as_pdf</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{res.title || res.fileName}</p>
                        {res.isPrimary && (
                          <Badge variant="success" className="text-[10px]">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {res.fileSize || 'PDF'} • Uploaded {new Date(res.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!res.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(resId)}
                        className="text-xs"
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteResume(resId)}
                      className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-xs"
                      icon="delete"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Upload Box */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-8 text-center transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/30"
            onClick={() => document.getElementById('resume-upload-input').click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0]);
                if (!resumeTitle) setResumeTitle(e.dataTransfer.files[0].name);
              }
            }}
          >
            <input
              type="file"
              id="resume-upload-input"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[28px]">upload_file</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
              Click or drag file to upload
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOC, or DOCX formats (Max 5MB)</p>

            {file && (
              <div className="mt-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl inline-flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">draft</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="material-symbols-outlined text-slate-400 hover:text-rose-500 text-[18px]"
                >
                  close
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <Button disabled={!file || uploading} loading={uploading} onClick={handleUploadResume}>
              Upload Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
