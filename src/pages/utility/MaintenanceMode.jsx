import React from 'react';
import { Button } from '../../components/ui/Button';

export default function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-surface-bright flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-outline-variant/40 shadow-sm">
        <div className="w-20 h-20 bg-warning-orange/10 text-warning-orange rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[44px]">engineering</span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-slate-700 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-warning-orange animate-pulse"></span>
            Scheduled System Upgrade
          </div>
          <h1 className="font-headline-lg text-slate-900">Portal Under Scheduled Maintenance</h1>
          <p className="font-body-base text-slate-600 leading-relaxed">
            The Industry & Alumni Collaboration Portal is currently undergoing routine maintenance and database optimization to serve you better.
          </p>
        </div>

        <div className="p-4 bg-surface-container-low rounded-xl text-left text-sm space-y-2 border border-outline-variant/30">
          <div className="flex justify-between text-slate-600">
            <span>Expected Completion:</span>
            <strong className="text-slate-900">Today at 18:00 UTC+5:30</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Support Desk:</span>
            <a href="mailto:support@nsbm.ac.lk" className="text-primary font-medium hover:underline">support@nsbm.ac.lk</a>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" icon="refresh" onClick={() => window.location.reload()}>
            Check Again
          </Button>
        </div>
      </div>
    </div>
  );
}
