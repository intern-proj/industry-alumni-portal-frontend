import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export default function GuestSpeakerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.username || 'Guest Speaker'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your invited events, presentations, and speaker profile here.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">No upcoming events assigned to you.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">You haven't uploaded any presentations yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
