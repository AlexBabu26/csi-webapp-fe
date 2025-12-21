import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Plus, CheckCircle, XCircle, Search, Users, Calendar, Phone, User, Filter } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useEligibleIndividualMembers, useAddIndividualParticipant } from '../../hooks/queries';

interface Member {
  id: number;
  name: string;
  age: number;
  gender: string;
  unit_name: string;
  is_excluded: boolean;
  is_registered: boolean;
  phone_number?: string;
  date_of_birth?: string;
  contact_number?: string;
}

export const SelectIndividualParticipants: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const parsedEventId = parseInt(eventId!);
  
  // Use TanStack Query
  const { data, isLoading: loading, refetch } = useEligibleIndividualMembers(parsedEventId);
  const addParticipantMutation = useAddIndividualParticipant();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [memberCategories, setMemberCategories] = useState<Record<number, 'NA' | 'Junior' | 'Senior'>>({});
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Get unique unit names for filter dropdown
  const unitNames = useMemo(() => {
    if (!data?.eligible_members) return [];
    const units = [...new Set(data.eligible_members.map((m: Member) => m.unit_name))];
    return units.sort();
  }, [data]);

  const handleSelectMember = (memberId: number) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (!data?.eligible_members) return;
    const eligibleIds = filteredMembers
      .filter((m: Member) => !m.is_registered && !m.is_excluded)
      .map((m: Member) => m.id);
    
    if (selectedMembers.size === eligibleIds.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(eligibleIds));
    }
  };

  const handleCategoryChange = (memberId: number, category: 'NA' | 'Junior' | 'Senior') => {
    setMemberCategories(prev => ({
      ...prev,
      [memberId]: category
    }));
  };

  const handleAddParticipant = async (memberId: number) => {
    const category = memberCategories[memberId] || 'NA';
    if (category === 'NA') {
      addToast("Please select Junior or Senior category", "warning");
      return;
    }

    addParticipantMutation.mutate(
      {
        individual_event_id: parsedEventId,
        participant_id: memberId,
        seniority_category: category,
      },
      {
        onSuccess: () => {
          refetch();
          // Remove from selected after successful add
          const newSelected = new Set(selectedMembers);
          newSelected.delete(memberId);
          setSelectedMembers(newSelected);
        },
      }
    );
  };

  const handleBulkAdd = async () => {
    if (selectedMembers.size === 0) {
      addToast("Please select at least one member", "warning");
      return;
    }

    // Check if all selected members have categories assigned
    const membersWithoutCategory = Array.from(selectedMembers).filter(
      id => !memberCategories[id] || memberCategories[id] === 'NA'
    );

    if (membersWithoutCategory.length > 0) {
      addToast(`Please select Junior/Senior category for all selected members (${membersWithoutCategory.length} missing)`, "warning");
      return;
    }

    // Add participants one by one
    for (const memberId of selectedMembers) {
      await addParticipantMutation.mutateAsync({
        individual_event_id: parsedEventId,
        participant_id: memberId,
        seniority_category: memberCategories[memberId],
      });
    }

    addToast(`Successfully added ${selectedMembers.size} participants`, "success");
    setSelectedMembers(new Set());
    refetch();
  };

  const submitting = addParticipantMutation.isPending;

  const filteredMembers = useMemo(() => {
    if (!data?.eligible_members) return [];
    return data.eligible_members.filter((member: Member) => {
      const matchesSearch = 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone_number && member.phone_number.includes(searchTerm));
      
      const matchesUnit = filterUnit === 'all' || member.unit_name === filterUnit;
      
      return matchesSearch && matchesUnit;
    });
  }, [data, searchTerm, filterUnit]);

  // Calculate age from date of birth
  const calculateAge = (dob: string | undefined): number | string => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format date for display
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const eligibleCount = filteredMembers.filter((m: Member) => !m.is_registered && !m.is_excluded).length;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">{data.event_name}</h1>
          <p className="text-sm text-textMuted mt-1">{data.event_description}</p>
        </div>
        {selectedMembers.size > 0 && (
          <Button variant="primary" onClick={handleBulkAdd} disabled={submitting}>
            <Plus className="w-4 h-4 mr-2" />
            Add Selected ({selectedMembers.size})
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-textMuted">Total Members</p>
              <p className="text-xl font-bold text-primary">{data.eligible_members?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs text-textMuted">Registered</p>
              <p className="text-xl font-bold text-success">
                {data.eligible_members?.filter((m: Member) => m.is_registered).length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-warning" />
            <div>
              <p className="text-xs text-textMuted">Available</p>
              <p className="text-xl font-bold text-warning">{eligibleCount}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gray-100 border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-textMuted">Selected</p>
              <p className="text-xl font-bold text-gray-700">{selectedMembers.size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search by name, unit, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-textMuted" />
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
            >
              <option value="all">All Units</option>
              {unitNames.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-borderColor">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMembers.size > 0 && selectedMembers.size === eligibleCount}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary border-borderColor rounded focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Contact Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Age
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Unit Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderColor">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-textMuted font-medium">
                      {searchTerm || filterUnit !== 'all' 
                        ? 'No members found matching your filters' 
                        : 'No eligible members available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member: Member) => {
                  const isDisabled = member.is_registered || member.is_excluded;
                  const isSelected = selectedMembers.has(member.id);
                  const displayAge = member.age || calculateAge(member.date_of_birth);
                  
                  return (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary/5' : ''} ${isDisabled ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectMember(member.id)}
                          disabled={isDisabled}
                          className="w-4 h-4 text-primary border-borderColor rounded focus:ring-primary disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted">
                        #{member.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-textDark">{member.name}</span>
                          <Badge variant={member.gender === 'M' ? 'primary' : 'success'} className="text-xs">
                            {member.gender === 'M' ? 'M' : 'F'}
                          </Badge>
                          {member.is_excluded && (
                            <Badge variant="danger" className="text-xs">Excluded</Badge>
                          )}
                          {member.is_registered && (
                            <Badge variant="success" className="text-xs">Registered</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-textMuted" />
                          {member.phone_number || member.contact_number || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-textMuted" />
                          {formatDate(member.date_of_birth)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark font-medium">
                        {displayAge} {typeof displayAge === 'number' ? 'yrs' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark">
                        {member.unit_name}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={memberCategories[member.id] || 'NA'}
                          onChange={(e) => handleCategoryChange(member.id, e.target.value as 'NA' | 'Junior' | 'Senior')}
                          disabled={isDisabled}
                          className={`px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                            memberCategories[member.id] === 'Junior' 
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : memberCategories[member.id] === 'Senior'
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'border-borderColor'
                          }`}
                        >
                          <option value="NA">Select</option>
                          <option value="Junior">Junior</option>
                          <option value="Senior">Senior</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant={member.is_registered ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleAddParticipant(member.id)}
                          disabled={submitting || isDisabled}
                        >
                          {member.is_registered ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Added
                            </>
                          ) : member.is_excluded ? (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Excluded
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/kalamela/official/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
        <div className="flex gap-3">
          {selectedMembers.size > 0 && (
            <Button variant="primary" onClick={handleBulkAdd} disabled={submitting}>
              <Plus className="w-4 h-4 mr-2" />
              Add Selected ({selectedMembers.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/kalamela/official/participants')}>
            View All Participants
          </Button>
        </div>
      </div>
    </div>
  );
};
