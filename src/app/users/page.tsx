'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Shield, UserPlus, ShieldAlert, Mail, Lock, UserCheck, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SystemUser, Role } from '@/lib/types';
import Modal from '@/components/common/Modal';

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; user: SystemUser | null }>({
    isOpen: false,
    user: null,
  });

  // Create User Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>(['INVENTORY_MANAGER']);

  // Assign Roles Form State
  const [editRoleCodes, setEditRoleCodes] = useState<string[]>([]);

  // Fetch users
  const { data: users, isLoading, error } = useQuery<SystemUser[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch('/users'),
  });

  // Fetch available roles
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => apiFetch('/roles'),
  });

  const availableRoles = roles || [
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full system administration access' },
    { code: 'INVENTORY_MANAGER', name: 'Inventory Manager', description: 'Catalog, stock counts & approvals' },
    { code: 'WAREHOUSE_STAFF', name: 'Warehouse Staff', description: 'Fulfillments, receipts & transfers' },
    { code: 'PURCHASING_AGENT', name: 'Purchasing Agent', description: 'Purchase order requisitions' },
    { code: 'SALES_AGENT', name: 'Sales Agent', description: 'Sales order creation' },
  ];

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (newUser: {
      email: string;
      password: string;
      display_name: string;
      role_codes: string[];
    }) =>
      apiFetch<SystemUser>('/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  // Assign Roles Mutation
  const assignRolesMutation = useMutation({
    mutationFn: ({ userId, role_codes }: { userId: string; role_codes: string[] }) =>
      apiFetch(`/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ role_codes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setRoleModal({ isOpen: false, user: null });
    },
  });

  const resetCreateForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSelectedRoleCodes(['INVENTORY_MANAGER']);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      email,
      password,
      display_name: displayName,
      role_codes: selectedRoleCodes,
    });
  };

  const openAssignRolesModal = (user: SystemUser) => {
    const existingRoles = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === 'string' ? r : r.code))
      : user.role_codes || [];

    setEditRoleCodes(existingRoles);
    setRoleModal({ isOpen: true, user });
  };

  const handleAssignRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleModal.user) {
      assignRolesMutation.mutate({
        userId: roleModal.user.id,
        role_codes: editRoleCodes,
      });
    }
  };

  const toggleRoleSelection = (code: string, currentList: string[], setList: (val: string[]) => void) => {
    if (currentList.includes(code)) {
      setList(currentList.filter((c) => c !== code));
    } else {
      setList([...currentList, code]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>User Accounts & RBAC Role Administration</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage system access accounts and assign granular security role codes (SUPER_ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF, etc.).
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">User Display Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Assigned RBAC Roles</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Role Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Fetching system user directory...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-rose-400">
                    Failed to load users: {(error as Error).message}
                  </td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((u) => {
                  const roleList = Array.isArray(u.roles)
                    ? u.roles.map((r) => (typeof r === 'string' ? r : r.code))
                    : u.role_codes || [];

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                            {u.display_name ? u.display_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{u.display_name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {roleList.length > 0 ? (
                            roleList.map((rc, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  rc === 'SUPER_ADMIN'
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                    : rc === 'INVENTORY_MANAGER'
                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                <Shield className="w-3 h-3" />
                                {rc}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No roles assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {u.is_active ?? true ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-xs">
                            <XCircle className="w-3.5 h-3.5" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openAssignRolesModal(u)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold text-xs transition-colors"
                        >
                          Assign Roles
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No users returned from backend API.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Register New User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Display Name *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Inventory Manager"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@stockflow.internal"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="SecurePassword123!"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Initial Assigned Role Codes
            </label>
            <div className="space-y-2">
              {availableRoles.map((r) => (
                <label
                  key={r.code}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedRoleCodes.includes(r.code)
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleCodes.includes(r.code)}
                    onChange={() => toggleRoleSelection(r.code, selectedRoleCodes, setSelectedRoleCodes)}
                    className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold font-mono text-indigo-300">{r.code}</div>
                    <div className="text-[11px] text-slate-400">{r.description || r.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              {createMutation.isPending ? 'Creating Account...' : 'Create User Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Roles Modal */}
      <Modal
        isOpen={roleModal.isOpen}
        onClose={() => setRoleModal({ isOpen: false, user: null })}
        title={`Assign Roles: ${roleModal.user?.display_name || ''}`}
      >
        <form onSubmit={handleAssignRoles} className="space-y-4">
          <p className="text-xs text-slate-400">
            Select security role codes to assign to user <span className="text-slate-200 font-bold">{roleModal.user?.email}</span>.
          </p>

          <div className="space-y-2">
            {availableRoles.map((r) => (
              <label
                key={r.code}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  editRoleCodes.includes(r.code)
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={editRoleCodes.includes(r.code)}
                  onChange={() => toggleRoleSelection(r.code, editRoleCodes, setEditRoleCodes)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold font-mono text-indigo-300">{r.code}</div>
                  <div className="text-[11px] text-slate-400">{r.description || r.name}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRoleModal({ isOpen: false, user: null })}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignRolesMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              {assignRolesMutation.isPending ? 'Saving Roles...' : 'Save Assigned Roles'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
