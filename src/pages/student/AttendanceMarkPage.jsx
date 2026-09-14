import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/eventService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function AttendanceMarkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const sessionToken = searchParams.get('session_token') || searchParams.get('token');

  const [scanLoading, setScanLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!sessionToken) {
      setErrorMsg('No check-in session token was detected. Please scan an active session QR code.');
      return;
    }

    // 1. Not logged in -> save token and allow direct login
    if (!user) {
      localStorage.setItem('pending_session_token', sessionToken);
      return;
    }

    // 2. Logged in, but NOT a student
    const isStudent = user.role === 'STUDENT' || (Array.isArray(user.roles) && user.roles.includes('STUDENT'));
    if (!isStudent) {
      return;
    }

    // 3. Logged in as student -> process attendance scan
    markAttendance(sessionToken);
  }, [user, authLoading, sessionToken]);

  const markAttendance = async (token) => {
    setScanLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        token: token,
        studentId: String(user?.id || user?.studentId || '')
      };
      const res = await eventService.scanAttendance(payload);
      const data = res.data?.data || res.data || {};
      setAttendanceData(data);
      localStorage.removeItem('pending_session_token');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to record attendance. The QR code may have expired or is invalid.';
      setErrorMsg(msg);
    } finally {
      setScanLoading(false);
    }
  };

  // 1. Auth Loading State
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Verifying student credentials...</p>
      </div>
    );
  }

  // 2. Unauthenticated User Prompt
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Event Attendance Check-In
            </h1>
            <p className="text-sm text-slate-500">
              Please sign in with your NSBM Student account to record your attendance and unlock certificate eligibility.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Button
              variant="primary"
              className="w-full justify-center bg-blue-600 hover:bg-blue-700 py-2.5"
              onClick={() => navigate(`/login?redirect=/attendance/mark?session_token=${sessionToken}`)}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Sign In as Student
            </Button>
            <Link
              to="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel & Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Non-Student Role Warning
  const isStudent = user.role === 'STUDENT' || (Array.isArray(user.roles) && user.roles.includes('STUDENT'));
  if (!isStudent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">gpp_maybe</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Attendance Only
            </h1>
            <p className="text-sm text-slate-500">
              Session check-in and certificate eligibility are reserved exclusively for enrolled students. You are currently logged in as{' '}
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">{user.role || 'Staff/Partner'}</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full justify-center border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900"
              onClick={async () => {
                await logout();
                navigate(`/login?redirect=/attendance/mark?session_token=${sessionToken}`);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">switch_account</span>
              Switch to Student Account
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-center text-xs text-slate-500"
              onClick={() => navigate('/')}
            >
              Return to Portal Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Scanning in progress
  if (scanLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verifying Session Check-In</h2>
          <p className="text-xs text-slate-500 mt-1">Recording your attendance in the university registry...</p>
        </div>
      </div>
    );
  }

  // 5. Scan Error State
  if (errorMsg) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Check-In Unsuccessful
            </h1>
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            {sessionToken && (
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => markAttendance(sessionToken)}
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Try Check-In Again
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => navigate('/student/events')}
            >
              Go to My Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 6. Successful Attendance & Certificate Eligibility View
  const isAlreadyRecorded = attendanceData?.status === 'ALREADY_RECORDED';
  const eventTitle = attendanceData?.eventTitle || 'University Event';
  const sessionTitle = attendanceData?.sessionTitle || 'General Session';
  const venueName = attendanceData?.venue || 'Campus Venue';
  const startTime = attendanceData?.startTime ? new Date(attendanceData.startTime) : new Date();
  const scannedTime = attendanceData?.scannedAt ? new Date(attendanceData.scannedAt) : new Date();

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 space-y-6">
      {/* Hero Attendance Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>

        <div className="space-y-1">
          <Badge
            variant={isAlreadyRecorded ? 'info' : 'success'}
            className="text-xs uppercase tracking-wider font-bold mb-2"
          >
            {isAlreadyRecorded ? 'Attendance Previously Verified' : 'Attendance Marked Successfully'}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAlreadyRecorded ? 'Already Checked In' : 'You are Checked In!'}
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your attendance has been officially logged in the NSBM academic participation registry.
          </p>
        </div>

        {/* Verified Timestamp Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-[15px] text-emerald-500">verified</span>
          Verified on {scannedTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {scannedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Event & Session Details Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">event_available</span>
              Session Verification Summary
            </CardTitle>
            <Badge variant="neutral" className="text-[11px]">NSBM Event Registry</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Name</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white sm:text-right">{eventTitle}</span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session / Agenda</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 sm:text-right">{sessionTitle}</span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Date & Time</span>
            <span className="text-sm text-slate-700 dark:text-slate-300 sm:text-right">
              {startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus Location</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 sm:justify-end">
              <span className="material-symbols-outlined text-[16px] text-rose-500">location_on</span>
              {venueName}
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Student</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 sm:text-right">
              {user.username} {user.email ? `(${user.email})` : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Eligibility Unlocked Card */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/80 to-amber-100/30 dark:from-amber-950/30 dark:to-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">
                Certificate Eligibility Granted
              </h3>
              <Badge variant="warning" className="text-[10px] uppercase font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200">
                Eligible
              </Badge>
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Because your attendance was successfully recorded for this event session, you have satisfied the participation requirement and earned official eligibility for your digital certificate.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/student/certificates"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            View My Certificates
          </Link>
          <Link
            to="/student/events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            My Events Schedule
          </Link>
        </div>
      </div>

      {/* Return to Dashboard */}
      <div className="text-center pt-2">
        <Link
          to="/student/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Return to Student Dashboard
        </Link>
      </div>
    </div>
  );
}
