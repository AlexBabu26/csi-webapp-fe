import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { 
  Users, 
  KeyRound, 
  Building, 
  UserCog,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  MapPin,
  XCircle,
  Phone,
  Plus,
  UserPlus
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Portal } from '../../components/Portal';
import { 
  useUsers, 
  useUsersSummary,
  useResetPassword,
  useBulkResetPasswords,
  useResetAllByType,
  useDistrictOfficials,
  useDistrictsWithOfficialStatus,
  useCreateDistrictOfficial
} from '../../hooks/queries';

type UserType = 'all' | 'UNIT' | 'DISTRICT_OFFICIAL';

interface OfficialUser {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  user_type: string;
  is_active: boolean;
  unit_name?: string;
  district_name?: string;
}

interface DistrictOfficial {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  user_type: string;
  is_active: boolean;
  district_id?: number;
  district_name?: string;
  official_name?: string;
}

interface DistrictWithStatus {
  id: number;
  name: string;
  has_official: boolean;
  official_id?: number;
  official_name?: string;
  official_phone?: string;
  official_username?: string;
}

// Password generator
const generatePassword = (length: number = 12): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const UserManagement: React.FC = () => {
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<UserType>('all');
  const [selectedUsers, setSelectedUsers] = useState<OfficialUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Confirmation dialogs
  const [showSingleResetConfirm, setShowSingleResetConfirm] = useState(false);
  const [showBulkResetConfirm, setShowBulkResetConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [userToReset, setUserToReset] = useState<OfficialUser | null>(null);
  
  // Create district official modal
  const [showCreateOfficialModal, setShowCreateOfficialModal] = useState(false);
  const [createOfficialForm, setCreateOfficialForm] = useState({
    district_id: 0,
    official_name: '',
    phone_number: '',
  });
  const [createdOfficialResult, setCreatedOfficialResult] = useState<{
    username: string;
    district_name: string;
    default_password_hint: string;
  } | null>(null);
  
  // Fetch users based on active tab - use dedicated endpoint for district officials
  const { data: allUsers = [], isLoading: allUsersLoading, refetch: refetchAll } = useUsers({
    user_type: activeTab === 'all' ? undefined : activeTab === 'UNIT' ? 'UNIT' : undefined,
    search: searchTerm || undefined,
  });
  
  // Use dedicated endpoint for district officials
  const { data: districtOfficials = [], isLoading: districtOfficialsLoading, refetch: refetchDistrictOfficials } = useDistrictOfficials();
  
  // Get districts with official status
  const { data: districtsWithStatus = [], isLoading: districtsLoading } = useDistrictsWithOfficialStatus();
  
  const { data: summary } = useUsersSummary();
  
  // Determine which data to show based on active tab
  const users: OfficialUser[] = useMemo(() => {
    if (activeTab === 'DISTRICT_OFFICIAL') {
      // Map district officials to OfficialUser format for the table
      return districtOfficials.map(d => ({
        id: d.id,
        username: d.username,
        email: d.email,
        phone_number: d.phone_number,
        user_type: d.user_type || 'DISTRICT_OFFICIAL',
        is_active: d.is_active,
        unit_name: d.official_name,
        district_name: d.district_name,
      }));
    }
    return allUsers;
  }, [activeTab, allUsers, districtOfficials]);
  
  const isLoading = activeTab === 'DISTRICT_OFFICIAL' ? districtOfficialsLoading : allUsersLoading;
  
  const refetch = () => {
    if (activeTab === 'DISTRICT_OFFICIAL') {
      refetchDistrictOfficials();
    } else {
      refetchAll();
    }
  };
  
  // Mutations
  const resetPasswordMutation = useResetPassword();
  const bulkResetMutation = useBulkResetPasswords();
  const resetAllMutation = useResetAllByType();
  const createOfficialMutation = useCreateDistrictOfficial();
  
  // Calculate district stats
  const districtStats = useMemo(() => {
    const total = districtsWithStatus.length;
    const withOfficial = districtsWithStatus.filter(d => d.has_official).length;
    const withoutOfficial = total - withOfficial;
    return { total, withOfficial, withoutOfficial };
  }, [districtsWithStatus]);

  const tabs = [
    { 
      id: 'all' as UserType, 
      label: 'All Users', 
      icon: <Users size={18} />,
      count: summary?.total || 0
    },
    { 
      id: 'UNIT' as UserType, 
      label: 'Unit Officials', 
      icon: <Building size={18} />,
      count: summary?.unit_officials || 0
    },
    { 
      id: 'DISTRICT_OFFICIAL' as UserType, 
      label: 'District Officials', 
      icon: <UserCog size={18} />,
      count: districtOfficials.length || summary?.district_officials || 0
    },
  ];

  const openPasswordModal = () => {
    setNewPassword(generatePassword());
    setShowPassword(false);
    setPasswordCopied(false);
    setShowPasswordModal(true);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      addToast('Failed to copy password', 'error');
    }
  };

  const handleSingleReset = (user: OfficialUser) => {
    setUserToReset(user);
    openPasswordModal();
  };

  const confirmSingleReset = () => {
    if (!userToReset || !newPassword) return;
    
    setShowPasswordModal(false);
    setShowSingleResetConfirm(true);
  };

  const executeSingleReset = () => {
    if (!userToReset || !newPassword) return;
    
    resetPasswordMutation.mutate(
      { user_id: userToReset.id, new_password: newPassword },
      {
        onSuccess: (data) => {
          addToast(`Password reset for ${data.username}`, 'success');
          setShowSingleResetConfirm(false);
          setUserToReset(null);
          setNewPassword('');
        },
        onError: () => {
          setShowSingleResetConfirm(false);
        },
      }
    );
  };

  const handleBulkReset = () => {
    if (selectedUsers.length === 0) {
      addToast('Please select users to reset passwords', 'warning');
      return;
    }
    openPasswordModal();
  };

  const confirmBulkReset = () => {
    if (!newPassword) return;
    setShowPasswordModal(false);
    setShowBulkResetConfirm(true);
  };

  const executeBulkReset = () => {
    const userIds = selectedUsers.map(u => u.id);
    
    bulkResetMutation.mutate(
      { user_ids: userIds, new_password: newPassword },
      {
        onSuccess: (data) => {
          addToast(
            `Passwords reset for ${data.total_reset} of ${data.total_requested} users`,
            data.total_reset === data.total_requested ? 'success' : 'warning'
          );
          setShowBulkResetConfirm(false);
          setSelectedUsers([]);
          setNewPassword('');
          refetch();
        },
        onError: () => {
          setShowBulkResetConfirm(false);
        },
      }
    );
  };

  const handleResetAll = () => {
    if (activeTab === 'all') {
      addToast('Please select a specific user type tab to reset all', 'warning');
      return;
    }
    openPasswordModal();
  };

  const confirmResetAll = () => {
    if (!newPassword || activeTab === 'all') return;
    setShowPasswordModal(false);
    setShowResetAllConfirm(true);
  };

  const executeResetAll = () => {
    if (activeTab === 'all') return;
    
    resetAllMutation.mutate(
      { user_type: activeTab, new_password: newPassword },
      {
        onSuccess: (data) => {
          addToast(
            `Passwords reset for ${data.total_reset} ${activeTab === 'UNIT' ? 'unit' : 'district'} officials`,
            'success'
          );
          setShowResetAllConfirm(false);
          setNewPassword('');
          refetch();
        },
        onError: () => {
          setShowResetAllConfirm(false);
        },
      }
    );
  };

  // Create District Official handlers
  const openCreateOfficialModal = () => {
    setCreateOfficialForm({ district_id: 0, official_name: '', phone_number: '' });
    setCreatedOfficialResult(null);
    setShowCreateOfficialModal(true);
  };

  const handleCreateOfficial = () => {
    if (!createOfficialForm.district_id || !createOfficialForm.official_name || !createOfficialForm.phone_number) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    if (!/^\d{10}$/.test(createOfficialForm.phone_number)) {
      addToast('Phone number must be exactly 10 digits', 'error');
      return;
    }

    createOfficialMutation.mutate(createOfficialForm, {
      onSuccess: (data) => {
        setCreatedOfficialResult({
          username: data.username,
          district_name: data.district_name,
          default_password_hint: data.default_password_hint,
        });
        refetchDistrictOfficials();
      },
    });
  };

  const closeCreateOfficialModal = () => {
    setShowCreateOfficialModal(false);
    setCreateOfficialForm({ district_id: 0, official_name: '', phone_number: '' });
    setCreatedOfficialResult(null);
  };

  // Get districts without officials for the dropdown
  const districtsWithoutOfficials = useMemo(() => {
    return districtsWithStatus.filter(d => !d.has_official);
  }, [districtsWithStatus]);

  const columns: ColumnDef<OfficialUser, any>[] = useMemo(() => [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${row.original.user_type === 'UNIT' ? 'bg-primary/10' : 'bg-amber-100'}`}>
            {row.original.user_type === 'UNIT' ? (
              <Building className="w-4 h-4 text-primary" />
            ) : (
              <UserCog className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-textDark">{row.original.username}</p>
            <p className="text-xs text-textMuted">
              {row.original.user_type === 'UNIT' ? 'Unit Official' : 'District Official'}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'unit_name',
      header: 'Unit / District',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.unit_name && (
            <p className="text-textDark">{row.original.unit_name}</p>
          )}
          {row.original.district_name && (
            <p className="text-textMuted">{row.original.district_name}</p>
          )}
          {!row.original.unit_name && !row.original.district_name && (
            <span className="text-textMuted">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phone_number',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.email && row.original.email !== row.original.username && (
            <p className="text-textDark">{row.original.email}</p>
          )}
          {row.original.phone_number && (
            <p className="text-textMuted">{row.original.phone_number}</p>
          )}
          {(!row.original.email || row.original.email === row.original.username) && !row.original.phone_number && (
            <span className="text-textMuted">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'light'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleSingleReset(row.original)}
          disabled={resetPasswordMutation.isPending}
        >
          <KeyRound className="w-4 h-4 mr-1" />
          Reset
        </Button>
      ),
    },
  ], [resetPasswordMutation.isPending]);

  // Determine which action is pending for the password modal
  const isPendingAction = userToReset 
    ? 'single' 
    : selectedUsers.length > 0 
      ? 'bulk' 
      : activeTab !== 'all' 
        ? 'all' 
        : null;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-textMuted">Manage login credentials for unit and district officials</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'DISTRICT_OFFICIAL' && (
            <Button 
              variant="primary" 
              onClick={openCreateOfficialModal}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create District Official
            </Button>
          )}
          {selectedUsers.length > 0 && (
            <Button 
              variant="primary" 
              onClick={handleBulkReset}
              disabled={bulkResetMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${bulkResetMutation.isPending ? 'animate-spin' : ''}`} />
              Reset {selectedUsers.length} Selected
            </Button>
          )}
          {activeTab !== 'all' && selectedUsers.length === 0 && (
            <Button 
              variant="danger" 
              onClick={handleResetAll}
              disabled={resetAllMutation.isPending}
            >
              <Shield className={`w-4 h-4 mr-2 ${resetAllMutation.isPending ? 'animate-spin' : ''}`} />
              Reset All {activeTab === 'UNIT' ? 'Unit' : 'District'} Officials
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-borderColor">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedUsers([]);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-textMuted hover:text-textDark hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              <Badge variant={activeTab === tab.id ? 'primary' : 'light'} className="ml-1">
                {tab.count}
              </Badge>
            </button>
          ))}
        </nav>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium text-amber-900">Password Reset Information</h3>
            <p className="text-sm text-amber-700 mt-1">
              {activeTab === 'all' 
                ? 'View all users. Select a specific tab to enable bulk reset options.'
                : activeTab === 'UNIT'
                  ? 'Unit officials who manage their unit registrations and member data.'
                  : 'District officials who manage Kalamela and Conference registrations.'
              }
              {' '}You can reset passwords individually, in bulk (select multiple), or all at once.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Total Users</p>
              <p className="text-2xl font-bold text-textDark">{summary?.total || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Unit Officials</p>
              <p className="text-2xl font-bold text-textDark">{summary?.unit_officials || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <UserCog className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-textMuted">District Officials</p>
              <p className="text-2xl font-bold text-textDark">{districtOfficials.length || summary?.district_officials || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Selected</p>
              <p className="text-2xl font-bold text-textDark">{selectedUsers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* District Status Overview - Show when District Officials tab is active */}
      {activeTab === 'DISTRICT_OFFICIAL' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-textDark flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                District Official Status
              </h3>
              <p className="text-sm text-textMuted mt-1">
                Overview of districts and their assigned officials
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-textMuted">Has Official ({districtStats.withOfficial})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-textMuted">No Official ({districtStats.withoutOfficial})</span>
              </div>
            </div>
          </div>
          
          {districtsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-100 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {districtsWithStatus.map((district) => (
                <div 
                  key={district.id}
                  className={`p-4 rounded-lg border transition-all ${
                    district.has_official 
                      ? 'bg-success/5 border-success/30 hover:border-success/50' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {district.has_official ? (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <p className="font-medium text-textDark truncate">{district.name}</p>
                      </div>
                      {district.has_official && district.official_name && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-textMuted truncate">
                            {district.official_name}
                          </p>
                          {district.official_phone && (
                            <p className="text-xs text-textMuted flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {district.official_phone}
                            </p>
                          )}
                          <p className="text-xs text-primary font-medium">
                            Login: {district.official_username || district.name}
                          </p>
                        </div>
                      )}
                      {!district.has_official && (
                        <p className="text-xs text-textMuted mt-1">No official assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <DataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search by username, email, or phone..."
          showSearch={true}
          showPagination={true}
          showRowSelection={true}
          pageSize={10}
          onRowSelectionChange={setSelectedUsers}
          isLoading={isLoading}
          emptyMessage="No users found"
          emptyIcon={<Users className="w-8 h-8 text-textMuted" />}
        />
      </Card>

      {/* Password Input Modal */}
      {showPasswordModal && (
        <Portal>
          <div 
            className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100] transition-opacity" 
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-borderColor">
                <h3 className="text-lg font-semibold text-textDark flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />
                  Set New Password
                </h3>
                <p className="text-sm text-textMuted mt-1">
                  {userToReset 
                    ? `Reset password for ${userToReset.username}`
                    : selectedUsers.length > 0
                      ? `Reset password for ${selectedUsers.length} selected users`
                      : `Reset password for all ${activeTab === 'UNIT' ? 'unit' : 'district'} officials`
                  }
                </p>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-1.5">
                    New Password <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-3 py-2.5 pr-20 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      minLength={6}
                      maxLength={128}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-textMuted hover:text-textDark rounded-md hover:bg-bgLight"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={copyPassword}
                        className="p-1.5 text-textMuted hover:text-textDark rounded-md hover:bg-bgLight"
                      >
                        {passwordCopied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-textMuted mt-1.5">
                    Password must be 6-128 characters
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setNewPassword(generatePassword())}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Random Password
                </Button>
              </div>

              <div className="px-6 py-4 border-t border-borderColor flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setUserToReset(null);
                    setNewPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    if (newPassword.length < 6) {
                      addToast('Password must be at least 6 characters', 'error');
                      return;
                    }
                    if (userToReset) {
                      confirmSingleReset();
                    } else if (selectedUsers.length > 0) {
                      confirmBulkReset();
                    } else {
                      confirmResetAll();
                    }
                  }}
                  disabled={newPassword.length < 6}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Single Reset Confirmation */}
      <ConfirmDialog
        isOpen={showSingleResetConfirm}
        title="Confirm Password Reset"
        message={`Are you sure you want to reset the password for "${userToReset?.username}"? Make sure you have copied the new password.`}
        confirmLabel="Reset Password"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={executeSingleReset}
        onCancel={() => {
          setShowSingleResetConfirm(false);
          setUserToReset(null);
          setNewPassword('');
        }}
      />

      {/* Bulk Reset Confirmation */}
      <ConfirmDialog
        isOpen={showBulkResetConfirm}
        title="Confirm Bulk Password Reset"
        message={`Are you sure you want to reset passwords for ${selectedUsers.length} users? All selected users will receive the same new password. Make sure you have copied it.`}
        confirmLabel={`Reset ${selectedUsers.length} Passwords`}
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={executeBulkReset}
        onCancel={() => {
          setShowBulkResetConfirm(false);
          setNewPassword('');
        }}
      />

      {/* Reset All Confirmation */}
      <ConfirmDialog
        isOpen={showResetAllConfirm}
        title="⚠️ Reset ALL Passwords"
        message={`WARNING: This will reset passwords for ALL ${activeTab === 'UNIT' ? 'unit' : 'district'} officials (${activeTab === 'UNIT' ? summary?.unit_officials : summary?.district_officials} users). This action cannot be undone. Make sure you have copied the new password.`}
        confirmLabel={`Reset All ${activeTab === 'UNIT' ? 'Unit' : 'District'} Official Passwords`}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeResetAll}
        onCancel={() => {
          setShowResetAllConfirm(false);
          setNewPassword('');
        }}
      />

      {/* Create District Official Modal */}
      {showCreateOfficialModal && (
        <Portal>
          <div 
            className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100] transition-opacity" 
            onClick={closeCreateOfficialModal}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-borderColor">
                <h3 className="text-lg font-semibold text-textDark flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Create District Official
                </h3>
                <p className="text-sm text-textMuted mt-1">
                  Create a new login account for a district official
                </p>
              </div>

              {createdOfficialResult ? (
                // Success view
                <div className="px-6 py-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h4 className="text-lg font-semibold text-textDark">Official Created Successfully!</h4>
                    <p className="text-sm text-textMuted mt-1">
                      Share these credentials with the district official
                    </p>
                  </div>
                  
                  <div className="space-y-3 bg-bgLight p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-textMuted">District:</span>
                      <span className="font-medium text-textDark">{createdOfficialResult.district_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-textMuted">Username:</span>
                      <span className="font-mono font-medium text-primary">{createdOfficialResult.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-textMuted">Default Password:</span>
                      <span className="font-medium text-textDark">{createdOfficialResult.default_password_hint}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      The default password is the phone number. Advise the official to change it after first login.
                    </p>
                  </div>

                  <div className="mt-6">
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={closeCreateOfficialModal}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                // Form view
                <>
                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-1.5">
                        District <span className="text-danger">*</span>
                      </label>
                      <select
                        value={createOfficialForm.district_id}
                        onChange={(e) => setCreateOfficialForm(prev => ({ ...prev, district_id: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                      >
                        <option value={0}>Select a district...</option>
                        {districtsWithoutOfficials.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                      {districtsWithoutOfficials.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1.5">
                          All districts already have officials assigned
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textDark mb-1.5">
                        Official Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={createOfficialForm.official_name}
                        onChange={(e) => setCreateOfficialForm(prev => ({ ...prev, official_name: e.target.value }))}
                        placeholder="Enter official's full name"
                        className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textDark mb-1.5">
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                        <input
                          type="tel"
                          value={createOfficialForm.phone_number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setCreateOfficialForm(prev => ({ ...prev, phone_number: value }));
                          }}
                          placeholder="10-digit phone number"
                          className="w-full pl-10 pr-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-textMuted mt-1.5">
                        This will be used as the default password
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-borderColor flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={closeCreateOfficialModal}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleCreateOfficial}
                      disabled={
                        createOfficialMutation.isPending || 
                        !createOfficialForm.district_id || 
                        !createOfficialForm.official_name || 
                        createOfficialForm.phone_number.length !== 10
                      }
                    >
                      {createOfficialMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Official
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

