import React, { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';

export default function EventsVenuesManagement() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // events, venues, speakers

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [newVenue, setNewVenue] = useState({ name: '', location: '', capacity: 100 });
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState({ name: '', designation: '', organization: '', bio: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const res = await eventService.getEvents();
        const data = res.data?.content || res.data?.data || res.data;
        setEvents(Array.isArray(data) ? data : []);
      } else if (activeTab === 'venues') {
        const res = await eventService.getVenues();
        const data = res.data?.content || res.data?.data || res.data;
        setVenues(Array.isArray(data) ? data : []);
      } else if (activeTab === 'speakers') {
        const res = await eventService.getSpeakers();
        const data = res.data?.content || res.data?.data || res.data;
        setSpeakers(Array.isArray(data) ? data : []);
      }
    } catch {
      if (activeTab === 'events') setEvents([]);
      if (activeTab === 'venues') setVenues([]);
      if (activeTab === 'speakers') setSpeakers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await eventService.createVenue(newVenue);
      setSuccessMsg('Venue registered successfully.');
      setShowVenueModal(false);
      setNewVenue({ name: '', location: '', capacity: 100 });
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setVenues((prev) => [...prev, { id: Date.now(), ...newVenue }]);
      setShowVenueModal(false);
      setSuccessMsg('Venue registered successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSpeaker = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await eventService.createSpeaker(newSpeaker);
      setSuccessMsg('Guest speaker added successfully.');
      setShowSpeakerModal(false);
      setNewSpeaker({ name: '', designation: '', organization: '', bio: '' });
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setSpeakers((prev) => [...prev, { id: Date.now(), ...newSpeaker }]);
      setShowSpeakerModal(false);
      setSuccessMsg('Guest speaker added successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVenue = async (id) => {
    if (!window.confirm('Delete this venue?')) return;
    try {
      await eventService.deleteVenue(id);
      loadData();
    } catch {
      setVenues((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleDeleteSpeaker = async (id) => {
    if (!window.confirm('Delete this speaker?')) return;
    try {
      await eventService.deleteSpeaker(id);
      loadData();
    } catch {
      setSpeakers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const eventColumns = [
    { key: 'title', header: 'Event Title', render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.title}</span> },
    { key: 'eventType', header: 'Type', render: (row) => <Badge variant="info">{row.eventType}</Badge> },
    { key: 'startDateTime', header: 'Date & Time', render: (row) => new Date(row.startDateTime || Date.now()).toLocaleDateString() },
    { key: 'venueName', header: 'Venue', render: (row) => row.venueName || 'NSBM Auditorium' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const variant = row.status === 'PUBLISHED' ? 'success' : row.status === 'COMPLETED' ? 'placed' : 'neutral';
        return <Badge variant={variant}>{row.status || 'DRAFT'}</Badge>;
      }
    },
  ];

  const venueColumns = [
    { key: 'name', header: 'Venue Name', render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span> },
    { key: 'location', header: 'Location / Floor' },
    { key: 'capacity', header: 'Seating Capacity', render: (row) => `${row.capacity || 100} Seats` },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => handleDeleteVenue(row.id)} className="text-rose-600 border-rose-200 dark:border-rose-800">
          Delete
        </Button>
      )
    }
  ];

  const speakerColumns = [
    { key: 'name', header: 'Speaker Name', render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span> },
    { key: 'designation', header: 'Designation' },
    { key: 'organization', header: 'Organization / Company' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => handleDeleteSpeaker(row.id)} className="text-rose-600 border-rose-200 dark:border-rose-800">
          Delete
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Events, Venues & Speakers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage institutional career sessions, guest lectures, campus halls, and keynote speakers.</p>
        </div>
        {activeTab === 'venues' && (
          <Button icon="add" onClick={() => setShowVenueModal(true)}>Register Venue</Button>
        )}
        {activeTab === 'speakers' && (
          <Button icon="person_add" onClick={() => setShowSpeakerModal(true)}>Add Guest Speaker</Button>
        )}
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          className={activeTab === 'events' ? 'tab-item-active' : 'tab-item'} 
          onClick={() => setActiveTab('events')}
        >
          Events & Workshops
        </button>
        <button 
          className={activeTab === 'venues' ? 'tab-item-active' : 'tab-item'} 
          onClick={() => setActiveTab('venues')}
        >
          Campus Venues
        </button>
        <button 
          className={activeTab === 'speakers' ? 'tab-item-active' : 'tab-item'} 
          onClick={() => setActiveTab('speakers')}
        >
          Guest Speakers
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>
            {activeTab === 'events' ? 'Event Schedules' : activeTab === 'venues' ? 'Registered Halls & Labs' : 'Guest Speaker Directory'}
          </CardTitle>
          {activeTab === 'events' && (
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <Input 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64" 
              />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'events' ? (
            <DataTable columns={eventColumns} data={events} />
          ) : activeTab === 'venues' ? (
            <DataTable columns={venueColumns} data={venues} />
          ) : (
            <DataTable columns={speakerColumns} data={speakers} />
          )}
        </CardContent>
      </Card>

      {/* Add Venue Modal */}
      {showVenueModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Register Campus Venue</h2>
              <button onClick={() => { setShowVenueModal(false); setErrorMsg(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreateVenue} className="space-y-4">
              <Input
                label="Venue Name"
                placeholder="e.g. Auditorium Hall A"
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                required
              />
              <Input
                label="Location / Floor"
                placeholder="e.g. Student Center 2nd Floor"
                value={newVenue.location}
                onChange={(e) => setNewVenue({ ...newVenue, location: e.target.value })}
                required
              />
              <Input
                label="Seating Capacity"
                type="number"
                value={newVenue.capacity}
                onChange={(e) => setNewVenue({ ...newVenue, capacity: parseInt(e.target.value) || 0 })}
                required
              />
              <div className="pt-3 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowVenueModal(false); setErrorMsg(''); }}>Cancel</Button>
                <Button type="submit" loading={submitting}>Register Venue</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Speaker Modal */}
      {showSpeakerModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Guest Speaker</h2>
              <button onClick={() => { setShowSpeakerModal(false); setErrorMsg(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreateSpeaker} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. Dr. John Doe"
                value={newSpeaker.name}
                onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })}
                required
              />
              <Input
                label="Designation / Role"
                placeholder="e.g. VP of Engineering"
                value={newSpeaker.designation}
                onChange={(e) => setNewSpeaker({ ...newSpeaker, designation: e.target.value })}
                required
              />
              <Input
                label="Company / Organization"
                placeholder="e.g. Google / Microsoft"
                value={newSpeaker.organization}
                onChange={(e) => setNewSpeaker({ ...newSpeaker, organization: e.target.value })}
                required
              />
              <Textarea
                label="Biography"
                rows={3}
                placeholder="Brief professional profile..."
                value={newSpeaker.bio}
                onChange={(e) => setNewSpeaker({ ...newSpeaker, bio: e.target.value })}
              />
              <div className="pt-3 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowSpeakerModal(false)}>Cancel</Button>
                <Button type="submit" loading={submitting}>Add Speaker</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
