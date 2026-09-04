import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import CertificateConfig from './CertificateConfig';

export default function EventDetailManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // QR Modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSessionData, setQrSessionData] = useState(null); // { title, qrUrl }
  const [qrLoading, setQrLoading] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    setLoading(true);
    try {
      const res = await eventService.getEventById(id);
      setEvent(res.data);
    } catch (err) {
      setErrorMsg('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = async (session) => {
    setQrLoading(true);
    setShowQrModal(true);
    setQrSessionData({ title: session.title, qrUrl: '' });
    try {
      const res = await eventService.getQrToken(session.id);
      setQrSessionData({ title: session.title, qrUrl: res.data.qrUrl });
    } catch (err) {
      window.toast.error('Failed to generate QR Code for this session.');
      setShowQrModal(false);
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
        {errorMsg || 'Event not found.'}
      </div>
    );
  }

  const handleDelete = async () => {
    window.confirmAction({
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await eventService.deleteEvent(id);
          navigate('/staff/events');
        } catch (err) {
          window.toast.error('Failed to delete the event. It might have dependent records.');
        }
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/staff/events')} className="p-2 h-auto rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{event.title}</h1>
            <div className="flex gap-2 items-center mt-1">
              <Badge variant={event.status === 'PUBLISHED' ? 'success' : 'neutral'}>{event.status}</Badge>
              {event.requiredAttendanceRate && (
                <Badge variant="info">Required Attendance: {event.requiredAttendanceRate}%</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleDelete} variant="outline" className="flex items-center gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-900/30">
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete Event
          </Button>
          <Button onClick={() => navigate(`/staff/events/${id}/edit`)} variant="outline" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Event
          </Button>
        </div>
      </div>

      {event.coverImage && (
        <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 dark:border-slate-800">
          <img 
            src={storageService.getFileUrl(event.coverImage)} 
            alt="Event Cover" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sessions & Lectures</h3>
            {event.sessions?.length === 0 && (
              <p className="text-slate-500 italic">No sessions scheduled.</p>
            )}
            
            {event.sessions?.map((session, idx) => (
              <Card key={session.id || idx} className="border-l-4 border-l-emerald-500 overflow-hidden relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShowQR(session)} className="flex items-center gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                    Show QR
                  </Button>
                </div>
                <CardHeader className="pb-3">
                  <div className="pr-24">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{session.title}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {new Date(session.startTime).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {session.venueName && (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> {session.venueName}</span>
                      )}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{session.description}</p>
                  
                  {session.lectures && session.lectures.length > 0 ? (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lectures</h5>
                      {session.lectures.map((lecture, lIdx) => (
                        <div key={lecture.id || lIdx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start">
                          <div>
                            <h6 className="font-semibold text-slate-800 dark:text-slate-200">{lecture.title}</h6>
                            <p className="text-xs text-slate-500 mt-0.5">{lecture.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 text-right shrink-0">
                            {lecture.speakerName && (
                              <span className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded">
                                Speaker: {lecture.speakerName}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              {new Date(lecture.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {lecture.endTime && ` - ${new Date(lecture.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No lectures in this session.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Starts</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{new Date(event.startDateTime).toLocaleString()}</p>
              </div>
              {event.endDateTime && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Ends</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{new Date(event.endDateTime).toLocaleString()}</p>
                </div>
              )}
              {event.targetFaculties && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Target Faculties</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {event.targetFaculties.split(',').map(f => (
                      <Badge key={f} variant="neutral" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6 border-dashed border-2">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Certificate & Eligibility</h4>
                <p className="text-xs text-slate-500 mb-3">Configure templates and attendance rules for this event.</p>
                <Button onClick={() => setShowCertificateModal(true)} variant="outline">
                  Configure Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showCertificateModal && <CertificateConfig eventId={id} onClose={() => setShowCertificateModal(false)} />}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Session Check-In</h3>
              <p className="text-sm text-slate-500">{qrSessionData?.title}</p>
            </div>
            
            <div className="flex justify-center p-4 bg-slate-50 dark:bg-white rounded-xl border border-slate-100">
              {qrLoading || !qrSessionData?.qrUrl ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrSessionData.qrUrl)}`} 
                  alt="Check-in QR Code" 
                  className="w-48 h-48 object-contain"
                />
              )}
            </div>
            
            <div className="text-center text-xs text-slate-500">
              Ask students to scan this QR code with their mobile device to record attendance.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
