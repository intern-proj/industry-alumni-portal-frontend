import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { certificateService } from '../../services/certificateService';
import { participationService } from '../../services/participationService';

export default function MyCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [feedbackVersion, setFeedbackVersion] = useState(0);

  useEffect(() => {
    fetchCertificates();
  }, [user, feedbackVersion]);

  useEffect(() => {
    const handleFeedbackSubmitted = () => {
      setFeedbackVersion((v) => v + 1);
    };
    window.addEventListener('event-feedback-submitted', handleFeedbackSubmitted);
    return () => {
      window.removeEventListener('event-feedback-submitted', handleFeedbackSubmitted);
    };
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const res = await certificateService.getStudentCertificates(user.id);
        const data = res.data?.data || res.data || [];
        setCertificates(Array.isArray(data) ? data : []);
      } else {
        setCertificates([]);
      }
    } catch {
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (cert) => {
    // Enforce feedback requirement check
    const isUnlocked = participationService.hasSubmittedFeedback(
      cert.eventId,
      cert.registrationId || cert.id,
      cert.eventName || cert.title
    );

    if (!isUnlocked) {
      if (window.toast) {
        window.toast.warning('Please submit event feedback first to unlock your certificate!');
      }
      return;
    }

    setDownloadingId(cert.id);
    try {
      const res = await certificateService.downloadCertificatePdf(cert.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cert.id || 'NSBM-Certificate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // Print/open view fallback
      window.open(`/verify/${cert.qrHash || cert.id}`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = certificates.filter((c) =>
    (c.eventName || c.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>My Certificates ({filtered.length})</CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Official university certificates awarded for symposium and event attendance.
            </p>
          </div>
          <Input 
            placeholder="Search certificate by event or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72" 
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading certificates from backend...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Certificates Earned Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Attend university workshops and symposiums with QR check-in and provide feedback to receive verified digital certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((cert) => {
                const isUnlocked = participationService.hasSubmittedFeedback(
                  cert.eventId,
                  cert.registrationId || cert.id,
                  cert.eventName || cert.title
                );

                return (
                  <div 
                    key={cert.id} 
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      isUnlocked
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500/40'
                        : 'border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{cert.id}</span>
                        {isUnlocked ? (
                          <Badge variant="success">VERIFIED CREDENTIAL</Badge>
                        ) : (
                          <Badge variant="warning" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 font-bold">
                            <span className="material-symbols-outlined text-[13px]">lock</span>
                            FEEDBACK REQUIRED
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {cert.eventName || cert.title || 'Event Certificate'}
                      </h3>

                      <p className="text-xs text-slate-500">
                        Issued: {cert.issueDate || cert.issuedAt ? new Date(cert.issueDate || cert.issuedAt).toLocaleDateString() : 'Recent'}
                      </p>

                      {!isUnlocked && (
                        <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">info</span>
                          <p className="text-[11px] leading-relaxed">
                            <strong>Feedback Required:</strong> University policy requires submitting your event evaluation before this certificate can be unlocked and downloaded.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      {isUnlocked ? (
                        <>
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700" 
                            icon="download" 
                            loading={downloadingId === cert.id}
                            onClick={() => handleDownload(cert)}
                          >
                            Download PDF
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs" 
                            icon="qr_code_2"
                            onClick={() => window.open(`/verify/${cert.qrHash || cert.id}`, '_blank')}
                          >
                            Verify QR
                          </Button>
                        </>
                      ) : (
                        <Link
                          to={`/student/events/${cert.eventId || cert.id}/feedback`}
                          state={{ eventTitle: cert.eventName || cert.title }}
                          className="w-full"
                        >
                          <Button 
                            size="sm" 
                            variant="primary" 
                            className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm flex items-center justify-center gap-1.5" 
                            icon="rate_review"
                          >
                            Give Feedback to Unlock Certificate
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
