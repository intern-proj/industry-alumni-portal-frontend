import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';

export default function GuestSpeakerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [speaker, setSpeaker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Materials
  const [materials, setMaterials] = useState([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventService.getSpeakerById(id);
      setSpeaker(res.data);
      setEditData(res.data);

      const matRes = await storageService.getFiles({ uploaderId: `speaker-${id}` });
      setMaterials(matRes.data || []);
    } catch (err) {
      setErrorMsg('Failed to load guest speaker profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    window.confirmAction({
      title: 'Delete Speaker Profile',
      message: 'Are you sure you want to delete this speaker profile?',
      onConfirm: async () => {
        try {
          await eventService.deleteSpeaker(id);
          navigate('/staff/speakers');
        } catch (err) {
          window.toast.error('Failed to delete speaker.');
        }
      }
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await eventService.updateSpeaker(id, editData);
      setSpeaker(editData);
      setIsEditing(false);
    } catch (err) {
      window.toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleMaterialUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMaterial(true);
    try {
      await storageService.uploadFile(file, { uploaderId: `speaker-${id}`, fileType: 'OTHER' });
      // Reload materials
      const matRes = await storageService.getFiles({ uploaderId: `speaker-${id}` });
      setMaterials(matRes.data || []);
    } catch (err) {
      console.error('Failed to upload material', err);
      window.toast.error('Failed to upload material.');
    } finally {
      setUploadingMaterial(false);
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
      window.toast.error('Failed to download material.');
    }
  };

  const handleSendInvite = async () => {
    try {
      setSuccessMsg('');
      await eventService.sendInvite(id);
      setSuccessMsg('Invitation sent successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      window.toast.error('Failed to send invite.');
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (errorMsg || !speaker) {
    return <div className="p-4 text-rose-500 bg-rose-50 rounded">{errorMsg || 'Speaker not found.'}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/staff/speakers')} className="p-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Guest Speaker Profile</h1>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              <Button variant="outline" className="text-rose-600 border-rose-200" onClick={handleDelete}>Delete Profile</Button>
              <Button variant="primary" icon="mail" onClick={handleSendInvite}>Send Invite</Button>
            </>
          )}
        </div>
      </div>
      
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-md">
                  {speaker.photoUrl ? (
                    <img src={storageService.getFileUrl(speaker.photoUrl)} alt={speaker.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300">person</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="pt-16 pb-6 px-6 flex flex-col items-center text-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{speaker.fullName}</h2>
              <p className="text-sm font-medium text-blue-600 mt-1">{speaker.title || 'Guest Speaker'}</p>
              {speaker.company && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">domain</span>
                  {speaker.company}
                </div>
              )}

              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-indigo-500 text-lg">email</span>
                  <a href={`mailto:${speaker.email}`} className="hover:underline truncate">{speaker.email}</a>
                </div>
                {speaker.phone && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-indigo-500 text-lg">phone</span>
                    <span>{speaker.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biography & Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={saveEdit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" name="fullName" value={editData.fullName} onChange={handleEditChange} required />
                    <Input label="Email" name="email" value={editData.email} onChange={handleEditChange} required />
                    <Input label="Company" name="company" value={editData.company} onChange={handleEditChange} />
                    <Input label="Designation" name="title" value={editData.title} onChange={handleEditChange} />
                    <Input label="Phone" name="phone" value={editData.phone} onChange={handleEditChange} />
                  </div>
                  <Textarea label="Biography" name="bio" value={editData.bio} onChange={handleEditChange} rows={4} />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="submit" loading={saving}>Save Changes</Button>
                  </div>
                </form>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300">
                  {speaker.bio ? speaker.bio : <p className="text-slate-400 italic">No biography provided.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Uploaded Materials</CardTitle>
              <div className="relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleMaterialUpload} 
                  disabled={uploadingMaterial}
                />
                <Button type="button" variant="outline" size="sm" icon="upload" loading={uploadingMaterial}>
                  Upload Material
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">No materials uploaded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {materials.map(file => (
                    <li key={file.fileId} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-slate-400">description</span>
                        <div className="truncate">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.originalFilename}</p>
                          <p className="text-xs text-slate-500">{new Date(file.uploadTimestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" icon="download" onClick={() => handleDownload(file.fileId, file.originalFilename)}>
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
