import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { certificateService } from '../../services/certificateService';

export default function MyCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, [user]);

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

  const filtered = certificates.filter(c =>
    (c.eventName || c.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Light Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-purple-500/15 dark:from-emerald-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
            <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Earned Digital Certificates</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">NSBM Cryptographically Signed Credentials</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Access, verify, and download your tamper-proof digital certificates issued for attending university symposiums, industry webinars, and workshops.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>My Certificates ({filtered.length})</CardTitle>
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
                Attend university workshops and symposiums with QR check-in to receive verified digital certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((cert) => (
                <div 
                  key={cert.id} 
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{cert.id}</span>
                      <Badge variant="success">VERIFIED CREDENTIAL</Badge>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{cert.eventName}</h3>
                    <p className="text-xs text-slate-500">Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'Recent'}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs" 
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
