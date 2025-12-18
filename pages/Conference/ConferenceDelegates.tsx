import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Search,
  AlertCircle,
  CheckCircle,
  Utensils
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { DataTable, Column } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { ConferenceOfficialView, ConferenceDelegate } from '../../types';
import { useToast } from '../../components/Toast';

interface ConferenceContext {
  conferenceData: ConferenceOfficialView | null;
  loading: boolean;
  refreshData: () => void;
}

interface AvailableMember {
  id: number;
  name: string;
  gender: string;
  phone?: string;
}

export const ConferenceDelegates: React.FC = () => {
  const { addToast } = useToast();
  const context = useOutletContext<ConferenceContext>();
  
  const [delegates, setDelegates] = useState<ConferenceDelegate[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null);
  const [selectedDelegate, setSelectedDelegate] = useState<ConferenceDelegate | null>(null);
  const [foodPreference, setFoodPreference] = useState<'veg' | 'non-veg'>('veg');
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getConferenceOfficialView();
      setDelegates(data.unit_delegates || []);
      setAvailableMembers(data.available_members || []);
      setRegistrationOpen(data.registration_open);
    } catch (error: any) {
      addToast(error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDelegate = async () => {
    if (!selectedMember) return;
    
    setProcessing(true);
    try {
      await api.addConferenceDelegateOfficial(selectedMember.id, {
        member_id: selectedMember.id,
        food_preference: foodPreference,
        accommodation_required: accommodationRequired
      });
      addToast(`${selectedMember.name} added as delegate`, 'success');
      setShowAddDialog(false);
      setSelectedMember(null);
      setFoodPreference('veg');
      setAccommodationRequired(false);
      loadData();
      context?.refreshData?.();
    } catch (error: any) {
      addToast(error.message || 'Failed to add delegate', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveDelegate = async () => {
    if (!selectedDelegate) return;
    
    setProcessing(true);
    try {
      await api.removeConferenceDelegateOfficial(selectedDelegate.member_id);
      addToast(`${selectedDelegate.member_name} removed from delegates`, 'success');
      setShowRemoveDialog(false);
      setSelectedDelegate(null);
      loadData();
      context?.refreshData?.();
    } catch (error: any) {
      addToast(error.message || 'Failed to remove delegate', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetFoodPreference = async (delegate: ConferenceDelegate, preference: 'veg' | 'non-veg') => {
    try {
      await api.setConferenceFoodPreference({
        member_id: delegate.member_id,
        preference
      });
      addToast('Food preference updated', 'success');
      loadData();
    } catch (error: any) {
      addToast(error.message || 'Failed to update food preference', 'error');
    }
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  const columns: Column<ConferenceDelegate>[] = [
    {
      key: 'member_name',
      header: 'Name',
      sortable: true,
      render: (delegate) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-orange-600">
              {delegate.member_name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-800">{delegate.member_name}</p>
            <p className="text-xs text-gray-500">{delegate.member_phone || 'No phone'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'member_gender',
      header: 'Gender',
      render: (delegate) => (
        <span className="text-gray-600">{delegate.member_gender || '-'}</span>
      )
    },
    {
      key: 'food_preference',
      header: 'Food Preference',
      render: (delegate) => (
        <div className="flex items-center gap-2">
          {registrationOpen ? (
            <select
              value={delegate.food_preference || 'veg'}
              onChange={(e) => handleSetFoodPreference(delegate, e.target.value as 'veg' | 'non-veg')}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="veg">🥬 Veg</option>
              <option value="non-veg">🍖 Non-Veg</option>
            </select>
          ) : (
            <span className={`px-2 py-1 text-xs rounded-full ${
              delegate.food_preference === 'veg' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {delegate.food_preference === 'veg' ? '🥬 Veg' : '🍖 Non-Veg'}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'accommodation_required',
      header: 'Accommodation',
      render: (delegate) => (
        <Badge variant={delegate.accommodation_required ? 'info' : 'default'}>
          {delegate.accommodation_required ? 'Required' : 'Not Required'}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (delegate) => (
        <Badge variant={delegate.status === 'confirmed' ? 'success' : delegate.status === 'cancelled' ? 'danger' : 'warning'}>
          {delegate.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (delegate) => (
        registrationOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setSelectedDelegate(delegate);
              setShowRemoveDialog(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Delegates</h1>
          <p className="text-gray-500 mt-1">Add or remove delegates for the conference</p>
        </div>
        {registrationOpen && (
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Delegate
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{delegates.length}</p>
              <p className="text-sm text-gray-500">Total Delegates</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {delegates.filter(d => d.status === 'confirmed').length}
              </p>
              <p className="text-sm text-gray-500">Confirmed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{availableMembers.length}</p>
              <p className="text-sm text-gray-500">Available to Add</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Registration Closed Alert */}
      {!registrationOpen && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Registration Closed</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You cannot add or remove delegates as the registration period has ended.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Delegates Table */}
      <Card noPadding>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Registered Delegates</h3>
        </div>
        <DataTable
          data={delegates}
          columns={columns}
          searchPlaceholder="Search delegates..."
          emptyMessage="No delegates registered yet"
          emptyIcon={<Users className="w-8 h-8 text-gray-400" />}
        />
      </Card>

      {/* Add Delegate Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Add Delegate</h3>
              <p className="text-sm text-gray-500 mt-1">Select a member to add as delegate</p>
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-h-64">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No members available</p>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedMember?.id === member.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-gray-800">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.phone || 'No phone'} • {member.gender}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMember && (
              <div className="p-4 border-t border-gray-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Utensils className="w-4 h-4 inline mr-1" />
                    Food Preference
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="food"
                        value="veg"
                        checked={foodPreference === 'veg'}
                        onChange={() => setFoodPreference('veg')}
                        className="mr-2"
                      />
                      🥬 Vegetarian
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="food"
                        value="non-veg"
                        checked={foodPreference === 'non-veg'}
                        onChange={() => setFoodPreference('non-veg')}
                        className="mr-2"
                      />
                      🍖 Non-Vegetarian
                    </label>
                  </div>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={accommodationRequired}
                      onChange={(e) => setAccommodationRequired(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Accommodation Required</span>
                  </label>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setSelectedMember(null);
                setSearchTerm('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddDelegate} 
                disabled={!selectedMember || processing}
                isLoading={processing}
              >
                Add Delegate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Remove Delegate Confirmation */}
      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setSelectedDelegate(null);
        }}
        onConfirm={handleRemoveDelegate}
        title="Remove Delegate"
        message={`Are you sure you want to remove ${selectedDelegate?.member_name} from the delegates list?`}
        confirmText="Remove"
        confirmVariant="danger"
        isLoading={processing}
      />
    </div>
  );
};

