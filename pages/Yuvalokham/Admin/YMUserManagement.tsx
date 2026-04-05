import React, { useState } from 'react';
import { Search, AlertTriangle, ChevronLeft, ChevronRight, X, KeyRound } from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '../../../components/ui';
import { useYMAdminUsers, useYMAdminUpdateUser, useYMAdminResetPassword } from '../../../hooks/queries';
import { useToast } from '../../../components/Toast';
import { YMUser } from '../../../types';

const PAGE_SIZE = 20;

export const YMUserManagement: React.FC = () => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [districtId, setDistrictId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading, error } = useYMAdminUsers({
    search: search || undefined,
    is_active: isActiveFilter,
    district_id: districtId,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const updateUser = useYMAdminUpdateUser();
  const resetPassword = useYMAdminResetPassword();

  const handleResetPassword = (userId: number) => {
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    resetPassword.mutate(
      { userId, newPassword },
      {
        onSuccess: () => {
          addToast('Password reset successfully', 'success');
          setResetPasswordUserId(null);
          setNewPassword('');
        },
        onError: () => addToast('Failed to reset password', 'error'),
      }
    );
  };

  const handleToggleActive = (user: YMUser) => {
    updateUser.mutate(
      { id: user.id, data: { is_active: !user.is_active } },
      {
        onSuccess: () => addToast(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`, 'success'),
        onError: () => addToast('Failed to update user', 'error'),
      }
    );
  };

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textDark">User Management</h1>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-borderColor rounded-md bg-white text-textDark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={isActiveFilter === undefined ? '' : String(isActiveFilter)}
            onChange={(e) => {
              setIsActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true');
              setPage(0);
            }}
            className="px-3 py-2.5 text-sm border border-borderColor rounded-md bg-white text-textDark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <input
            type="number"
            placeholder="District ID"
            value={districtId ?? ''}
            onChange={(e) => {
              setDistrictId(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
            className="w-32 px-3 py-2.5 text-sm border border-borderColor rounded-md bg-white text-textDark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {(search || isActiveFilter !== undefined || districtId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setIsActiveFilter(undefined); setDistrictId(undefined); setPage(0); }}
            >
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load users.
        </div>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-borderColor">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase hidden lg:table-cell">District</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-textMuted uppercase">Active</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase hidden lg:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase hidden xl:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-textMuted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user: YMUser) => (
                    <React.Fragment key={user.id}>
                      <tr
                        className="hover:bg-bgLight transition-colors cursor-pointer"
                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-textDark">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-textDark">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-textDark hidden md:table-cell">{user.phone}</td>
                        <td className="px-4 py-3 text-sm text-textDark hidden lg:table-cell">
                          {user.district_name || user.district_id || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(user); }}
                            disabled={updateUser.isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              user.is_active ? 'bg-primary' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                user.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge variant={user.role === 'admin' ? 'primary' : 'light'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-textMuted hidden xl:table-cell">
                          {new Date(user.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                      {expandedUserId === user.id && (
                        <tr className="bg-bgLight">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-textMuted">Phone:</span>
                                <p className="font-medium text-textDark">{user.phone}</p>
                              </div>
                              <div>
                                <span className="text-textMuted">Address:</span>
                                <p className="font-medium text-textDark">{user.address || '—'}</p>
                              </div>
                              <div>
                                <span className="text-textMuted">Pincode:</span>
                                <p className="font-medium text-textDark">{user.pincode || '—'}</p>
                              </div>
                              <div>
                                <span className="text-textMuted">Parish:</span>
                                <p className="font-medium text-textDark">{user.parish_name || '—'}</p>
                              </div>
                              <div>
                                <span className="text-textMuted">CSI Member:</span>
                                <p className="font-medium text-textDark">{user.is_csi_member ? 'Yes' : 'No'}</p>
                              </div>
                              <div>
                                <span className="text-textMuted">Unit:</span>
                                <p className="font-medium text-textDark">{user.unit_name || user.unit_id || '—'}</p>
                              </div>
                              <div>
                                <span className="text-textMuted">District:</span>
                                <p className="font-medium text-textDark">{user.district_name || user.district_id || '—'}</p>
                              </div>
                              <div>
                                <span className="text-textMuted">Role:</span>
                                <p className="font-medium text-textDark capitalize">{user.role}</p>
                              </div>
                            </div>
                            {/* Reset Password */}
                            <div className="mt-4 pt-3 border-t border-borderColor">
                              {resetPasswordUserId === user.id ? (
                                <div className="flex items-end gap-2 max-w-md">
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-textMuted mb-1">New Password (min 8 chars)</label>
                                    <input
                                      type="password"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-borderColor rounded-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      placeholder="Enter new password"
                                      minLength={8}
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleResetPassword(user.id)}
                                    isLoading={resetPassword.isPending}
                                    disabled={newPassword.length < 8}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setResetPasswordUserId(null); setNewPassword(''); }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setResetPasswordUserId(user.id); setNewPassword(''); }}
                                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
                                >
                                  <KeyRound size={14} />
                                  Reset Password
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-borderColor">
              <p className="text-sm text-textMuted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page + 1 >= totalPages}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
