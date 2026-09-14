import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';

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
      const res = await eventService.getEvents();
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

  const eventColumns = [
    { key: 'title', header: 'Event Title', render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.title}</span> },
    { key: 'eventType', header: 'Type', render: (row) => <Badge variant="info">{row.eventType || 'Workshop'}</Badge> },
    { key: 'startDateTime', header: 'Date & Time', render: (row) => new Date(row.startDateTime || Date.now()).toLocaleDateString() },
    { key: 'venueName', header: 'Venue', render: (row) => row.venueName || 'NSBM Auditorium' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = (row.status || 'DRAFT').toUpperCase();
        const badgeConfig = {
          SCHEDULED: { variant: 'info', label: 'Scheduled', icon: 'schedule' },
          PUBLISHED: { variant: 'success', label: 'Published', icon: 'check_circle' },
          ONGOING: { variant: 'success', label: 'Live Now', icon: 'play_circle' },
          COMPLETED: { variant: 'placed', label: 'Completed', icon: 'task_alt' },
          CANCELLED: { variant: 'danger', label: 'Cancelled', icon: 'cancel' },
          DRAFT: { variant: 'neutral', label: 'Draft', icon: 'edit_note' },
        }[s] || { variant: 'neutral', label: s, icon: 'info' };

        return (
          <Badge variant={badgeConfig.variant} className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">{badgeConfig.icon}</span>
            {badgeConfig.label}
          </Badge>
        );
      }
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
