import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { BANNER_COLORS } from '../../components/common/GlobalBannerBar';
import { useAuth } from '../../contexts/AuthContext';
import bannerService from '../../services/bannerService';

export const BANNER_ICONS = [
  { id: 'campaign', label: 'Announcement', category: 'ANNOUNCEMENT' },
  { id: 'notifications', label: 'Notification', category: 'ANNOUNCEMENT' },
  { id: 'info', label: 'Information', category: 'ANNOUNCEMENT' },
  { id: 'school', label: 'Academic', category: 'ANNOUNCEMENT' },
  { id: 'celebration', label: 'Event', category: 'ANNOUNCEMENT' },
  { id: 'engineering', label: 'Maintenance', category: 'MAINTENANCE' },
  { id: 'build', label: 'Service Update', category: 'MAINTENANCE' },
  { id: 'construction', label: 'Upgrade', category: 'MAINTENANCE' },
  { id: 'warning', label: 'System Alert', category: 'MAINTENANCE' },
  { id: 'schedule', label: 'Downtime Schedule', category: 'MAINTENANCE' },
];

const getLocalTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalFutureString = (days = 14) => {
  const future = new Date(Date.now() + days * 86400000);
  const year = future.getFullYear();
  const month = String(future.getMonth() + 1).padStart(2, '0');
  const day = String(future.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_FORM = {
  message: '',
  type: 'ANNOUNCEMENT',
  icon: 'campaign',
  priority: 'MEDIUM',
  color: BANNER_COLORS[0].value, // Royal Blue #1d4ed8
  textColor: BANNER_COLORS[0].text, // #e0e7ff
  startDate: getLocalTodayString(),
  endDate: getLocalFutureString(14),
  targetAudience: 'ALL',
  active: true,
};

export default function SystemAlertsBanners() {
  const { user, hasAnyRole } = useAuth();
  const isSystemAdmin =
    user?.role === 'SYSTEM_ADMIN' ||
    user?.userRole === 'SYSTEM_ADMIN' ||
    hasAnyRole('SYSTEM_ADMIN', 'ROLE_SYSTEM_ADMIN', 'ADMIN');

  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const data = await bannerService.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setErrorMsg('');
    setFormData(DEFAULT_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (banner) => {
    if (banner.type === 'MAINTENANCE' && !isSystemAdmin) {
      window.toast.error('Permission Denied: Only System Administrators can configure or modify Maintenance banners.');
      return;
    }
    setEditingBanner(banner);
    setErrorMsg('');
    setFormData({
      message: banner.message,
      type: banner.type || 'ANNOUNCEMENT',
      icon: banner.icon || (banner.type === 'MAINTENANCE' ? 'engineering' : 'campaign'),
      priority: banner.priority || 'MEDIUM',
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      setErrorMsg('Banner message content is required.');
      return;
    }
    if (formData.type === 'MAINTENANCE' && !isSystemAdmin) {
      setErrorMsg('Permission Denied: Only System Administrators are authorized to schedule System Maintenance banners.');
      return;
    }

    try {
      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, formData);
      } else {
        await bannerService.createBanner(formData);
      }
      await fetchBanners();
      setShowModal(false);
    } catch (error) {
      setErrorMsg('Failed to save banner. Please try again.');
    }
  };

  const toggleBannerStatus = async (banner) => {
    if (banner.type === 'MAINTENANCE' && !isSystemAdmin) {
      window.toast.error('Permission Denied: Maintenance banners can only be toggled by System Administrators.');
      return;
    }
    try {
      await bannerService.updateBanner(banner.id, {
        ...banner,
        active: !banner.active,
      });
      await fetchBanners();
    } catch (error) {
      window.toast.error('Failed to toggle banner status.');
    }
  };

  const handleDeleteBanner = (banner) => {
    if (banner?.type === 'MAINTENANCE' && !isSystemAdmin) {
      window.toast.error('Permission Denied: Maintenance banners can only be removed by System Administrators.');
      return;
    }
    setDeleteTarget(banner);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await bannerService.deleteBanner(deleteTarget.id);
      await fetchBanners();
    } catch (error) {
      window.toast.error('Failed to delete banner.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            System Alerts &amp; Global Banners
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Broadcast emergency alerts, maintenance schedules, and career announcements across user portals.
          </p>
        </div>
        <Button icon="add_alert" onClick={handleOpenCreate}>
          Create Banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured System Banners ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Announcement</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Audience</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Display Period</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading banners...
                    </td>
                  </tr>
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No system banners configured.
                    </td>
                  </tr>
                ) : (
                  banners.map((row) => {
                    const isMaintenance = row.type === 'MAINTENANCE';
                    const canManageRow = !isMaintenance || isSystemAdmin;
                    const rowIcon = row.icon || (isMaintenance ? 'engineering' : 'campaign');

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2 max-w-[240px] lg:max-w-[280px]">
                            <span
                              className="material-symbols-outlined text-[18px] shrink-0"
                              style={{ color: row.color || '#1d4ed8' }}
                            >
                              {rowIcon}
                            </span>
                            <span
                              className="font-normal text-slate-800 dark:text-slate-200 truncate"
                              title={row.message}
                            >
                              {row.message}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={isMaintenance ? 'danger' : 'info'}>
                            {isMaintenance ? 'Maintenance' : 'Announcement'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              row.priority === 'HIGH' || row.priority === 'URGENT'
                                ? 'danger'
                                : row.priority === 'MEDIUM'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {row.priority}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="neutral">{row.targetAudience || 'ALL'}</Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={row.active ? 'success' : 'neutral'}>
                            {row.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-normal">
                          {row.startDate} – {row.endDate}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              icon="edit"
                              onClick={() => handleOpenEdit(row)}
                              disabled={!canManageRow}
                              title={
                                !canManageRow
                                  ? 'Maintenance banners can only be edited by System Administrators'
                                  : 'Edit banner'
                              }
                              className="text-xs px-2 py-0.5 h-7"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={row.active ? 'visibility_off' : 'visibility'}
                              onClick={() => toggleBannerStatus(row)}
                              disabled={!canManageRow}
                              title={
                                !canManageRow
                                  ? 'Maintenance banners can only be toggled by System Administrators'
                                  : row.active
                                  ? 'Deactivate'
                                  : 'Activate'
                              }
                              className="text-xs px-2 py-0.5 h-7"
                            >
                              {row.active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon="delete"
                              disabled={!canManageRow}
                              title={
                                !canManageRow
                                  ? 'Maintenance banners can only be deleted by System Administrators'
                                  : 'Delete banner'
                              }
                              className="text-rose-600 hover:text-rose-700 hover:border-rose-300 dark:hover:border-rose-700 text-xs px-2 py-0.5 h-7 disabled:opacity-40"
                              onClick={() => handleDeleteBanner(row)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[22px]">
                  {formData.icon || (formData.type === 'MAINTENANCE' ? 'engineering' : 'campaign')}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingBanner ? 'Edit System Banner' : 'Create System Banner'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Banner Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        type: 'ANNOUNCEMENT',
                        icon: formData.icon === 'engineering' ? 'campaign' : formData.icon,
                      });
                      setErrorMsg('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      formData.type === 'ANNOUNCEMENT'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/50 dark:border-blue-700 dark:text-blue-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">campaign</span>
                    General Announcement
                  </button>

                  <button
                    type="button"
                    disabled={!isSystemAdmin}
                    onClick={() => {
                      if (!isSystemAdmin) return;
                      setFormData({
                        ...formData,
                        type: 'MAINTENANCE',
                        icon: 'engineering',
                        priority: 'HIGH',
                      });
                      setErrorMsg('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      !isSystemAdmin
                        ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                        : formData.type === 'MAINTENANCE'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-800 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title={
                      !isSystemAdmin
                        ? 'Maintenance banners can only be scheduled by System Administrators'
                        : 'System Maintenance banner'
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">engineering</span>
                    Maintenance {!isSystemAdmin && '(Admin Only)'}
                  </button>
                </div>
                {!isSystemAdmin && (
                  <p className="text-[11px] text-slate-400">
                    Administrative staff can broadcast announcements and notices. System maintenance banners are reserved for System Administrators.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Select Banner Icon
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {BANNER_ICONS.filter((item) =>
                    formData.type === 'MAINTENANCE' ? true : !item.isMaintenance || isSystemAdmin
                  ).map((item) => {
                    const isSelected = formData.icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: item.id })}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        title={item.label}
                      >
                        <span className="material-symbols-outlined text-[20px]">{item.id}</span>
                        <span className="text-[10px] truncate max-w-full mt-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Textarea
                label="Banner Message / Announcement Content"
                rows={2}
                placeholder="Enter concise announcement text..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Banner Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {BANNER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => handleColorSelect(c)}
                      title={c.label}
                      className={`w-8 h-8 rounded-xl border-2 transition-all shadow-sm hover:scale-110 active:scale-95 ${
                        formData.color === c.value
                          ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <label
                    className="w-8 h-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-all"
                    title="Custom color"
                  >
                    <span className="material-symbols-outlined text-[15px] text-slate-400">palette</span>
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

                <div
                  className="mt-3 rounded-xl border flex items-stretch overflow-hidden text-xs shadow-sm"
                  style={{ backgroundColor: formData.color, borderColor: `${formData.textColor}20` }}
                >
                  <div
                    className="flex items-center justify-center w-10 shrink-0 border-r"
                    style={{
                      backgroundColor: `${formData.textColor}15`,
                      borderColor: `${formData.textColor}20`,
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: formData.textColor }}
                    >
                      {formData.icon || (formData.type === 'MAINTENANCE' ? 'engineering' : 'campaign')}
                    </span>
                  </div>
                  <div
                    className="flex-1 px-3 py-2 font-medium truncate"
                    style={{ color: formData.textColor }}
                  >
                    {formData.message || 'Banner preview ticker demonstration...'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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
                  Save Banner
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete System Banner"
        message="This banner will be permanently removed and no longer broadcast to portal users."
        itemName={deleteTarget?.message}
      />
    </div>
  );
}
