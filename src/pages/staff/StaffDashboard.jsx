import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function StaffDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Staff Overview</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition shadow-sm">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200 border-t-4 border-t-indigo-500">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending Approvals</h3>
          <p className="text-3xl font-bold text-slate-900">7</p>
        </div>
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200 border-t-4 border-t-emerald-500">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Students</h3>
          <p className="text-3xl font-bold text-slate-900">1,204</p>
        </div>
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200 border-t-4 border-t-sky-500">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Registered Partners</h3>
          <p className="text-3xl font-bold text-slate-900">85</p>
        </div>
        <div className="bg-white p-5 rounded-md shadow-sm border border-slate-200 border-t-4 border-t-amber-500">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Upcoming Events</h3>
          <p className="text-3xl font-bold text-slate-900">4</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-md shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Needs Attention</h2>
            <span className="text-sm text-indigo-600 cursor-pointer hover:underline">View All</span>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-slate-100">
              <li className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900 text-sm">New Vacancy Posting: "Software Engineer Intern"</p>
                  <p className="text-xs text-slate-500">Submitted by TechCorp Inc. • 2 hours ago</p>
                </div>
                <button className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100">Review</button>
              </li>
              <li className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900 text-sm">Partner Registration: "Global Logistics"</p>
                  <p className="text-xs text-slate-500">Pending Verification • 1 day ago</p>
                </div>
                <button className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100">Review</button>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Quick Links</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <a href="#" className="p-3 border border-slate-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50 transition text-sm font-medium text-slate-700">Approve Vacancies</a>
            <a href="#" className="p-3 border border-slate-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50 transition text-sm font-medium text-slate-700">Manage Event Venues</a>
            <a href="#" className="p-3 border border-slate-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50 transition text-sm font-medium text-slate-700">Send Broadcast Email</a>
          </div>
        </div>
      </div>
    </div>
  );
}
