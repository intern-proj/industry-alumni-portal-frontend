import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { participationService } from '../../services/participationService';

export default function EventQrScanner() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    if (!qrValue) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Typically, scanning a QR gets the qrCodeValue and we mark attendance
      // Assuming the QR contains some registration mapping or we use the verify endpoint
      await participationService.checkinAttendance({
        qrCodeValue: qrValue,
        // If registrationId is needed, you might need to extract it from the QR code value
      });
      setMessage('Attendance successfully recorded!');
      setQrValue(''); // clear for next scan
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">QR Attendance Scanner</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Scan student QR codes for event #{eventId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for actual camera scanner component if you install one later */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-8 flex flex-col items-center justify-center mb-6 border-2 border-dashed border-slate-300 dark:border-slate-700">
            <span className="material-symbols-outlined text-[64px] text-slate-400 mb-4">qr_code_scanner</span>
            <p className="text-slate-500 text-sm">Camera preview would appear here</p>
          </div>

          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Manual Entry (Fallback)
              </label>
              <Input 
                type="text" 
                placeholder="Enter QR code value..." 
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
              />
            </div>
            
            <Button type="submit" disabled={loading || !qrValue} className="w-full">
              {loading ? 'Processing...' : 'Submit Attendance'}
            </Button>
          </form>

          {message && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
        Back to Event
      </Button>
    </div>
  );
}
