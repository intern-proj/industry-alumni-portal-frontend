import React, { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';

export default function VenuesManagement() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [newVenue, setNewVenue] = useState({ name: '', address: '', capacity: 100 });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventService.getVenues();
      const data = res.data?.content || res.data?.data || res.data;
      setVenues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load venues:', err);
      setVenues([]);
      setErrorMsg('Failed to load venues.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveVenue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editingVenue) {
        await eventService.updateVenue(editingVenue.id, newVenue);
        setSuccessMsg('Venue updated successfully.');
      } else {
        await eventService.createVenue(newVenue);
        setSuccessMsg('Venue registered successfully.');
      }
      setShowVenueModal(false);
      setEditingVenue(null);
      setNewVenue({ name: '', address: '', capacity: 100 });
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save venue:', err);
      setErrorMsg(err.response?.data?.message || 'An error occurred while saving the venue.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (venue) => {
    setEditingVenue(venue);
    setNewVenue({ 
      name: venue.name, 
      address: venue.address || '', 
      capacity: venue.capacity
    });
    setShowVenueModal(true);
  };

  const openCreateModal = () => {
    setEditingVenue(null);
    setNewVenue({ name: '', address: '', capacity: 100 });
    setShowVenueModal(true);
  };

  const handleDeleteVenue = async (id) => {
    window.confirmAction({
      title: 'Delete Venue',
      message: 'Are you sure you want to delete this venue?',
      onConfirm: async () => {
        try {
          await eventService.deleteVenue(id);
          loadData();
          window.toast.success('Venue deleted.');
        } catch {
          window.toast.error('Failed to delete venue.');
        }
      }
    });
  };

  const venueColumns = [
    { key: 'name', header: 'Venue Name', render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span> },
    { key: 'address', header: 'Location / Floor' },
    { key: 'capacity', header: 'Seating Capacity', render: (row) => `${row.capacity || 100} Seats` },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditModal(row)} className="text-blue-600 border-blue-200 dark:border-blue-800">
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteVenue(row.id)} className="text-rose-600 border-rose-200 dark:border-rose-800">
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Campus Venues</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage institutional campus halls and labs.</p>
        </div>
        <Button icon="add" onClick={openCreateModal}>Register Venue</Button>
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

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Registered Halls & Labs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DataTable columns={venueColumns} data={venues} />
          )}
        </CardContent>
      </Card>

      {/* Add Venue Modal */}
      {showVenueModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingVenue ? 'Edit Venue' : 'Register Campus Venue'}
              </h2>
              <button onClick={() => { setShowVenueModal(false); setErrorMsg(''); setEditingVenue(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveVenue} className="space-y-4">
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
                value={newVenue.address}
                onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
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
                <Button type="button" variant="outline" onClick={() => { setShowVenueModal(false); setErrorMsg(''); setEditingVenue(null); }}>Cancel</Button>
                <Button type="submit" loading={submitting}>
                  {editingVenue ? 'Save Changes' : 'Register Venue'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
