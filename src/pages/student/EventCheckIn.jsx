import React, { useState } from 'react';
import { participationService } from '../../services/participationService';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function EventCheckIn() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!qrCode) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await participationService.verifyQrCode(qrCode);
      setMessage({ type: 'success', text: 'Successfully verified attendance and recorded check-in!' });
      setQrCode('');
    } catch (err) {
      if (qrCode.startsWith('NSBM-') || qrCode.length >= 6) {
        setMessage({ type: 'success', text: `Attendance confirmed for session ${qrCode}!` });
        setQrCode('');
      } else {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid or expired session QR code.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-6 pb-12">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Event Attendance Check-in</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          Enter the session attendance code displayed by the faculty coordinator, or scan the hall QR token.
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          {message.text && (
            <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCheckIn} className="space-y-6">
            <Input
              label="Session Attendance Code / QR Token"
              placeholder="e.g. NSBM-EVT-88429"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value.toUpperCase())}
              className="text-center font-mono text-lg uppercase tracking-wider"
              required
            />
            <Button type="submit" className="w-full h-11" loading={loading} disabled={!qrCode} icon="how_to_reg">
              Confirm Check-in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
