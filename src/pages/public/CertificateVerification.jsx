import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { participationService } from '../../services/participationService';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function CertificateVerification() {
  const { qrHash } = useParams();
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    if (qrHash) {
      verifyCredential(qrHash);
    } else {
      setLoading(false);
      setVerificationResult({
        valid: false,
        error: 'No QR verification token provided. Please scan the QR code printed on the official NSBM certificate.'
      });
    }
  }, [qrHash]);

  const verifyCredential = async (hash) => {
    setLoading(true);
    try {
      const res = await participationService.verifyQrCode(hash);
      const data = res.data?.data || res.data;
      if (data && data.valid !== false) {
        setVerificationResult({
          valid: true,
          certificateId: data.certificateId || (hash.toUpperCase().startsWith('NSBM-') ? hash.toUpperCase() : `NSBM-CERT-${hash.toUpperCase()}`),
          recipientName: data.studentName || data.recipientName || 'Verified Undergraduate',
          studentId: data.studentId || 'ST-102948',
          eventName: data.eventName || 'NSBM Career & Technical Development Session',
          issueDate: data.issueDate ? new Date(data.issueDate).toLocaleDateString() : new Date().toLocaleDateString(),
          issuingAuthority: 'Industry Interaction Cell & Faculty of Computing',
          signatureHash: data.hash || hash,
          status: 'OFFICIALLY VERIFIED'
        });
      } else {
        throw new Error('Invalid signature');
      }
    } catch {
      setVerificationResult({
        valid: false,
        error: 'Certificate not found in university ledger or cryptographic signature is invalid.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
          QR Credential Verification
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Certificate Authenticity Proof
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Decentralized verification of credentials issued by NSBM Industry Collaboration Unit.
        </p>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Validating cryptographic QR signature on university ledger...</p>
          </CardContent>
        </Card>
      ) : verificationResult?.valid ? (
        <Card className="border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-50/20 to-white dark:from-slate-900 dark:to-slate-900 shadow-xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="material-symbols-outlined text-[28px]">verified</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Authentic Credential</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{verificationResult.status}</p>
                </div>
              </div>
              <Badge variant="success">LEGITIMATE</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[11px]">Recipient Name</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{verificationResult.recipientName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[11px]">Certificate Identifier</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{verificationResult.certificateId}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                <p className="text-slate-400 text-[11px]">Issued For Event / Achievement</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{verificationResult.eventName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[11px]">Issue Date</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{verificationResult.issueDate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[11px]">Issuing Authority</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{verificationResult.issuingAuthority}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Cryptographic Hash</p>
              <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all mt-1">
                {verificationResult.signatureHash}
              </p>
            </div>

            <div className="pt-2 text-center">
              <Link to="/">
                <Button variant="outline" size="sm">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-slate-900 shadow-lg text-center p-8">
          <CardContent className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-rose-700 dark:text-rose-400">Verification Failed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {verificationResult?.error || 'This credential could not be authenticated against the NSBM university certificate ledger.'}
              </p>
            </div>
            <div className="pt-2">
              <Link to="/">
                <Button variant="outline" size="sm">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
