import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { BANNER_COLORS } from '../../components/common/GlobalBannerBar';

const storageKey = 'portal_system_banners_data';

const DEFAULT_FORM = {
  message: '',
  priority: 'MEDIUM',
  color: BANNER_COLORS[0].value,
  textColor: BANNER_COLORS[0].text,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  targetAudience: 'ALL',
  active: true,
};

const getInitialBanners = () => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export default function SystemAlertsBanners() {
  const [banners, setBanners] = useState(getInitialBanners);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const saveBanners = (updated) => {
    setBanners(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new Event('bannersUpdated'));
  };

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setErrorMsg('');
    setFormData(DEFAULT_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setErrorMsg('');
    setFormData({
      message: banner.message,
      priority: banner.priority,
      color: banner.color || BANNER_COLORS[0].value,
      textColor: banner.textColor || BANNER_COLORS[0].text,
      startDate: banner.startDate,
      endDate: banner.endDate,
      targetAudience: banner.targetAudience || 'ALL',
      active: banner.active,
    });
    setShowModal(true);
  };

  const handleColorSelect = (colorObj) => {
    setFormData((prev) => ({ ...prev, color: colorObj.value, textColor: colorObj.text }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      setErrorMsg('Banner message content is required.');
      return;
    }
    if (editingBanner) {
      const updated = banners.map((b) => (b.id === editingBanner.id ? { ...b, ...formData } : b));
      saveBanners(updated);
    } else {
      const updated = [{ id: Date.now(), ...formData }, ...banners];
      saveBanners(updated);
    }
    setShowModal(false);
  };

  const toggleBannerStatus = (id) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    saveBanners(updated);
  };

  const handleDeleteBanner = (banner) => {
    setDeleteTarget(banner);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = banners.filter((b) => b.id !== deleteTarget.id);
    saveBanners(updated);
    setDeleteTarget(null);
  };

  const columns = [
    {
      key: 'message',
      header: 'Banner Announcement',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full shrink-0 border border-white/30 shadow-sm"
            style={{ backgroundColor: row.color || '#1d4ed8' }}
            title={`Color: ${row.color || 'default'}`}
          />
          <span className="font-medium text-slate-900 dark:text-white text-sm truncate max-w-xs">
            {row.message}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={row.priority === 'HIGH' ? 'danger' : row.priority === 'MEDIUM' ? 'warning' : 'info'}>
          {row.priority}
        </Badge>
      ),
    },
    {
      key: 'target',
      header: 'Audience',
      render: (row) => <Badge variant="neutral">{row.targetAudience || 'ALL'}</Badge>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${row.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          <span className={`w-2 h-2 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Display Period',
      render: (row) =>
        `${new Date(row.startDate).toLocaleDateString()} – ${new Date(row.endDate).toLocaleDateString()}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon="edit" onClick={() => handleOpenEdit(row)}>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={row.active ? 'visibility_off' : 'visibility'}
            onClick={() => toggleBannerStatus(row.id)}
          >
            {row.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon="delete"
            className="text-rose-600 hover:text-rose-700 hover:border-rose-300 dark:hover:border-rose-700"
            onClick={() => handleDeleteBanner(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            System Alerts &amp; Global Banners
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Broadcast emergency alerts, maintenance schedules, and career announcements across all portals.
          </p>
        </div>
        <Button icon="add_alert" onClick={handleOpenCreate}>
          Create Announcement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured System Banners ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={banners} />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingBanner ? 'Edit Banner Announcement' : 'Create New Banner Announcement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <Textarea
                label="Banner Message / Content"
                rows={3}
                placeholder="Enter announcement text..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Banner Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {BANNER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => handleColorSelect(c)}
                      title={c.label}
                      className={`w-9 h-9 rounded-xl border-2 transition-all shadow-sm hover:scale-110 active:scale-95 ${
                        formData.color === c.value
                          ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  {/* Custom color picker */}
                  <label
                    className="w-9 h-9 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-all"
                    title="Custom color"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-400">palette</span>
                    <input
                      type="color"
                      className="sr-only"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value, textColor: '#ffffff' })
                      }
                    />
                  </label>
                </div>
                {/* Preview */}
                <div
                  className="mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-3"
                  style={{ backgroundColor: formData.color, color: formData.textColor }}
                >
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span className="truncate">{formData.message || 'Banner preview...'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH (Urgent)</option>
                </Select>

                <Select
                  label="Target Audience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                >
                  <option value="ALL">All Users</option>
                  <option value="STUDENTS">Undergraduates Only</option>
                  <option value="STAFF">Faculty &amp; Staff Only</option>
                  <option value="PARTNERS">Industry Partners Only</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon="save">
                  Save Announcement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete System Banner"
        message="This banner will be permanently removed and no longer shown to any users."
        itemName={deleteTarget?.message}
      />
    </div>
  );
}
