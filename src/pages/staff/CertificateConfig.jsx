import React, { useState, useEffect, useRef } from 'react';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function CertificateConfig({ eventId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [criteria, setCriteria] = useState({
    minAttendancePercentage: 80,
    requiresFeedbackSubmission: false,
    minSessionsAttended: 0,
    otherCriteriaNotes: '',
    templateImage: '',
    namePosX: 500,
    namePosY: 500,
    nameFontSize: 40,
    nameFontColor: '#000000'
  });
  const [uploading, setUploading] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);

  useEffect(() => {
    loadCriteria();
  }, [eventId]);

  const loadCriteria = async () => {
    try {
      const res = await eventService.getEligibilityCriteria(eventId);
      if (res.data) {
        setCriteria({
          ...criteria,
          ...res.data
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Failed to load certificate criteria', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await storageService.uploadFile(file, { uploaderId: 'staff', fileType: 'OTHER' });
      setCriteria({ ...criteria, templateImage: res.data.fileId });
      setShowDesigner(true);
    } catch (err) {
      window.toast.error('Failed to upload template image.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setCriteria({ ...criteria, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await eventService.setEligibilityCriteria(eventId, criteria);
      window.toast.success('Certificate configuration saved successfully!');
      onClose();
    } catch (err) {
      window.toast.error('Failed to save certificate configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">Loading certificate config...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in duration-200">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            <span className="material-symbols-outlined block text-lg">close</span>
          </button>
          
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">workspace_premium</span>
            Certificate Configuration
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">crop_original</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Template Image</h4>
                    <p className="text-xs text-slate-500">{criteria.templateImage ? 'Template uploaded successfully.' : 'Upload a background template (A4 landscape).'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                    <Button type="button" variant="outline" loading={uploading}>
                      {criteria.templateImage ? 'Change Template' : 'Upload Template'}
                    </Button>
                  </div>
                  {criteria.templateImage && (
                    <Button type="button" onClick={() => setShowDesigner(true)}>
                      Design Template
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">Eligibility Rules</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Min. Attendance (%)</label>
                  <Input type="number" name="minAttendancePercentage" value={criteria.minAttendancePercentage} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Requires Feedback?</label>
                  <select 
                    name="requiresFeedbackSubmission" 
                    value={criteria.requiresFeedbackSubmission} 
                    onChange={(e) => setCriteria({...criteria, requiresFeedbackSubmission: e.target.value === 'true'})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
              <Button onClick={onClose} variant="ghost">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} loading={saving}>
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showDesigner && (
        <TemplateDesignerModal 
          criteria={criteria} 
          setCriteria={setCriteria} 
          onClose={() => setShowDesigner(false)} 
        />
      )}
    </>
  );
}

function TemplateDesignerModal({ criteria, setCriteria, onClose }) {
  const imageRef = useRef(null);

  const handleImageClick = (e) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const actualX = Math.round(x * scaleX);
    const actualY = Math.round(y * scaleY);

    setCriteria({
      ...criteria,
      namePosX: actualX,
      namePosY: actualY
    });
  };

  const handleChange = (e) => {
    setCriteria({ ...criteria, [e.target.name]: e.target.value });
  };

  let previewLeft = 0;
  let previewTop = 0;
  let previewFontSize = criteria.nameFontSize;
  
  if (imageRef.current && criteria.templateImage) {
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageRef.current.naturalWidth;
    const scaleY = rect.height / imageRef.current.naturalHeight;
    previewLeft = (criteria.namePosX || 0) / scaleX;
    previewTop = (criteria.namePosY || 0) / scaleY;
    previewFontSize = Math.max(12, (criteria.nameFontSize || 40) / scaleY);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto pt-24 pb-12">
      <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl max-w-5xl w-full p-6 relative animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Design Certificate Template</h2>
            <p className="text-sm text-slate-500">Click anywhere on the image below to set where the student's name should be printed.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <span className="material-symbols-outlined block">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex justify-center items-center shadow-inner">
            <img 
              ref={imageRef}
              src={storageService.getFileUrl(criteria.templateImage)} 
              alt="Certificate Template" 
              className="max-w-full h-auto cursor-crosshair"
              onClick={handleImageClick}
              onLoad={() => setCriteria({...criteria})}
            />
            
            {imageRef.current && (
              <div 
                className="absolute whitespace-nowrap pointer-events-none drop-shadow-md font-bold"
                style={{
                  left: `${previewLeft}px`,
                  top: `${previewTop}px`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${previewFontSize}px`,
                  color: criteria.nameFontColor || '#000000',
                }}
              >
                John Doe
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">X Position (px)</label>
              <Input type="number" name="namePosX" value={criteria.namePosX} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Y Position (px)</label>
              <Input type="number" name="namePosY" value={criteria.namePosY} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Font Size (px)</label>
              <Input type="number" name="nameFontSize" value={criteria.nameFontSize} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Font Color</label>
              <div className="flex gap-2">
                <input type="color" name="nameFontColor" value={criteria.nameFontColor || '#000000'} onChange={handleChange} className="h-[42px] w-12 rounded-xl cursor-pointer border-0 bg-transparent p-0" />
                <Input type="text" name="nameFontColor" value={criteria.nameFontColor || '#000000'} onChange={handleChange} className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 shrink-0">
          <Button onClick={onClose} icon="check">Done</Button>
        </div>
      </div>
    </div>
  );
}
