import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';

export default function GuestSpeakerDashboard() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Materials uploading
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Me (Speaker Profile)
      const profileRes = await eventService.getMe();
      setProfile(profileRes.data);
      setEditData(profileRes.data);
      
      if (profileRes.data?.id) {
        // 2. Get Events for this speaker
        const eventsRes = await eventService.getAssignedEvents(profileRes.data.id);
        setEvents(eventsRes.data || []);
        
        // 3. Get Materials
        const matRes = await storageService.getFiles({ uploaderId: `speaker-${profileRes.data.id}` });
        setMaterials(matRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await eventService.updateSpeaker(profile.id, editData);
      setProfile(editData);
      setIsEditing(false);
    } catch (err) {
      window.toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMaterialUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile?.id) return;
    setUploadingMaterial(true);
    try {
      await storageService.uploadFile(file, { uploaderId: `speaker-${profile.id}`, fileType: 'OTHER' });
      const matRes = await storageService.getFiles({ uploaderId: `speaker-${profile.id}` });
      setMaterials(matRes.data || []);
    } catch (err) {
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

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome, {profile?.fullName || user?.username || 'Guest Speaker'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your invited events, presentations, and speaker profile here.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>My Profile</CardTitle>
              {!isEditing && <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <Input label="Full Name" name="fullName" value={editData.fullName || ''} onChange={handleEditChange} required />
                  <Input label="Company" name="company" value={editData.company || ''} onChange={handleEditChange} />
                  <Input label="Designation" name="title" value={editData.title || ''} onChange={handleEditChange} />
                  <Input label="Phone" name="phone" value={editData.phone || ''} onChange={handleEditChange} />
                  <Textarea label="Biography" name="bio" value={editData.bio || ''} onChange={handleEditChange} rows={4} />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="submit" loading={savingProfile}>Save</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white shadow-sm">
                      {profile?.photoUrl ? (
                        <img src={storageService.getFileUrl(profile.photoUrl)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[48px] text-slate-300 mt-4 ml-4">person</span>
                      )}
                    </div>
                  </div>
                  <div><strong className="text-slate-500 block">Name</strong> {profile?.fullName}</div>
                  <div><strong className="text-slate-500 block">Company</strong> {profile?.company || '-'}</div>
                  <div><strong className="text-slate-500 block">Designation</strong> {profile?.title || '-'}</div>
                  <div><strong className="text-slate-500 block">Email</strong> {profile?.email}</div>
                  <div><strong className="text-slate-500 block">Phone</strong> {profile?.phone || '-'}</div>
                  <div><strong className="text-slate-500 block">Bio</strong> {profile?.bio || '-'}</div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>My Materials</CardTitle>
              <div className="relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleMaterialUpload} 
                  disabled={uploadingMaterial}
                />
                <Button type="button" variant="outline" size="sm" icon="upload" loading={uploadingMaterial}>
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">No materials uploaded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {materials.map(file => (
                    <li key={file.fileId} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-slate-400">description</span>
                        <div className="truncate">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.originalFilename}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" icon="download" onClick={() => handleDownload(file.fileId, file.originalFilename)} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assigned Events */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Events & Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-lg">No events assigned to you currently.</p>
              ) : (
                <div className="space-y-6">
                  {events.map((event) => (
                    <div key={event.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">
                              {new Date(event.startDateTime).toLocaleDateString()} - {event.eventType}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {event.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{event.description}</p>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Sessions:</h4>
                        {event.agendas?.filter(a => a.speakerId === profile?.id).map((session, idx) => (
                          <div key={session.id || idx} className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg flex gap-4 items-start">
                            <div className="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined">mic</span>
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-900 dark:text-white">{session.title}</h5>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(session.startTime).toLocaleString()}
                                {session.venueName ? ` • Room: ${session.venueName}` : ' • Online'}
                              </p>
                              {session.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{session.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
