import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const initialSettings = [
  { id: 'app_received', title: 'New Candidate Application Received', description: 'Instant notification when an undergraduate applies to your posted vacancy', email: true, push: true },
  { id: 'vac_approved', title: 'Vacancy Approved by Faculty', description: 'Get notified when NIC Faculty Management approves your vacancy for student viewing', email: true, push: true },
  { id: 'vac_rejected', title: 'Vacancy Modification Requested', description: 'Alert when a vacancy requires modifications before approval', email: true, push: true },
  { id: 'sys_alerts', title: 'System Alerts & Maintenance', description: 'Platform maintenance notices and university calendar announcements', email: true, push: false },
];

export default function NotificationSettings() {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);

  const toggle = (id, type) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [type]: !s[type] } : s));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notification Preferences</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage how and when your hiring team receives application alerts and approvals.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Notification preferences saved successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email & Portal Dispatches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {settings.map((setting) => (
              <div key={setting.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{setting.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{setting.description}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={setting.email} 
                      onChange={() => toggle(setting.id, 'email')}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={setting.push} 
                      onChange={() => toggle(setting.id, 'push')}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                    />
                    In-App
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button icon="save" onClick={handleSave}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
