import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Plus, CheckCircle, XCircle, Search, Users, Phone, User, Filter, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useDistrictMembers, useAddGroupParticipants, useEligibleGroupMembers } from '../../hooks/queries';

interface Member {
  id: number;
  name: string;
  phone_number?: string;
  dob?: string;
  age: number;
  gender: string;
  unit_id?: number;
  unit_name?: string;
  participation_category: 'Junior' | 'Senior' | 'Ineligible';
  is_excluded?: boolean;
  is_eligible?: boolean;
  is_already_registered?: boolean;
  ineligibility_reasons?: string[];
}

export const SelectGroupParticipants: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const parsedEventId = parseInt(eventId!);
  
  // Fetch district members with event-based pre-filtering
  const { data: districtData, isLoading: loadingMembers, refetch } = useDistrictMembers({
    event_id: parsedEventId,
    event_type: 'group',
  });
  
  // Fetch event details to get min/max limits
  const { data: eventData, isLoading: loadingEvent } = useEligibleGroupMembers(parsedEventId);
  
  const addGroupMutation = useAddGroupParticipants();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [filterUnit, setFilterUnit] = useState<number | 'all'>('all');
  const [showOnlyEligible, setShowOnlyEligible] = useState(true);

  const loading = loadingMembers || loadingEvent;

  // Get event context from API response
  const eventContext = districtData?.event_context;
  
  // Get units from API response
  const units = districtData?.units || [];
  
  // Get summary from API response
  const summary = districtData?.summary;

  // Get min/max limits from event data or event context or use defaults
  const minLimit = eventData?.min_allowed_limit || (eventContext as any)?.min_allowed_limit || 1;
  const maxLimit = eventData?.max_allowed_limit || (eventContext as any)?.max_allowed_limit || 10;

  // Client-side filtering (search and unit filter)
  const filteredMembers = useMemo(() => {
    if (!districtData?.members) return [];
    return districtData.members.filter((member: Member) => {
      const matchesSearch = !searchTerm || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.unit_name && member.unit_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.phone_number && member.phone_number.includes(searchTerm));
      
      const matchesUnit = filterUnit === 'all' || member.unit_id === filterUnit;
      
      // Filter by eligibility if toggle is on
      const matchesEligibility = !showOnlyEligible || member.is_eligible;
      
      return matchesSearch && matchesUnit && matchesEligibility;
    });
  }, [districtData, searchTerm, filterUnit, showOnlyEligible]);

  const handleSelectMember = (memberId: number) => {
    const member = districtData?.members.find((m: Member) => m.id === memberId);
    if (!member?.is_eligible || member?.is_already_registered) return;
    
    // Check max limit
    if (!selectedMembers.has(memberId) && selectedMembers.size >= maxLimit) {
      addToast(`Maximum ${maxLimit} participants allowed`, "warning");
      return;
    }
    
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
      .filter((m: Member) => m.is_eligible && !m.is_already_registered)
      .map((m: Member) => m.id)
      .slice(0, maxLimit); // Limit to max allowed
    
    if (selectedMembers.size === eligibleIds.length && eligibleIds.length > 0) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(eligibleIds));
    }
  };

  const handleBulkAdd = async () => {
    if (selectedMembers.size === 0) {
      addToast("Please select at least one member", "warning");
      return;
    }

    if (selectedMembers.size < minLimit) {
      addToast(`Minimum ${minLimit} participants required`, "warning");
      return;
    }

    if (selectedMembers.size > maxLimit) {
      addToast(`Maximum ${maxLimit} participants allowed`, "warning");
      return;
    }

    addGroupMutation.mutate(
      {
        group_event_id: parsedEventId,
        participant_ids: Array.from(selectedMembers),
      },
      {
        onSuccess: () => {
          refetch();
          setSelectedMembers(new Set());
          navigate('/kalamela/official/participants');
        },
      }
    );
  };

  const submitting = addGroupMutation.isPending;

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

  const eligibleCount = filteredMembers.filter((m: Member) => m.is_eligible && !m.is_already_registered).length;
  const isValidTeam = selectedMembers.size >= minLimit && selectedMembers.size <= maxLimit;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">{eventContext?.name || eventData?.event_name || 'Select Participants'}</h1>
          <p className="text-sm text-textMuted mt-1">{eventData?.event_description || 'Choose team members from your district'}</p>
        </div>
        {selectedMembers.size > 0 && (
          <Button variant="primary" onClick={handleBulkAdd} disabled={submitting}>
            <Plus className="w-4 h-4 mr-2" />
            Add Selected ({selectedMembers.size})
          </Button>
        )}
      </div>

      {/* Event Context Info */}
      {eventContext && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 text-sm mb-1">Event Requirements</h3>
              <div className="flex flex-wrap gap-3 text-xs text-blue-700">
                {eventContext.gender_restriction && (
                  <span className="bg-blue-100 px-2 py-1 rounded">
                    Gender: <strong>{eventContext.gender_restriction}</strong>
                  </span>
                )}
                {eventContext.seniority_restriction && (
                  <span className="bg-blue-100 px-2 py-1 rounded">
                    Category: <strong>{eventContext.seniority_restriction}</strong>
                  </span>
                )}
                <span className="bg-blue-100 px-2 py-1 rounded">
                  Team Size: <strong>{minLimit} - {maxLimit} members</strong>
                </span>
                {eventContext.already_registered_count !== undefined && (
                  <span className="bg-blue-100 px-2 py-1 rounded">
                    Already Registered: <strong>{eventContext.already_registered_count}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

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
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-textMuted">Eligible</p>
              <p className="text-xl font-bold text-green-600">{summary?.eligible_count || 0}</p>
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
        <Card className={`${isValidTeam ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
          <div className="flex items-center gap-3">
            <CheckCircle className={`w-5 h-5 ${isValidTeam ? 'text-success' : 'text-warning'}`} />
            <div>
              <p className="text-xs text-textMuted">Selected</p>
              <p className={`text-xl font-bold ${isValidTeam ? 'text-success' : 'text-warning'}`}>
                {selectedMembers.size}
              </p>
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyEligible}
              onChange={(e) => setShowOnlyEligible(e.target.checked)}
              className="w-4 h-4 text-primary border-borderColor rounded focus:ring-primary"
            />
            <span className="text-sm text-textDark">Show only eligible</span>
          </label>
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
                    checked={selectedMembers.size > 0 && selectedMembers.size === eligibleCount && eligibleCount > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary border-borderColor rounded focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Age</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">Action</th>
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
                        : showOnlyEligible 
                          ? 'No eligible members found for this event'
                          : 'No members available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member: Member) => {
                  const isEligible = member.is_eligible;
                  const isAlreadyRegistered = member.is_already_registered;
                  const isDisabled = !isEligible || isAlreadyRegistered;
                  const isSelected = selectedMembers.has(member.id);
                  
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
                            {member.gender === 'M' ? 'Male' : 'Female'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark">
                        {member.phone_number ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-textMuted" />
                            {member.phone_number}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-textDark font-medium">{member.age} yrs</td>
                      <td className="px-4 py-3 text-sm text-textDark">{member.unit_name || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={
                            member.participation_category === 'Junior' 
                              ? 'primary' 
                              : member.participation_category === 'Senior' 
                                ? 'success' 
                                : 'light'
                          }
                          className="text-xs"
                        >
                          {member.participation_category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {isAlreadyRegistered ? (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Registered
                          </Badge>
                        ) : isEligible ? (
                          <Badge variant="primary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Eligible
                          </Badge>
                        ) : (
                          <div className="group relative">
                            <Badge variant="danger" className="text-xs cursor-help">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Ineligible
                            </Badge>
                            {member.ineligibility_reasons && member.ineligibility_reasons.length > 0 && (
                              <div className="absolute z-10 hidden group-hover:block bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                {member.ineligibility_reasons.map((reason, idx) => (
                                  <div key={idx}>• {reason}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant={isAlreadyRegistered ? 'outline' : isEligible ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            if (isDisabled) return;
                            handleSelectMember(member.id);
                          }}
                          disabled={submitting || isDisabled}
                        >
                          {isAlreadyRegistered ? (
                            <><CheckCircle className="w-4 h-4 mr-1" />Added</>
                          ) : isEligible ? (
                            <><Plus className="w-4 h-4 mr-1" />Select</>
                          ) : (
                            <><XCircle className="w-4 h-4 mr-1" />N/A</>
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
            {showOnlyEligible && ` (${summary?.eligible_count || 0} eligible)`}
            {selectedMembers.size > 0 && (
              <span className="ml-2">
                • Selected: {selectedMembers.size} / {maxLimit} (min: {minLimit})
              </span>
            )}
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
            <Button variant="primary" onClick={handleBulkAdd} disabled={submitting || !isValidTeam}>
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


