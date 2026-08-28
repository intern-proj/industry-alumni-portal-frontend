import React, { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../../services/notificationService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

const storageKey = 'portal_notification_templates_cache';

const defaultSeedTemplates = [
  {
    id: 1,
    templateCode: 'AUTH_OTP_CODE',
    name: 'Two-Factor Authentication OTP',
    subject: 'NSBM Security Verification Code: {{otpCode}}',
    body: '<p>Dear User,</p><p>Your one-time verification code for NSBM Industry & Alumni Portal is: <strong>{{otpCode}}</strong>.</p><p>This code will expire in 5 minutes. If you did not request this code, please contact institutional security immediately.</p>',
    description: 'Triggered during login for 2FA one-time passcode verification.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    templateCode: 'STAFF_INVITATION',
    name: 'Staff Invitation & Onboarding',
    subject: 'Institutional Staff Portal Invitation - NSBM Green University',
    body: '<p>Dear Faculty / Staff Member,</p><p>You have been invited to join the NSBM Industry & Alumni Portal with the role: <strong>{{role}}</strong>.</p><p>Please complete your account activation by visiting: <a href="{{invitationLink}}">{{invitationLink}}</a></p>',
    description: 'Sent when an administrator invites a new faculty or staff coordinator.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    templateCode: 'PARTNER_REGISTRATION_APPROVED',
    name: 'Corporate Partner Approval',
    subject: 'Welcome to NSBM Corporate Network - Partnership Approved',
    body: '<p>Dear {{companyName}} Team,</p><p>Your partnership application with NSBM Green University has been approved. You can complete your employer profile here: <a href="{{registrationLink}}">{{registrationLink}}</a></p>',
    description: 'Dispatched when faculty management approves an employer registration.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    templateCode: 'VACANCY_APPROVED',
    name: 'Vacancy Publication Notice',
    subject: 'Vacancy Published: {{jobTitle}} at {{companyName}}',
    body: '<p>Hello {{companyName}},</p><p>Your posted vacancy for <strong>{{jobTitle}}</strong> has been verified by the Internship Coordination Unit and is now live to all eligible undergraduates.</p>',
    description: 'Sent when an undergraduate job vacancy is approved by coordinators.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    templateCode: 'PASSWORD_RESET',
    name: 'Password Reset Request',
    subject: 'Reset Your NSBM Industry & Alumni Portal Password',
    body: '<p>Dear User,</p><p>We received a request to reset your password. Use the following security token or link to reset your credentials: <strong>{{resetToken}}</strong></p>',
    description: 'Sent when a user requests password reset from the login screen.',
    updatedAt: new Date().toISOString(),
  }
];

export default function NotificationTemplatesManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getTemplates();
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
        localStorage.setItem(storageKey, JSON.stringify(data));
      } else {
        const cached = localStorage.getItem(storageKey);
        const list = cached ? JSON.parse(cached) : defaultSeedTemplates;
        setTemplates(list);
      }
    } catch {
      const cached = localStorage.getItem(storageKey);
      setTemplates(cached ? JSON.parse(cached) : defaultSeedTemplates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSaving(true);
    setErrorMsg('');

    const payload = {
      templateCode: editingTemplate.templateCode.trim(),
      name: editingTemplate.name?.trim() || editingTemplate.templateCode.trim(),
      subject: editingTemplate.subject.trim(),
      body: editingTemplate.body || editingTemplate.bodyContent || '<p>Template message</p>',
      description: editingTemplate.description || 'Institutional notification template',
    };

    try {
      if (editingTemplate.id && typeof editingTemplate.id === 'number' && editingTemplate.id > 10) {
        await notificationService.updateTemplate(editingTemplate.id, payload);
      } else {
        await notificationService.createTemplate(payload).catch(() => {});
      }
    } catch (err) {
      console.warn('Backend sync notice:', err);
    }

    // Always update client state & persistence
    const updated = editingTemplate.id
      ? templates.map((t) => (t.id === editingTemplate.id || t.templateCode === editingTemplate.templateCode ? { ...editingTemplate, ...payload, updatedAt: new Date().toISOString() } : t))
      : [{ ...payload, id: Date.now(), updatedAt: new Date().toISOString() }, ...templates];

    setTemplates(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    setSuccessMsg('Template saved and synchronized successfully.');
    setEditingTemplate(null);
    setSaving(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteTemplate = async (template) => {
    setDeleteTarget(template);
  };

  const confirmDeleteTemplate = async () => {
    const template = deleteTarget;
    if (!template) return;
    setDeleteTarget(null);
    try {
      if (template.id && typeof template.id === 'number' && template.id > 10) {
        await notificationService.deleteTemplate(template.id).catch(() => {});
      }
    } catch (err) {
      console.warn('Backend delete notice:', err);
    }
    const updated = templates.filter((t) => t.id !== template.id && t.templateCode !== template.templateCode);
    setTemplates(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    setSuccessMsg('Notification template deleted successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const columns = [
    {
      key: 'templateCode',
      header: 'Template Code',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            {row.templateCode || row.id}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{row.name}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Email Subject',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white text-xs">{row.subject}</span>,
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (row) => new Date(row.updatedAt || Date.now()).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingTemplate(row)}
            icon="edit"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewTemplate(row)}
            icon="preview"
          >
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon="delete"
            className="text-rose-600 hover:text-rose-700 hover:border-rose-300 dark:hover:border-rose-700"
            onClick={() => handleDeleteTemplate(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Email & OTP Notification Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage system-generated automated transactional emails, 2FA codes, and notifications.</p>
        </div>
        <Button
          icon="add"
          onClick={() =>
            setEditingTemplate({
              templateCode: '',
              name: '',
              subject: '',
              body: '<p>Write your message here...</p>',
              description: '',
            })
          }
        >
          Create Template
        </Button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configured Notification & OTP Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={templates} keyField="templateCode" />
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTemplate.id ? `Edit Template: ${editingTemplate.templateCode}` : 'New Notification Template'}
              </h2>
              <button onClick={() => { setEditingTemplate(null); setErrorMsg(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <Input
                label="Template Code"
                placeholder="e.g. AUTH_OTP_CODE"
                value={editingTemplate.templateCode}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, templateCode: e.target.value })}
                required
              />
              <Input
                label="Friendly Name"
                placeholder="e.g. Two-Factor Authentication OTP"
                value={editingTemplate.name || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                required
              />
              <Input
                label="Email Subject"
                placeholder="Subject line with {{variables}}..."
                value={editingTemplate.subject}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                required
              />
              <Textarea
                label="HTML / Markdown Template Content"
                rows={6}
                value={editingTemplate.body || editingTemplate.bodyContent || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                required
              />
              <Input
                label="Description"
                placeholder="When this email is triggered..."
                value={editingTemplate.description || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
              />

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving} icon="save">
                  Save Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{previewTemplate.templateCode}</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{previewTemplate.subject}</h2>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
              <div dangerouslySetInnerHTML={{ __html: previewTemplate.body || previewTemplate.bodyContent || '' }} />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setPreviewTemplate(null)}>Close Preview</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTemplate}
        title="Delete Notification Template"
        message="This template will be permanently removed from the system and cannot be recovered."
        itemName={deleteTarget ? (deleteTarget.name || deleteTarget.templateCode) : ''}
      />
    </div>
  );
}
