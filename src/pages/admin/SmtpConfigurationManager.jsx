import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';

const CURRENT_SYSTEM_PRESET = {
  name: 'Institutional Gmail SMTP (Current Active Setup)',
  icon: 'mail',
  host: 'smtp.gmail.com',
  port: 587,
  security: 'STARTTLS',
  authEnabled: true,
  starttlsEnabled: true,
  sslEnabled: false,
  note: 'Current system relay using smtp.gmail.com:587 with STARTTLS authentication.',
};

export default function SmtpConfigurationManager() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    isPasswordSet: false,
    senderEmail: '',
    senderName: 'NSBM Industry & Alumni Portal',
    authEnabled: true,
    starttlsEnabled: true,
    sslEnabled: false,
    isActive: true,
  });

  const [securityProtocol, setSecurityProtocol] = useState('STARTTLS');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Diagnostic Test States
  const [testRecipient, setTestRecipient] = useState(user?.email || 'admin@nsbm.ac.lk');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSmtpConfig();
  }, []);

  const fetchSmtpConfig = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getSmtpConfig();
      const cfg = res.data;
      if (cfg) {
        setFormData({
          id: cfg.id,
          host: cfg.host || 'smtp.gmail.com',
          port: cfg.port || 587,
          username: cfg.username || '',
          password: '',
          isPasswordSet: !!cfg.isPasswordSet,
          senderEmail: cfg.senderEmail || '',
          senderName: cfg.senderName || 'NSBM Industry & Alumni Portal',
          authEnabled: cfg.authEnabled ?? true,
          starttlsEnabled: cfg.starttlsEnabled ?? true,
          sslEnabled: cfg.sslEnabled ?? false,
          isActive: cfg.isActive ?? true,
          updatedAt: cfg.updatedAt,
        });

        if (cfg.sslEnabled || cfg.port === 465) {
          setSecurityProtocol('SSL');
        } else if (cfg.starttlsEnabled || cfg.port === 587) {
          setSecurityProtocol('STARTTLS');
        } else {
          setSecurityProtocol('NONE');
        }
      }
    } catch (err) {
      console.warn('Failed to load database SMTP config, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      authEnabled: preset.authEnabled,
      starttlsEnabled: preset.starttlsEnabled,
      sslEnabled: preset.sslEnabled,
    }));
    setSecurityProtocol(preset.security);
    setStatusMsg({
      type: 'info',
      text: `Applied preset for ${preset.name}. Please enter your specific credentials and sender email.`,
    });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
  };

  const handleSecurityChange = (val) => {
    setSecurityProtocol(val);
    if (val === 'STARTTLS') {
      setFormData((prev) => ({ ...prev, starttlsEnabled: true, sslEnabled: false, port: 587 }));
    } else if (val === 'SSL') {
      setFormData((prev) => ({ ...prev, starttlsEnabled: false, sslEnabled: true, port: 465 }));
    } else {
      setFormData((prev) => ({ ...prev, starttlsEnabled: false, sslEnabled: false, port: 25 }));
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    setTestResult(null);

    try {
      const payload = {
        ...formData,
        port: Number(formData.port),
      };

      const res = await notificationService.updateSmtpConfig(payload);
      setFormData((prev) => ({
        ...prev,
        ...res.data,
        password: '',
        isPasswordSet: true,
      }));

      setStatusMsg({
        type: 'success',
        text: 'SMTP Server configuration successfully persisted to the database. All outbound emails will now dynamically route through this configuration.',
      });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 6000);
    } catch (err) {
      console.error('Failed to save SMTP config:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to save SMTP configuration. Please review parameters.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    if (!testRecipient) {
      setStatusMsg({ type: 'error', text: 'Please specify a recipient email address to send the diagnostic test.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const payload = {
        recipientEmail: testRecipient.trim(),
        host: formData.host,
        port: Number(formData.port),
        username: formData.username,
        password: formData.password || undefined,
        senderEmail: formData.senderEmail,
        senderName: formData.senderName,
        authEnabled: formData.authEnabled,
        starttlsEnabled: formData.starttlsEnabled,
        sslEnabled: formData.sslEnabled,
      };

      const res = await notificationService.testSmtpConnection(payload);
      setTestResult({
        success: true,
        message: res.data?.message || `Test verification email sent successfully to ${testRecipient}!`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error('SMTP test failure:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Connection refused or authentication failed.';
      setTestResult({
        success: false,
        message: errMsg,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              SMTP Server Configuration
            </h1>
            <Badge variant="success" className="font-semibold text-[11px]">
              Database Dynamic Routing
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure the institutional SMTP mail server parameters used for automated 2FA passcodes, staff invitations, and announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon="refresh"
            onClick={fetchSmtpConfig}
            loading={loading}
          >
            Reload From DB
          </Button>
        </div>
      </div>

      {/* Global Status Notification */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
            {statusMsg.type === 'success' ? 'check_circle' : statusMsg.type === 'error' ? 'error' : 'info'}
          </span>
          <div className="flex-1">{statusMsg.text}</div>
          <button onClick={() => setStatusMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Current System Active SMTP Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">mail</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {CURRENT_SYSTEM_PRESET.name}
              </h3>
              <Badge variant="success" className="text-[10px]">Configured</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Host: <code className="font-semibold text-emerald-700 dark:text-emerald-300">{formData.host}:{formData.port}</code> • Security: <code className="font-semibold text-emerald-700 dark:text-emerald-300">{securityProtocol}</code>
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleApplyPreset(CURRENT_SYSTEM_PRESET)}
          icon="restore"
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          Reset to Baseline
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Main Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Server & Authentication Credentials</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stored securely in institutional email delivery service.
                  </p>
                </div>
                {formData.updatedAt && (
                  <span className="text-[11px] text-slate-400">
                    Updated: {new Date(formData.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8">
                    <Input
                      label="SMTP Host / Server Address"
                      placeholder="e.g. smtp.gmail.com or smtp.office365.com"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      label="Port"
                      placeholder="587"
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Encryption & Handshake Security"
                      value={securityProtocol}
                      onChange={(e) => handleSecurityChange(e.target.value)}
                    >
                      <option value="STARTTLS">STARTTLS (Port 587 - Recommended)</option>
                      <option value="SSL">SSL / TLS (Port 465)</option>
                      <option value="NONE">Plain / Unencrypted (Port 25)</option>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.authEnabled}
                        onChange={(e) => setFormData({ ...formData, authEnabled: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Require SMTP Authentication (AUTH LOGIN)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <Input
                      label="SMTP Username / Account Email"
                      placeholder="e.g. notifications.nsbm@gmail.com"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>SMTP Password / App Secret</span>
                      {formData.isPasswordSet && !formData.password && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">check</span>
                          Credentials Saved
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={formData.isPasswordSet ? 'Leave blank to preserve stored password' : 'Enter SMTP password / App Key'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sender Identity Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <Input
                      label="Default From Email Address"
                      placeholder="e.g. notifications@nsbm.ac.lk"
                      type="email"
                      value={formData.senderEmail}
                      onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="From Display Name"
                      placeholder="e.g. NSBM Industry & Alumni Portal"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                      Enable this SMTP configuration for production delivery
                    </label>
                  </div>

                  <Button type="submit" loading={saving} icon="save" className="px-5">
                    Save Configuration
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Cols: Diagnostic Test & Routing Architecture */}
        <div className="lg:col-span-5 space-y-6">
          {/* Diagnostic Test Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">mark_email_read</span>
                <CardTitle>Connection Diagnostic & Test Email</CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch an end-to-end verification email to validate hostname, firewall routes, TLS negotiation, and authentication.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleTestConnection} className="space-y-3">
                <Input
                  label="Target Recipient Email"
                  placeholder="e.g. administrator@nsbm.ac.lk"
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  loading={testing}
                  variant="outline"
                  icon="send"
                  className="w-full justify-center text-xs font-bold border-blue-300 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  {testing ? 'Negotiating with SMTP Server...' : 'Send Diagnostic Test Email'}
                </Button>
              </form>

              {/* Diagnostic Test Output Card */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                    testResult.success
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        {testResult.success ? 'check_circle' : 'cancel'}
                      </span>
                      {testResult.success ? 'SMTP Handshake Successful' : 'SMTP Handshake Failed'}
                    </span>
                    <span className="text-[10px] opacity-75">{testResult.timestamp}</span>
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed break-words">
                    {testResult.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
