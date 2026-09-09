import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';

export default function SpeakersManagement() {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventService.getSpeakers();
      const data = res.data?.content || res.data?.data || res.data;
      setSpeakers(Array.isArray(data) ? data : []);
    } catch {
      setSpeakers([]);
      setErrorMsg('Failed to load speakers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    navigate('/staff/speakers/create');
  };

  const handleDeleteSpeaker = async (id) => {
    window.confirmAction({
      title: 'Delete Speaker',
      message: 'Are you sure you want to delete this speaker?',
      onConfirm: async () => {
        try {
          await eventService.deleteSpeaker(id);
          loadData();
          window.toast.success('Speaker deleted.');
        } catch {
          window.toast.error('Failed to delete speaker.');
        }
      }
    });
  };

  const speakerColumns = [
    { key: 'fullName', header: 'Speaker Name', render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.fullName || row.name}</span> },
    { key: 'title', header: 'Designation / Title', render: (row) => row.title || row.designation },
    { key: 'email', header: 'Email' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/staff/speakers/${row.id}`)} className="text-blue-600 border-blue-200 dark:border-blue-800">
            View Profile
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteSpeaker(row.id)} className="text-rose-600 border-rose-200 dark:border-rose-800">
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Guest Speakers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage institutional keynote speakers and guests.</p>
        </div>
        <Button icon="person_add" onClick={openCreateModal}>Add Guest Speaker</Button>
      </div>



      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Guest Speaker Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DataTable columns={speakerColumns} data={speakers} />
          )}
        </CardContent>
      </Card>


    </div>
  );
}
