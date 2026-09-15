import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';

const ALLOWED_TRANSITIONS = {
  DRAFT: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['ONGOING', 'RESCHEDULED', 'CANCELLED'],
  RESCHEDULED: ['SCHEDULED', 'ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export default function EventsManagement() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventService.getEvents({ includeDrafts: true });
      const data = res.data?.content || res.data?.data || res.data;
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
      setErrorMsg('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.eventType && e.eventType.toLowerCase().includes(q)) ||
      (e.venueName && e.venueName.toLowerCase().includes(q));

    const s = (e.status || 'DRAFT').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || 
      s === statusFilter.toUpperCase() ||
      (statusFilter === 'SCHEDULED' && s === 'PUBLISHED');

    return matchesSearch && matchesStatus;
  });

  const handleQuickStatusChange = async (eventId, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      await eventService.updateEventStatus(eventId, newStatus);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev))
      );
      if (window.toast) window.toast.success(`Event status updated to ${newStatus}`);
    } catch (err) {
      if (window.toast) window.toast.error(err.response?.data?.message || 'Failed to update event status');
    }
  };

  const eventColumns = [
    { key: 'title', header: 'Event Title', render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.title}</span> },
    { key: 'eventType', header: 'Type', render: (row) => <Badge variant="info">{row.eventType || 'Workshop'}</Badge> },
    { key: 'startDateTime', header: 'Date & Time', render: (row) => new Date(row.startDateTime || Date.now()).toLocaleDateString() },
    {
      key: 'venueName',
      header: 'Venue',
      render: (row) => {
        const name = row.venueName || row.sessions?.[0]?.venueName;
        return name ? (
          <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
            {name}
          </span>
        ) : (
          <span className="text-slate-400 italic text-xs">Not Assigned</span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status & Lifecycle',
      render: (row) => {
        const s = (row.status || 'DRAFT').toUpperCase();
        const allowedTargets = ALLOWED_TRANSITIONS[s] || [];
        const isTerminal = allowedTargets.length === 0;

        if (isTerminal) {
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
              s === 'COMPLETED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
            }`}>
              <span className="material-symbols-outlined text-[13px]">
                {s === 'COMPLETED' ? 'check_circle' : 'cancel'}
              </span>
              {s}
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={s}
              onChange={(e) => handleQuickStatusChange(row.id, e.target.value, e)}
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
            >
              <option value={s} disabled>
                {s === 'DRAFT' ? 'Draft (Current)' : s === 'SCHEDULED' ? 'Scheduled (Current)' : s === 'RESCHEDULED' ? 'Rescheduled (Current)' : s === 'ONGOING' ? 'Live Now (Current)' : `${s} (Current)`}
              </option>
              {allowedTargets.map((target) => (
                <option key={target} value={target}>
                  &rarr; {target === 'ONGOING' ? 'Live Now (ONGOING)' : target}
                </option>
              ))}
            </select>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="xs"
            variant="outline"
            icon="edit"
            className="text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => navigate(`/staff/events/${row.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="ghost"
            icon="visibility"
            className="text-xs"
            onClick={() => navigate(`/staff/events/${row.id}`)}
          >
            View
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Events Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage institutional career sessions, guest lectures, and workshops.</p>
        </div>
        <Button onClick={() => navigate('/staff/events/create')} variant="primary" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Event
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Event Schedules ({filteredEvents.length})</CardTitle>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search by title, type, or venue..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64" 
            />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled / Published</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="ONGOING">Ongoing (Live)</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DataTable columns={eventColumns} data={filteredEvents} onRowClick={(row) => navigate(`/staff/events/${row.id}`)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
