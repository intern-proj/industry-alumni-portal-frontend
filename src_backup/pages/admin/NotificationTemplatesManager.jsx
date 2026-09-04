import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { notificationService } from '../../services/notificationService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const storageKey = 'portal_notification_templates_cache';

// Mapping of template code to sample preview variables and metadata
const TEMPLATE_METADATA = {
  AUTH_OTP_CODE: {
    queue: 'notification.otp',
    trigger: 'Staff / Admin 2FA Login Authentication',
    sampleVars: {
      otpCode: '842915',
    },
  },
  STAFF_INVITATION: {
    queue: 'notification.update',
    trigger: 'Staff Member Onboarding Dispatch',
    sampleVars: {
      role: 'INTERNSHIP_COORDINATOR',
      invitationLink: 'https://portal.nsbm.ac.lk/register/staff?token=9f8c12e4-staff-invite-demo',
    },
  },
  PARTNER_REGISTRATION_APPROVED: {
    queue: 'notification.update',
    trigger: 'Corporate Partner Registration Verified',
    sampleVars: {
      companyName: 'Virtusa Technology Services',
      loginUrl: 'https://portal.nsbm.ac.lk/login',
    },
  },
  VACANCY_APPROVED: {
    queue: 'notification.update',
    trigger: 'Undergraduate Job Vacancy Approved',
    sampleVars: {
      companyName: 'WSO2 Lanka (Pvt) Ltd',
      jobTitle: 'Software Engineering Trainee (Full-Stack)',
      actionLink: 'https://portal.nsbm.ac.lk/vacancies/wso2-se-intern',
    },
  },
  VACANCY_CHANGES_REQUESTED: {
    queue: 'notification.update',
    trigger: 'Vacancy Modification Requested by Coordinator',
    sampleVars: {
      companyName: 'Sysco LABS Sri Lanka',
      jobTitle: 'Associate Cloud DevOps Engineer',
      modificationNotes: 'Please clarify required GPA threshold and specify if remote work options are available for final-year students.',
      actionLink: 'https://portal.nsbm.ac.lk/partner/vacancies/edit/104',
    },
  },
  VACANCY_REJECTED: {
    queue: 'notification.update',
    trigger: 'Job Vacancy Rejected Notice',
    sampleVars: {
      companyName: 'Apex Creative Solutions',
      jobTitle: 'Part-Time Telemarketing Specialist',
      rejectionReason: 'Position does not align with NSBM Faculty of Computing internship academic prerequisites or degree requirements.',
    },
  },
  EVENT_INVITATION: {
    queue: 'notification.invitation',
    trigger: 'University Event RSVP Invitation',
    sampleVars: {
      eventName: 'NSBM Annual Career Fair & Industry Day 2026',
      eventDate: 'October 15, 2026 at 09:00 AM',
      location: 'NSBM Green University Auditorium & Innovation Park',
      rsvpLink: 'https://portal.nsbm.ac.lk/events/career-fair-2026/rsvp',
    },
  },
  EVENT_REMINDER: {
    queue: 'notification.reminder',
    trigger: '24-Hour Event Reminder Broadcast',
    sampleVars: {
      eventName: 'National Cloud & AI Student Hackathon 2026',
      eventDate: 'Tomorrow at 08:30 AM',
      location: 'Faculty of Computing Lab Complex 4',
      eventLink: 'https://portal.nsbm.ac.lk/events/hackathon-pass/7821',
    },
  },
  CAMPUS_ANNOUNCEMENT: {
    queue: 'notification.announcement',
    trigger: 'University-Wide Broadcast Bulletin',
    sampleVars: {
      title: 'Industry Placement Semester Registration Deadlines',
      announcementBody: 'All third and fourth-year undergraduates intending to enter industrial training for the upcoming academic semester must submit their verified CVs by the 30th of this month.',
      senderName: 'Prof. Chaminda Rathnayake, Head of Academic Affairs',
    },
  },
  PROFILE_APPROVED: {
    queue: 'notification.update',
    trigger: 'Student / Alumni CV Verification',
    sampleVars: {
      userName: 'Kavindu Perera',
      portalUrl: 'https://portal.nsbm.ac.lk/student/profile',
    },
  },
  CERTIFICATE_ISSUED: {
    queue: 'notification.certificate',
    trigger: 'Digital Achievement Certificate Issuance',
    sampleVars: {
      studentName: 'Kavindu Perera',
      eventName: 'Advanced Spring Boot & Microservices Masterclass',
      verificationCode: 'NSBM-CERT-2026-8942-X',
      downloadUrl: 'https://portal.nsbm.ac.lk/certificates/download/NSBM-CERT-2026-8942-X',
    },
  },
};

const sanitizeTemplate = (t) => ({
  ...t,
  subject: t.subject ? t.subject.replace(/[\u{1F300}-\u{1F9FF}]|[\u2000-\u32ff]|[\ufe00-\ufe0f]/gu, '').trim() : '',
  name: t.name ? t.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u2000-\u32ff]|[\ufe00-\ufe0f]/gu, '').trim() : '',
  body: t.body ? t.body.replace(/[\u{1F300}-\u{1F9FF}]|[\u2000-\u32ff]|[\ufe00-\ufe0f]/gu, '') : '',
});

export default function NotificationTemplatesManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEditorTemplate, setActiveEditorTemplate] = useState(null);
  const [viewMode, setViewMode] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getTemplates();
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        const cleaned = data.map(sanitizeTemplate);
        setTemplates(cleaned);
        localStorage.setItem(storageKey, JSON.stringify(cleaned));
      } else {
        const cached = localStorage.getItem(storageKey);
        if (cached) setTemplates(JSON.parse(cached).map(sanitizeTemplate));
      }
    } catch (err) {
      console.warn('Falling back to cached templates:', err);
      const cached = localStorage.getItem(storageKey);
      if (cached) setTemplates(JSON.parse(cached).map(sanitizeTemplate));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.templateCode?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const handleOpenEditor = (template) => {
    setActiveEditorTemplate({ ...template });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSaveTemplate = async () => {
    if (!activeEditorTemplate) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      templateCode: activeEditorTemplate.templateCode,
      name: activeEditorTemplate.name,
      subject: activeEditorTemplate.subject,
      body: activeEditorTemplate.body,
      description: activeEditorTemplate.description,
    };

    try {
      if (activeEditorTemplate.id) {
        await notificationService.updateTemplate(activeEditorTemplate.id, payload);
      } else {
        const res = await notificationService.createTemplate(payload);
        if (res.data?.id) activeEditorTemplate.id = res.data.id;
      }

      // Update state
      const updated = templates.map((t) =>
        t.id === activeEditorTemplate.id || t.templateCode === activeEditorTemplate.templateCode
          ? { ...activeEditorTemplate, updatedAt: new Date().toISOString() }
          : t
      );
      setTemplates(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      setSuccessMsg('Email template saved and synchronized with database successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving template:', err);
      setErrorMsg('Failed to update template on server. Changes saved to local cache.');
      // Local fallback
      const updated = templates.map((t) =>
        t.templateCode === activeEditorTemplate.templateCode ? activeEditorTemplate : t
      );
      setTemplates(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } finally {
      setSaving(false);
    }
  };

  // Interpolate sample variables into HTML and subject for live preview
  const renderedEmail = useMemo(() => {
    if (!activeEditorTemplate) return { subject: '', html: '' };
    const meta = TEMPLATE_METADATA[activeEditorTemplate.templateCode] || {};
    const sampleVars = meta.sampleVars || {};

    let subject = activeEditorTemplate.subject || '';
    let html = activeEditorTemplate.body || '';

    Object.entries(sampleVars).forEach(([key, val]) => {
      const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(reg, val);
      html = html.replace(reg, val);
    });

    return { subject, html };
  }, [activeEditorTemplate]);

  // Detected variables in the current active template
  const detectedVariables = useMemo(() => {
    if (!activeEditorTemplate) return [];
    const text = `${activeEditorTemplate.subject} ${activeEditorTemplate.body}`;
    const matches = text.match(/{{\s*[\w.-]+\s*}}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim())));
  }, [activeEditorTemplate]);

  // Insert variable into HTML textarea
  const insertVariable = (varName) => {
    if (!activeEditorTemplate) return;
    const tag = `{{${varName}}}`;
    setActiveEditorTemplate((prev) => ({
      ...prev,
      body: (prev.body || '') + ` ${tag} `,
    }));
  };

  // =========================================================================
  // VIEW: DEDICATED TEMPLATE EDITOR & LIVE RENDER VIEW
  // =========================================================================
  if (activeEditorTemplate) {
    const meta = TEMPLATE_METADATA[activeEditorTemplate.templateCode] || {};

    return (
      <div className="space-y-6">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <button
              onClick={() => setActiveEditorTemplate(null)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors uppercase tracking-wider mb-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Template Catalog
            </button>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {activeEditorTemplate.name}
              </h1>
              <span className="font-mono text-xs font-normal text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                {activeEditorTemplate.templateCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trigger: <span className="text-slate-700 dark:text-slate-300 font-medium">{meta.trigger || activeEditorTemplate.description}</span>
              {meta.queue && <span className="text-slate-400"> | Channel: <code className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{meta.queue}</code></span>}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon="refresh"
              onClick={() => {
                const orig = templates.find((t) => t.id === activeEditorTemplate.id);
                if (orig) setActiveEditorTemplate({ ...orig });
              }}
              className="font-medium text-xs"
            >
              Reset
            </Button>
            <Button
              size="sm"
              icon="save"
              loading={saving}
              onClick={handleSaveTemplate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4"
            >
              Save Template
            </Button>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {errorMsg}
          </div>
        )}

        {/* =========================================================================
            TOP SECTION: TEMPLATE CONFIGURATION & HTML SOURCE CODE
            ========================================================================= */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 py-3.5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-lg">code</span>
                <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Email Template Source &amp; Parameters
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  {(activeEditorTemplate.body || '').length} chars
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeEditorTemplate.body || '');
                    setSuccessMsg('HTML code copied to clipboard');
                    setTimeout(() => setSuccessMsg(''), 3000);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy Code
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {/* Subject Line Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Subject Line
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Supports template variables</span>
              </div>
              <Input
                value={activeEditorTemplate.subject || ''}
                onChange={(e) =>
                  setActiveEditorTemplate((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="e.g. Security Passcode: {{otpCode}}"
                className="font-normal text-xs"
              />
            </div>

            {/* Template Variables Shelf */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Available Template Variables
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Click variable to append into HTML</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {detectedVariables.length > 0 ? (
                  detectedVariables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] font-normal text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title={`Click to insert {{${v}}}`}
                    >
                      <span className="material-symbols-outlined text-[13px] text-slate-400">add</span>
                      {`{{${v}}}`}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic font-normal">No variables detected</span>
                )}
              </div>
            </div>

            {/* HTML Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  HTML Source Body
                </label>
                <span className="text-[11px] text-slate-400 font-mono font-normal">UTF-8 HTML5</span>
              </div>
              <textarea
                value={activeEditorTemplate.body || ''}
                onChange={(e) =>
                  setActiveEditorTemplate((prev) => ({ ...prev, body: e.target.value }))
                }
                rows={14}
                className="w-full font-mono text-xs leading-relaxed text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800 focus:ring-1 focus:ring-slate-600 focus:outline-none transition-all resize-y selection:bg-slate-700"
                placeholder="<!DOCTYPE html><html>...</html>"
                spellCheck={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* =========================================================================
            BOTTOM SECTION: LIVE RENDERED EMAIL OUTPUT PREVIEW (BELOW)
            ========================================================================= */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 py-3 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-lg">preview</span>
                <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Rendered Preview
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-normal mr-1">Device:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('desktop')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-all ${
                    viewMode === 'desktop'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
                  Desktop (600px)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mobile')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-all ${
                    viewMode === 'mobile'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">smartphone</span>
                  Mobile (375px)
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-8 bg-slate-100/60 dark:bg-slate-950/50 flex flex-col items-center overflow-x-auto">
            {/* Simulated Mail Client Window */}
            <div
              className={`w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden transition-all ${
                viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[620px]'
              }`}
            >
              {/* Mail Window Titlebar */}
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="ml-2 text-[11px] font-normal text-slate-400 truncate">
                  Mail Dispatcher Preview
                </span>
              </div>

              {/* Mail Client Metadata Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-xs space-y-1.5 bg-slate-50/30 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-normal">From:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    NSBM Notifications &lt;notifications.nsbm@gmail.com&gt;
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-normal">To:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">recipient.portal@nsbm.ac.lk</span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-normal text-slate-500 dark:text-slate-400">Subject:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[420px]">
                    {renderedEmail.subject || '(Empty Subject)'}
                  </span>
                </div>
              </div>

              {/* Rendered Email Content Container */}
              <div className="p-5 overflow-auto max-h-[600px]">
                <div
                  className="prose dark:prose-invert max-w-none text-left"
                  dangerouslySetInnerHTML={{ __html: renderedEmail.html || '<p class="text-slate-400 italic">No HTML content specified</p>' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VIEW: ALL TEMPLATES OVERVIEW & SCENARIO CATALOG
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Institutional Email Notification Templates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic HTML templates rendered across all university operational scenarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon="refresh" onClick={fetchTemplates} loading={loading}>
            Refresh Catalog
          </Button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Configured Scenarios
            </p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{templates.length}</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-emerald-600">mail</span>
        </div>

        <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
              Template Storage
            </p>
            <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">Institutional Database</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-sky-600">database</span>
        </div>

        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
              Dispatch Architecture
            </p>
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Automated Dispatch Handlers</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-indigo-600">tune</span>
        </div>
      </div>

      {/* Catalog Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
          search
        </span>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by scenario or template code..."
          className="pl-9 text-xs"
        />
      </div>

      {/* Templates List */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-medium">
                <th className="py-3.5 px-6">Template Code</th>
                <th className="py-3.5 px-6">Scenario</th>
                <th className="py-3.5 px-6">Trigger Event & Channel</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => {
                  const meta = TEMPLATE_METADATA[template.templateCode] || {};
                  return (
                    <tr key={template.templateCode || template.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                          {template.templateCode}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {template.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                          {template.description}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {meta.trigger || template.description}
                        </div>
                        {meta.queue && (
                          <div className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                            Channel: {meta.queue}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditor(template)}
                          icon="edit_note"
                          className="font-medium text-xs hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          Edit &amp; Preview
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading configured notification templates...' : 'No templates matching your query'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
