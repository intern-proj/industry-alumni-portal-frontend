import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import PasswordStrengthInput from '../../components/common/PasswordStrengthInput';
import { validateEmail, validatePassword } from '../../utils/validation';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state for creating new Administrator
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { size: 100 }; // Increase page size to show more users
      if (searchTerm.trim()) params.query = searchTerm.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await userService.getAllUsers(params);
      const data = res.data?.data?.content || res.data?.content || res.data?.data || res.data;
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await userService.updateAccountStatus(user.userId || user.id, nextStatus);
      setActionSuccess(`User status updated to ${nextStatus}.`);
      fetchUsers();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update user status.');
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteTarget(user);
  };

  const confirmDeleteUser = async () => {
    const user = deleteTarget;
    if (!user) return;
    setDeleteTarget(null);
    
    const userId = user.userId || user.id || user.username;
    const identifier = user.email || user.username || user.userId;
    try {
      if (userId) {
        await userService.deleteUser(userId);
      }
      if (identifier) {
        await authService.deleteAdmin(identifier);
      }
      setActionSuccess('User deleted successfully.');
      fetchUsers();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete user completely.');
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionError('');

    if (!validateEmail(newUser.email)) {
      setActionError('Please enter a valid official email address (e.g. admin@nsbm.ac.lk).');
      return;
    }

    if (!validatePassword(newUser.password)) {
      setActionError('Password does not meet institutional security requirements (min 8 chars, uppercase, lowercase, number, special symbol).');
      return;
    }

    setCreating(true);
    try {
      // 1. Create Admin in auth-service credentials store
      await authService.createAdmin(
        newUser.username.trim(),
        newUser.email.trim(),
        newUser.password
      );

      // 2. Create Admin profile in user-service
      try {
        await userService.createManagementOrAdminUser({
          userId: newUser.username.trim(),
          firstName: newUser.firstName.trim() || newUser.username.trim(),
          lastName: newUser.lastName.trim() || 'SYSTEM_ADMIN',
          email: newUser.email.trim(),
          userRole: 'SYSTEM_ADMIN',
        });
      } catch (profileErr) {
        // Compensating Transaction: rollback auth-service credential creation
        console.warn('Profile creation failed, rolling back auth credentials:', profileErr);
        try {
          await authService.deleteAdmin(newUser.username.trim());
        } catch (rollbackErr) {
          console.error('Failed to rollback orphaned auth credentials:', rollbackErr);
        }
        throw profileErr; // Re-throw to trigger the outer catch block
      }

      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'SYSTEM_ADMIN',
        status: 'ACTIVE',
      });
      setActionSuccess('System Administrator account created successfully.');
      fetchUsers();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create Administrator account.';
      setActionError(msg);
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'Username / Name',
      render: (row) => {
        const username = row.userId || 'User';
        const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim();
        return (
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {username}
            </p>
            {fullName && fullName !== username && fullName !== 'SYSTEM_ADMIN' && (
              <p className="text-xs text-slate-500 font-medium">{fullName}</p>
            )}
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.email}</p>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (row) => {
        const role = row.userRole || row.role || 'USER';
        let variant = 'neutral';
        if (role.includes('SYSTEM_ADMIN')) variant = 'danger';
        else if (role.includes('MANAGEMENT')) variant = 'warning';
        else if (role.includes('COORDINATOR') || role.includes('STAFF')) variant = 'info';
        else if (role === 'STUDENT') variant = 'success';
        return <Badge variant={variant}>{role}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (row) => {
        const status = row.accountStatus || row.status || 'ACTIVE';
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              status === 'ACTIVE'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500 dark:text-rose-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Registered',
      render: (row) =>
        new Date(row.createdAt || Date.now()).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(row)}
            icon={row.status === 'ACTIVE' || row.accountStatus === 'ACTIVE' ? 'block' : 'check_circle'}
          >
            {row.status === 'ACTIVE' || row.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
            onClick={() => handleDeleteUser(row)}
            icon="delete"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            User Management & Administrative Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Directly register System Administrators. Faculty and staff members are onboarded via Staff Invitations.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/invite-staff">
            <Button variant="outline" icon="person_add">
              Invite Staff
            </Button>
          </Link>
          <Button icon="add_moderator" onClick={() => { setShowCreateModal(true); setActionError(''); }}>
            Add Administrator
          </Button>
        </div>
      </div>

      {/* Global Success Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {actionSuccess}
        </div>
      )}

      {/* Global Error Banner */}
      {actionError && !showCreateModal && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {actionError}
        </div>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <SmartAISearchBar
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={fetchUsers}
                showAiToggle={false}
              />
            </div>
            <div>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="SYSTEM_ADMIN">System Administrator</option>
                <option value="FACULTY_MANAGEMENT">Faculty Management</option>
                <option value="FACULTY_COORDINATOR">Faculty Coordinator</option>
                <option value="INTERNSHIP_COORDINATOR">Internship Coordinator</option>
                <option value="EVENT_COORDINATOR">Event Coordinator</option>
                <option value="ADMINISTRATIVE_STAFF">Administrative Staff</option>
                <option value="GUEST_SPEAKER">Guest Speaker</option>
                <option value="STUDENT">Student</option>
                <option value="INDUSTRY_PARTNER">Industry Partner</option>
              </Select>
            </div>
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Platform Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            keyField="userId"
          />
        </CardContent>
      </Card>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[22px]">admin_panel_settings</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create System Administrator</h2>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setActionError(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Error Message Placed Right at Top Below Header */}
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  placeholder="First name"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Username"
                placeholder="e.g. jdoe_admin"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
              />

              <Input
                label="Administrator Email"
                type="email"
                placeholder="admin@nsbm.ac.lk"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />

              <PasswordStrengthInput
                label="Administrator Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Create secure administrator password"
                required
              />

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">verified_user</span>
                  Role Privilege: System Administrator (ADMIN)
                </div>
                Admins have full access to platform infrastructure, user administration, and system telemetry. Faculty and Staff are onboarded via Staff Invitations.
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowCreateModal(false); setActionError(''); }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={creating} icon="add_moderator">
                  Create Admin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        message="This will permanently remove the user and all associated records. This action cannot be undone."
        itemName={deleteTarget ? (deleteTarget.username || deleteTarget.userId || deleteTarget.email) : ''}
        confirmLabel="Delete User"
      />
    </div>
  );
}
