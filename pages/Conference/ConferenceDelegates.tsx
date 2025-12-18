import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Search,
  AlertCircle,
  CheckCircle,
  Target,
  CreditCard,
  Utensils,
  UserCog
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { ConferenceOfficialView, ConferenceDelegatesResponse } from '../../types';
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

// Delegate member type from API
interface DelegateMember {
  id: number;
  name: string;
  number: string;
  gender: string;
}

// Delegate official type from API
interface DelegateOfficial {
  id: number;
  name: string;
  phone: string;
}

export const ConferenceDelegates: React.FC = () => {
  const { addToast } = useToast();
  const context = useOutletContext<ConferenceContext>();
  
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [delegateMembers, setDelegateMembers] = useState<DelegateMember[]>([]);
  const [delegateOfficials, setDelegateOfficials] = useState<DelegateOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [delegatesSearchTerm, setDelegatesSearchTerm] = useState('');
  
  // Delegates info from API
  const [delegatesInfo, setDelegatesInfo] = useState<{
    delegates_count: number;
    max_count: number;
    payment_status: string;
    amount_to_pay: number;
    food_preference: { veg_count: number; non_veg_count: number };
  } | null>(null);
  
  // Conference info from view API
  const [conferenceInfo, setConferenceInfo] = useState<{
    rem_count: number;
    max_count: number;
    allowed_count: number;
    member_count: number;
    district: string;
  } | null>(null);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null);
  const [selectedDelegate, setSelectedDelegate] = useState<DelegateMember | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load conference view data (available members)
      const viewData = await api.getConferenceOfficialView();
      setAvailableMembers(viewData.available_members || []);
      setRegistrationOpen(viewData.registration_open);
      setConferenceInfo({
        rem_count: viewData.rem_count,
        max_count: viewData.max_count,
        allowed_count: viewData.allowed_count,
        member_count: viewData.member_count,
        district: viewData.district,
      });
      
      // Load delegates data
      try {
        const delegatesData = await api.getConferenceDelegatesOfficial();
        setDelegateMembers(delegatesData.delegate_members || []);
        setDelegateOfficials(delegatesData.delegate_officials || []);
        setDelegatesInfo({
          delegates_count: delegatesData.delegates_count,
          max_count: delegatesData.max_count,
          payment_status: delegatesData.payment_status,
          amount_to_pay: delegatesData.amount_to_pay,
          food_preference: delegatesData.food_preference,
        });
      } catch (err) {
        // Delegates endpoint might fail if no delegates yet
        console.log('Could not fetch delegates:', err);
        setDelegateMembers([]);
        setDelegateOfficials([]);
      }
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
      await api.addConferenceDelegateOfficial(selectedMember.id);
      addToast(`${selectedMember.name} added as delegate`, 'success');
      setShowAddDialog(false);
      setSelectedMember(null);
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
      await api.removeConferenceDelegateOfficial(selectedDelegate.id);
      addToast(`${selectedDelegate.name} removed from delegates`, 'success');
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

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  const filteredDelegateMembers = delegateMembers.filter(member =>
    member.name.toLowerCase().includes(delegatesSearchTerm.toLowerCase()) ||
    member.number?.includes(delegatesSearchTerm)
  );

  const filteredDelegateOfficials = delegateOfficials.filter(official =>
    official.name.toLowerCase().includes(delegatesSearchTerm.toLowerCase()) ||
    official.phone?.includes(delegatesSearchTerm)
  );

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'INVALID':
        return <Badge variant="danger">Invalid</Badge>;
      default:
        return <Badge variant="default">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalDelegates = delegatesInfo?.delegates_count || (delegateMembers.length + delegateOfficials.length);
  const canAddMore = conferenceInfo && conferenceInfo.rem_count > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Delegates</h1>
          <p className="text-gray-500 mt-1">
            {conferenceInfo?.district} District - Add delegates for the conference
          </p>
        </div>
        {registrationOpen && canAddMore && (
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Delegate
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalDelegates}</p>
              <p className="text-sm text-gray-500">Registered Delegates</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{delegatesInfo?.max_count || conferenceInfo?.max_count || 0}</p>
              <p className="text-sm text-gray-500">Max Allowed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{delegatesInfo?.amount_to_pay || 0}</p>
              <p className="text-sm text-gray-500">Amount to Pay</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Utensils className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">
                <span className="text-green-600">{delegatesInfo?.food_preference?.veg_count || 0}</span>
                {' / '}
                <span className="text-red-600">{delegatesInfo?.food_preference?.non_veg_count || 0}</span>
              </p>
              <p className="text-sm text-gray-500">Veg / Non-Veg</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Status Banner */}
      {delegatesInfo && (
        <Card className={`p-4 ${delegatesInfo.payment_status === 'PAID' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className={`w-5 h-5 ${delegatesInfo.payment_status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <span className="font-medium text-gray-800">Payment Status: </span>
                {getPaymentStatusBadge(delegatesInfo.payment_status)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-gray-800">₹{delegatesInfo.amount_to_pay}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Registration Closed Alert */}
      {!registrationOpen && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Registration Closed</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You cannot add or remove delegates as the registration period has ended or slots are full.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Registered Delegates Section */}
      {(delegateMembers.length > 0 || delegateOfficials.length > 0) && (
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Registered Delegates ({totalDelegates})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Members and officials registered for the conference
            </p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search delegates..."
                value={delegatesSearchTerm}
                onChange={(e) => setDelegatesSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Delegate Officials */}
          {filteredDelegateOfficials.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Officials ({filteredDelegateOfficials.length})
              </h4>
              <div className="space-y-2">
                {filteredDelegateOfficials.map((official) => (
                  <div key={`official-${official.id}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {official.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{official.name}</p>
                        <p className="text-sm text-gray-500">{official.phone || '-'}</p>
                      </div>
                    </div>
                    <Badge variant="info">Official</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delegate Members */}
          {filteredDelegateMembers.length > 0 && (
            <div className="overflow-x-auto">
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members ({filteredDelegateMembers.length})
                </h4>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    {registrationOpen && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDelegateMembers.map((member) => (
                    <tr key={`member-${member.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {member.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{member.number || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={member.gender === 'M' ? 'info' : 'default'}>
                          {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender}
                        </Badge>
                      </td>
                      {registrationOpen && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDelegate(member);
                              setShowRemoveDialog(true);
                            }}
                            className="text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredDelegateMembers.length === 0 && filteredDelegateOfficials.length === 0 && delegatesSearchTerm && (
            <div className="p-8 text-center text-gray-500">
              No delegates found matching your search
            </div>
          )}
        </Card>
      )}

      {/* Available Members List */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-500" />
            Available Members ({availableMembers.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Members from your district who can be added as delegates
          </p>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                {registrationOpen && canAddMore && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No members found matching your search' : 'No available members'}
                  </td>
                </tr>
              ) : (
                filteredMembers.slice(0, 50).map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-orange-600">
                            {member.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{member.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={member.gender === 'M' ? 'info' : 'default'}>
                        {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender}
                      </Badge>
                    </td>
                    {registrationOpen && canAddMore && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowAddDialog(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredMembers.length > 50 && (
            <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
              Showing 50 of {filteredMembers.length} members. Use search to find specific members.
            </div>
          )}
        </div>
      </Card>

      {/* Add Delegate Dialog */}
      {showAddDialog && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Add Delegate</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-orange-600">
                    {selectedMember.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selectedMember.name}</p>
                  <p className="text-sm text-gray-500">{selectedMember.phone}</p>
                </div>
              </div>
              
              <p className="text-gray-600">
                Are you sure you want to add <strong>{selectedMember.name}</strong> as a delegate for the conference?
              </p>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setSelectedMember(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddDelegate} 
                disabled={processing}
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
        message={`Are you sure you want to remove ${selectedDelegate?.name} from the delegates list?`}
        confirmText="Remove"
        confirmVariant="danger"
        isLoading={processing}
      />
    </div>
  );
};
