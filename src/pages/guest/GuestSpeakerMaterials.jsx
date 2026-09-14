import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';

export default function GuestSpeakerMaterials() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const profileRes = await eventService.getMe();
      setProfile(profileRes.data);

      if (profileRes.data?.id) {
        const matRes = await storageService.getFiles({ uploaderId: `speaker-${profileRes.data.id}` });
        const list = Array.isArray(matRes.data)
          ? matRes.data
          : Array.isArray(matRes.data?.content)
          ? matRes.data.content
          : [];
        setMaterials(list);
      }
    } catch (err) {
      console.error('Failed to load speaker materials', err);
      setErrorMsg('Failed to load existing presentation materials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMaterialUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile?.id) return;
    setUploadingMaterial(true);
    try {
      await storageService.uploadFile(file, { uploaderId: `speaker-${profile.id}`, fileType: 'OTHER' });
      const matRes = await storageService.getFiles({ uploaderId: `speaker-${profile.id}` });
      const list = Array.isArray(matRes.data) ? matRes.data : matRes.data?.content || [];
      setMaterials(list);
      if (window.toast) window.toast.success(`Successfully uploaded "${file.name}"!`);
    } catch (err) {
      console.error('Upload failed', err);
      if (window.toast) window.toast.error('Failed to upload material. Please try again.');
    } finally {
      setUploadingMaterial(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await storageService.downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      if (window.toast) window.toast.error('Failed to download material.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Presentation & Session Materials
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Upload and share presentation slides, handouts, and workshop code resources for your sessions.
          </p>
        </div>
        <div className="relative">
          <input
            type="file"
            id="speaker-material-upload"
            className="hidden"
            onChange={handleMaterialUpload}
            disabled={uploadingMaterial}
          />
          <Button
            variant="primary"
            size="sm"
            icon="upload"
            loading={uploadingMaterial}
            onClick={() => document.getElementById('speaker-material-upload')?.click()}
            className="bg-purple-600 hover:bg-purple-700 text-xs font-semibold"
          >
            Upload New Material
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      {/* Upload Zone Card */}
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <CardContent className="py-10 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Drag & drop or select files</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Supports PDF slide decks, PPTX presentations, ZIP code archives, and reference documents up to 50MB.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('speaker-material-upload')?.click()}
            loading={uploadingMaterial}
            className="text-xs"
          >
            Choose File From Device
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Materials List */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[20px]">folder</span>
            <CardTitle className="text-base font-bold">Uploaded Materials ({materials.length})</CardTitle>
          </div>
          <Button variant="ghost" size="xs" icon="refresh" onClick={loadData}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading uploaded materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">description</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No session materials uploaded yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Use the upload button above to add presentation slides, code examples, or reference reading for student attendees.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {materials.map((file) => (
                <div
                  key={file.fileId}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">description</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {file.originalFilename || 'Presentation File'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>Uploaded on {new Date(file.uploadTimestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {file.sizeBytes && (
                          <span>• {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon="download"
                    className="text-xs shrink-0"
                    onClick={() => handleDownload(file.fileId, file.originalFilename || 'material.pdf')}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
