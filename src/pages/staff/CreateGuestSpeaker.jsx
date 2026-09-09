import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function CreateGuestSpeaker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [speakerData, setSpeakerData] = useState({
    fullName: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    bio: '',
    photoUrl: ''
  });

  const handleChange = (e) => {
    setSpeakerData({ ...speakerData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await storageService.uploadFile(file, { uploaderId: user?.id || 'staff', fileType: 'OTHER' });
      setSpeakerData({ ...speakerData, photoUrl: res.data.fileId });
    } catch (err) {
      console.error('Failed to upload image', err);
      window.toast.error('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await eventService.createSpeaker(speakerData);
      navigate('/staff/speakers');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create guest speaker.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Guest Speaker</h1>
          <p className="text-slate-500">Create a new guest speaker profile.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/staff/speakers')}>Cancel</Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
          {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Speaker Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name *" name="fullName" value={speakerData.fullName} onChange={handleChange} required />
              <Input label="Company / Organization" name="company" value={speakerData.company} onChange={handleChange} />
              <Input label="Designation / Title" name="title" value={speakerData.title} onChange={handleChange} />
              <Input label="Email *" type="email" name="email" value={speakerData.email} onChange={handleChange} required />
              <Input label="Contact Number" name="phone" value={speakerData.phone} onChange={handleChange} />
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Image</label>
                <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border-2 border-white dark:border-slate-700">
                    {speakerData.photoUrl ? (
                      <img src={storageService.getFileUrl(speakerData.photoUrl)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-3xl">person</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      <Button type="button" variant="outline" size="sm" loading={uploadingImage}>
                        {speakerData.photoUrl ? 'Change Image' : 'Upload Image'}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Recommended: Square image, max 2MB (JPG, PNG)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Textarea 
              label="Short Description (Bio)" 
              name="bio" 
              value={speakerData.bio} 
              onChange={handleChange} 
              rows={4} 
            />

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/staff/speakers')}>Cancel</Button>
              <Button type="submit" loading={loading}>Save Speaker</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
