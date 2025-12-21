import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, CheckCircle, XCircle, Search, Users } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useEligibleGroupMembers, useAddGroupParticipants } from '../../hooks/queries';

interface Member {
  id: number;
  name: string;
  age: number;
  gender: string;
  unit_name: string;
  is_excluded: boolean;
  is_registered: boolean;
}

export const SelectGroupParticipants: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const parsedEventId = parseInt(eventId!);
  
  // Use TanStack Query
  const { data, isLoading: loading } = useEligibleGroupMembers(parsedEventId);
  const addGroupMutation = useAddGroupParticipants();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const toggleMember = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      if (data && selectedMembers.length >= data.max_allowed_limit) {
        addToast(`Maximum ${data.max_allowed_limit} participants allowed`, "warning");
        return;
      }
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSubmit = async () => {
    if (!data) return;

    if (selectedMembers.length < data.min_allowed_limit) {
      addToast(`Minimum ${data.min_allowed_limit} participants required`, "warning");
      return;
    }

    if (selectedMembers.length > data.max_allowed_limit) {
      addToast(`Maximum ${data.max_allowed_limit} participants allowed`, "warning");
      return;
    }

    addGroupMutation.mutate(
      {
        group_event_id: parsedEventId,
        participant_ids: selectedMembers,
      },
      {
        onSuccess: () => navigate('/kalamela/official/participants'),
      }
    );
  };

  const submitting = addGroupMutation.isPending;

  // Safely access eligible_members with fallback to empty array
  const eligibleMembers = data?.eligible_members || data?.members || [];

  const filteredMembers = eligibleMembers.filter((member: Member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.unit_name && member.unit_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableMembers = filteredMembers.filter((m: Member) => !m.is_registered && !m.is_excluded);

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

  const isValidTeam = selectedMembers.length >= data.min_allowed_limit && 
                      selectedMembers.length <= data.max_allowed_limit;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">{data.event_name}</h1>
          <p className="text-sm text-textMuted mt-1">{data.event_description}</p>
        </div>
      </div>

      {/* Selection Info */}
      <Card className={`${isValidTeam ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-textDark mb-2">Team Selection</h3>
            <p className="text-sm text-textMuted">
              Select between {data.min_allowed_limit} and {data.max_allowed_limit} participants
            </p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${isValidTeam ? 'text-success' : 'text-warning'}`}>
              {selectedMembers.length}
            </div>
            <p className="text-xs text-textMuted">Selected</p>
          </div>
        </div>
        
        {selectedMembers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-borderColor">
            <p className="text-sm font-medium text-textDark mb-2">Selected Members:</p>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((memberId) => {
                const member = eligibleMembers.find((m: Member) => m.id === memberId);
                return member ? (
                  <Badge key={memberId} variant="success" className="flex items-center gap-1">
                    {member.name}
                    <button
                      onClick={() => toggleMember(memberId)}
                      className="ml-1 hover:text-danger"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search by name or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      {/* Members List */}
      <Card>
        <h2 className="text-lg font-bold text-textDark mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-success" />
          Available Members ({availableMembers.length})
        </h2>
        
        {availableMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-textMuted">
              {searchTerm ? 'No members found matching your search' : 'No available members'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableMembers.map((member) => {
              const isSelected = selectedMembers.includes(member.id);
              
              return (
                <div
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-success/10 border-2 border-success'
                      : 'bg-bgLight hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-primary focus:ring-primary rounded"
                      />
                      <p className="font-semibold text-textDark">{member.name}</p>
                      <Badge variant={member.gender === 'M' ? 'primary' : 'success'}>
                        {member.gender === 'M' ? 'Male' : 'Female'}
                      </Badge>
                      <Badge variant="light">{member.age} years</Badge>
                    </div>
                    <p className="text-sm text-textMuted mt-1 ml-7">{member.unit_name}</p>
                  </div>
                  
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate('/kalamela/official')}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-textMuted">
            {selectedMembers.length} / {data.max_allowed_limit} selected
          </span>
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={!isValidTeam || submitting}
          >
            {submitting ? 'Adding Team...' : 'Add Team'}
          </Button>
        </div>
      </div>
    </div>
  );
};


