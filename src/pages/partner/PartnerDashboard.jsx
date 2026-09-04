import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function PartnerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Partner Dashboard</h1>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
          Verified Partner
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Vacancies</h3>
          <p className="text-3xl font-bold text-slate-900">12</p>
        </div>
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Applications</h3>
          <p className="text-3xl font-bold text-sky-600">48</p>
        </div>
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Upcoming Events</h3>
          <p className="text-3xl font-bold text-slate-900">2</p>
        </div>
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hires This Year</h3>
          <p className="text-3xl font-bold text-slate-900">15</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-md shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Recent Applications</h2>
          </div>
          <div className="p-4 text-center text-slate-500 py-12">
            No new applications to review today.
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <button className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md text-sm transition text-left px-4">
              + Post New Vacancy
            </button>
            <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-300 rounded-md text-sm transition text-left px-4">
              Update Company Profile
            </button>
            <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-300 rounded-md text-sm transition text-left px-4">
              Search Talent Directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
