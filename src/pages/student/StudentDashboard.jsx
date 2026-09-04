import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Upcoming Events</h3>
          <p className="text-3xl font-bold text-slate-900">3</p>
        </div>
        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Pending Applications</h3>
          <p className="text-3xl font-bold text-slate-900">1</p>
        </div>
        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Certificates Earned</h3>
          <p className="text-3xl font-bold text-slate-900">4</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Welcome back, {user?.username || 'Student'}!</h2>
        <p className="text-slate-600">
          This is your personal hub. From here, you can manage your event registrations, explore new internship opportunities, and build out your profile to attract industry partners.
        </p>
        <div className="mt-6 flex gap-4">
          <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition">
            Browse Events
          </button>
          <button className="px-4 py-2 bg-white text-slate-700 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50 transition">
            View Vacancies
          </button>
        </div>
      </div>
    </div>
  );
}
