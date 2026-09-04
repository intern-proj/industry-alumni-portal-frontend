import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { authService } from '../../services/authService';
import { validateEmail } from '../../utils/validation';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { renderRoleBadge } from './UserManagement';

const storedInvitesKey = 'portal_staff_invitations_cache';

const getInitialInvites = () => {
  try {
    const saved = localStorage.getItem(storedInvitesKey);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export default function StaffInvitationControl() {
  const [invites, setInvites] = useState(getInitialInvites);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('INTERNSHIP_COORDINATOR');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null);

  const saveInvites = (newInvites) => {
    setInvites(newInvites);
    try {
      localStorage.setItem(storedInvitesKey, JSON.stringify(newInvites));
    } catch {}
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !validateEmail(email)) {
      setErrorMsg('Please enter a valid university email address (e.g. coordinator@nsbm.ac.lk).');
      return;
    }

    setLoading(true);

    try {
      await authService.inviteStaff(email.trim(), role);
      setSuccessMsg(`Official staff invitation sent to ${email.trim()}`);
      const updated = [
        {
          id: Date.now(),
          email: email.trim(),
          role,
          date: new Date().toISOString(),
          status: 'PENDING'
        },
        ...invites.filter(i => i.email !== email.trim())
      ];
      saveInvites(updated);
      setEmail('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      let msg = err.response?.data?.message || err.response?.data?.error;
      if (err.response?.status === 409 || !msg) {
        msg = `Staff member with email '${email.trim()}' is already registered or has an active pending invitation.`;
      }
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (inv) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await authService.inviteStaff(inv.email, inv.role);
      setSuccessMsg(`Invitation re-sent to ${inv.email}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || `Failed to resend invitation to ${inv.email}`;
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const handleRevokeInvite = (inv) => {
    setRevokeTarget(inv);
  };

  const confirmRevoke = async () => {
    const inv = revokeTarget;
    if (!inv) return;
    setRevokeTarget(null);
    try {
      await authService.revokeStaffInvitation(inv.email);
    } catch (err) {
      console.warn('Backend revoke notice:', err);
    }
    const updated = invites.filter(i => i.email !== inv.email);
    saveInvites(updated);
    setSuccessMsg(`Invitation for ${inv.email} has been revoked and removed.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const columns = [
    { key: 'email', header: 'Staff Email Address', cellClassName: 'font-medium text-slate-900 dark:text-white' },
    { 
      key: 'role', 
      header: 'Assigned Role',
      render: (row) => renderRoleBadge(row.role),
    },
    { key: 'date', header: 'Invitation Dispatched', render: (row) => new Date(row.date || Date.now()).toLocaleDateString() },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        let variant = 'info';
        if (row.status === 'COMPLETED') variant = 'success';
        if (row.status === 'PENDING') variant = 'warning';
        if (row.status === 'EXPIRED') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            icon="send" 
            disabled={row.status === 'COMPLETED'}
            onClick={() => handleResend(row)}
          >
            {row.status === 'PENDING' ? 'Resend' : 'Re-invite'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon="delete"
            className="text-rose-600 hover:text-rose-700 hover:border-rose-300 dark:hover:border-rose-700"
            onClick={() => handleRevokeInvite(row)}
          >
            Revoke
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Staff & Faculty Invitations</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Onboard academic staff, faculty management, and internship coordinators via cryptographically signed token links.
        </p>
      </div>

      {/* Top positioned error message banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top positioned success message banner */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Top Section: Invite New Staff Member Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite New Staff Member</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dispatch secure registration tokens to faculty coordinators, department deans, administrative staff, and guest speakers.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <Input 
                label="Official University Email" 
                placeholder="coordinator@nsbm.ac.lk" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-4">
              <Select 
                label="Assigned Faculty / Operational Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="FACULTY_MANAGEMENT">Faculty Management (Dean / Head)</option>
                <option value="FACULTY_COORDINATOR">Faculty Coordinator</option>
                <option value="INTERNSHIP_COORDINATOR">Internship Coordinator</option>
                <option value="EVENT_COORDINATOR">Event Coordinator</option>
                <option value="ADMINISTRATIVE_STAFF">Administrative Staff</option>
                <option value="GUEST_SPEAKER">Guest Speaker</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" loading={loading} className="w-full justify-center" icon="mail">
                Send Invitation Token
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Bottom Section: Dispatched Invitations Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Dispatched Invitations ({invites.length})</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor active invitation tokens, registration statuses, or revoke issued links.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={invites} />
        </CardContent>
      </Card>

      <ConfirmDeleteModal
        isOpen={!!revokeTarget}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={confirmRevoke}
        title="Revoke Staff Invitation"
        message="This invitation will be permanently revoked. The recipient will no longer be able to register using their invitation link."
        itemName={revokeTarget?.email}
        confirmLabel="Revoke Invitation"
        variant="warning"
      />
    </div>
  );
}
