import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Plus, CheckCircle, XCircle, Search, Users, Calendar, Phone, User, Filter } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useDistrictMembers, useAddIndividualParticipant, useEligibleIndividualMembers } from '../../hooks/queries';
import { formatDate } from '../../utils/kalamelaValidation';

interface Member {
  id: number;
  name: string;
  phone_number: string;
  dob: string;
  age: number;
  gender: string;
  unit_id: number;
  unit_name: string;
  participation_category: 'Junior' | 'Senior' | 'Ineligible';
  is_excluded: boolean;
  is_registered?: boolean;
}

export const SelectIndividualParticipants: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const parsedEventId = parseInt(eventId!);
  
  // Fetch event details
  const { data: eventData } = useEligibleIndividualMembers(parsedEventId);
  
  // Fetch all district members using the new API
  const { data: districtData, isLoading: loading, refetch } = useDistrictMembers();
  
  const addParticipantMutation = useAddIndividualParticipant();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [memberCategories, setMemberCategories] = useState<Record<number, 'Junior' | 'Senior'>>({});
  const [filterUnit, setFilterUnit] = useState<number | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Junior' | 'Senior' | 'Ineligible'>('all');

  // Get units from API response
  const units = districtData?.units || [];
  
  // Get summary from API response
  const summary = districtData?.summary;

  // Client-side filtering (no API call needed)
  const filteredMembers = useMemo(() => {
    if (!districtData?.members) return [];
    return districtData.members.filter((member: Member) => {
      const matchesSearch = !searchTerm || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone_number && member.phone_number.includes(searchTerm));
      
      const matchesUnit = filterUnit === 'all' || member.unit_id === filterUnit;
      const matchesCategory = filterCategory === 'all' || member.participation_category === filterCategory;
      
      return matchesSearch && matchesUnit && matchesCategory;
    });
  }, [districtData, searchTerm, filterUnit, filterCategory]);

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
    const eligibleIds = filteredMembers
      .filter((m: Member) => !m.is_registered && !m.is_excluded && m.participation_category !== 'Ineligible')
      .map((m: Member) => m.id);
    
    if (selectedMembers.size === eligibleIds.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(eligibleIds));
    }
  };

  const handleCategoryChange = (memberId: number, category: 'Junior' | 'Senior') => {
    setMemberCategories(prev => ({
      ...prev,
      [memberId]: category
    }));
  };

  const handleAddParticipant = async (memberId: number) => {
    const member = districtData?.members.find((m: Member) => m.id === memberId);
    const category = memberCategories[memberId] || (member?.participation_category !== 'Ineligible' ? member?.participation_category : null);
    
    if (!category || category === 'Ineligible') {
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

    let successCount = 0;
    for (const memberId of selectedMembers) {
      const member = districtData?.members.find((m: Member) => m.id === memberId);
      const category = memberCategories[memberId] || (member?.participation_category !== 'Ineligible' ? member?.participation_category : null);
      
      if (!category || category === 'Ineligible') continue;

      try {
        await addParticipantMutation.mutateAsync({
          individual_event_id: parsedEventId,
          participant_id: memberId,
          seniority_category: category,
        });
        successCount++;
      } catch (err) {
        // Continue with next member
      }
    }

    if (successCount > 0) {
      addToast(`Successfully added ${successCount} participants`, "success");
    }
    setSelectedMembers(new Set());
    refetch();
  };

  const submitting = addParticipantMutation.isPending;

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const eligibleCount = filteredMembers.filter((m: Member) => !m.is_registered && !m.is_excluded && m.participation_category !== 'Ineligible').length;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">{eventData?.event_name || 'Select Participants'}</h1>
          <p className="text-sm text-textMuted mt-1">{eventData?.event_description || 'Choose participants from your district'}</p>
        </div>
        {selectedMembers.size > 0 && (
          <Button variant="primary" onClick={handleBulkAdd} disabled={submitting}>
            <Plus className="w-4 h-4 mr-2" />
            Add Selected ({selectedMembers.size})
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-textMuted">Total</p>
              <p className="text-xl font-bold text-primary">{districtData?.total_count || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-textMuted">Junior</p>
              <p className="text-xl font-bold text-blue-600">{summary?.junior_count || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-textMuted">Senior</p>
              <p className="text-xl font-bold text-purple-600">{summary?.senior_count || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gray-100 border-gray-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-textMuted">Ineligible</p>
              <p className="text-xl font-bold text-gray-500">{summary?.ineligible_count || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs text-textMuted">Selected</p>
              <p className="text-xl font-bold text-success">{selectedMembers.size}</p>
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
              value={filterUnit === 'all' ? 'all' : filterUnit}
              onChange={(e) => setFilterUnit(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[180px]"
            >
              <option value="all">All Units ({units.length})</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as 'all' | 'Junior' | 'Senior' | 'Ineligible')}
              className="px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[130px]"
            >
              <option value="all">All Categories</option>
              <option value="Junior">Junior ({summary?.junior_count || 0})</option>
              <option value="Senior">Senior ({summary?.senior_count || 0})</option>
              <option value="Ineligible">Ineligible ({summary?.ineligible_count || 0})</option>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">DOB</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Age</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderColor">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-textMuted font-medium">
                      {searchTerm || filterUnit !== 'all' || filterCategory !== 'all'
                        ? 'No members found matching your filters' 
                        : 'No members available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member: Member) => {
                  const isIneligible = member.participation_category === 'Ineligible';
                  const isDisabled = member.is_registered || member.is_excluded || isIneligible;
                  const isSelected = selectedMembers.has(member.id);
                  const selectedCategory = memberCategories[member.id] || member.participation_category;
                  
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
                      <td className="px-4 py-3 text-sm text-textMuted">#{member.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-textDark">{member.name}</span>
                          <Badge variant={member.gender === 'M' ? 'primary' : 'success'} className="text-xs">
                            {member.gender}
                          </Badge>
                          {member.is_excluded && <Badge variant="danger" className="text-xs">Excluded</Badge>}
                          {member.is_registered && <Badge variant="success" className="text-xs">Registered</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-textMuted" />
                          {member.phone_number || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-textMuted" />
                          {formatDate(member.dob)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark font-medium">{member.age} yrs</td>
                      <td className="px-4 py-3 text-sm text-textDark">{member.unit_name}</td>
                      <td className="px-4 py-3">
                        {isIneligible ? (
                          <Badge variant="light" className="text-xs">Ineligible</Badge>
                        ) : (
                          <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(member.id, e.target.value as 'Junior' | 'Senior')}
                            disabled={isDisabled}
                            className={`px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                              selectedCategory === 'Junior' 
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-purple-50 border-purple-200 text-purple-700'
                            }`}
                          >
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant={member.is_registered ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleAddParticipant(member.id)}
                          disabled={submitting || isDisabled}
                        >
                          {member.is_registered ? (
                            <><CheckCircle className="w-4 h-4 mr-1" />Added</>
                          ) : member.is_excluded ? (
                            <><XCircle className="w-4 h-4 mr-1" />Excluded</>
                          ) : isIneligible ? (
                            <><XCircle className="w-4 h-4 mr-1" />Ineligible</>
                          ) : (
                            <><Plus className="w-4 h-4 mr-1" />Add</>
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
        {filteredMembers.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-borderColor text-sm text-textMuted">
            Showing {filteredMembers.length} of {districtData?.total_count || 0} members
          </div>
        )}
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
