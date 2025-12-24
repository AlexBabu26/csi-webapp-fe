import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Trash2, Users, User, Phone, MapPin } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRemoveParticipant } from '../../hooks/queries';

type TabType = 'individual' | 'group';

export const ViewParticipants: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState<{ 
    id: number; 
    eventId: number;
    eventType: 'individual' | 'group';
    name: string;
  } | null>(null);
  
  // Use TanStack Query
  const { data: individualData, isLoading: loadingIndividual } = useQuery({
    queryKey: ['kalamela', 'participants', 'individual', 'official'],
    queryFn: async () => {
      const response = await api.getOfficialIndividualParticipants();
      return response.data.individual_event_participations || {};
    },
  });
  
  const { data: groupData, isLoading: loadingGroup } = useQuery({
    queryKey: ['kalamela', 'participants', 'group', 'official'],
    queryFn: async () => {
      const response = await api.getOfficialGroupParticipants();
      const rawData = response.data.group_event_participations || {};
      
      // Transform the nested structure: event -> unit -> participants
      // Into: event -> teams (grouped by chest_number)
      const transformed: Record<string, any[]> = {};
      
      Object.keys(rawData).forEach((eventName) => {
        const eventData = rawData[eventName];
        const allParticipants: any[] = [];
        
        // Flatten all units into a single array
        Object.keys(eventData).forEach((unitName) => {
          const unitParticipants = eventData[unitName];
          if (Array.isArray(unitParticipants)) {
            allParticipants.push(...unitParticipants);
          }
        });
        
        // Group participants by chest_number to form teams
        const teamsMap = new Map<string, any>();
        
        allParticipants.forEach((participant) => {
          const chestNumber = participant.participant_chest_number || participant.chest_number || 'UNKNOWN';
          
          if (!teamsMap.has(chestNumber)) {
            // Use the first participant's participation_id as the team ID
            teamsMap.set(chestNumber, {
              group_event_participation_id: participant.group_event_participation_id,
              group_event_id: participant.group_event_id,
              chest_number: chestNumber,
              group_chest_number: chestNumber,
              members: [],
              unit_name: participant.participant_unit,
              participant_unit: participant.participant_unit,
            });
          }
          
          const team = teamsMap.get(chestNumber)!;
          team.members.push({
            name: participant.participant_name,
            participant_name: participant.participant_name,
            phone_number: participant.participant_phone,
            participant_phone: participant.participant_phone,
            unit_name: participant.participant_unit,
            participant_unit: participant.participant_unit,
          });
        });
        
        // Convert map to array
        transformed[eventName] = Array.from(teamsMap.values());
      });
      
      return transformed;
    },
  });
  
  const removeMutation = useRemoveParticipant();
  
  const loading = activeTab === 'individual' ? loadingIndividual : loadingGroup;

  const handleRemove = async () => {
    if (!selectedParticipation) return;

    removeMutation.mutate(
      { 
        participantId: selectedParticipation.id, 
        eventId: selectedParticipation.eventId,
        eventType: selectedParticipation.eventType,
      },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setSelectedParticipation(null);
          // Invalidate the specific query
          queryClient.invalidateQueries({ 
            queryKey: ['kalamela', 'participants', activeTab, 'official'] 
          });
        },
      }
    );
  };

  const individualEvents = individualData || {};
  const groupEvents = groupData || {};
  const events = activeTab === 'individual' ? individualEvents : groupEvents;
  const eventNames = Object.keys(events);

  // Count total participants
  const totalIndividualParticipants = Object.values(individualEvents).reduce(
    (acc: number, participants: any) => acc + (Array.isArray(participants) ? participants.length : 0), 0
  );
  const totalGroupParticipants = Object.values(groupEvents).reduce(
    (acc: number, teams: any) => {
      if (!Array.isArray(teams)) return acc;
      // Count number of teams
      return acc + teams.length;
    }, 0
  );
  // Count total individual members across all teams
  const totalGroupMembers = Object.values(groupEvents).reduce(
    (acc: number, teams: any) => {
      if (!Array.isArray(teams)) return acc;
      return acc + teams.reduce((teamAcc: number, team: any) => {
        return teamAcc + (Array.isArray(team.members) ? team.members.length : 0);
      }, 0);
    }, 0
  );

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

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">Registered Participants</h1>
          <p className="text-sm text-textMuted mt-1">View and manage your event registrations</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/kalamela/official/preview')}>
          Preview & Payment
        </Button>
      </div>

      {/* Tabs */}
      <Card className="p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'individual'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          <User className="w-4 h-4" />
          Individual ({Object.keys(individualEvents).length} events)
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'group'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          <Users className="w-4 h-4" />
          Group ({Object.keys(groupEvents).length} events)
        </button>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <p className="text-xs text-textMuted">Individual Events</p>
          <p className="text-2xl font-bold text-primary">{Object.keys(individualEvents).length}</p>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <p className="text-xs text-textMuted">Individual Participants</p>
          <p className="text-2xl font-bold text-blue-600">{totalIndividualParticipants}</p>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <p className="text-xs text-textMuted">Group Events</p>
          <p className="text-2xl font-bold text-purple-600">{Object.keys(groupEvents).length}</p>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <p className="text-xs text-textMuted">Group Teams</p>
          <p className="text-2xl font-bold text-green-600">{totalGroupParticipants}</p>
        </Card>
      </div>

      {/* Events List */}
      {eventNames.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'individual' ? (
              <User className="w-8 h-8 text-gray-400" />
            ) : (
              <Users className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <p className="text-textMuted mb-4">No {activeTab} event participants registered yet</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/kalamela/official/home')}>
            Register Participants
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {eventNames.map((eventName) => {
            const participants = Array.isArray(events[eventName]) ? events[eventName] : [];
            
            return (
              <Card key={eventName}>
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-borderColor">
                  <div>
                    <h3 className="text-lg font-bold text-textDark">{eventName}</h3>
                    <p className="text-sm text-textMuted">
                      {activeTab === 'individual' 
                        ? `${participants.length} participant${participants.length !== 1 ? 's' : ''}`
                        : `${participants.length} team${participants.length !== 1 ? 's' : ''} (${participants.reduce((acc: number, team: any) => acc + (Array.isArray(team.members) ? team.members.length : 0), 0)} members)`
                      }
                    </p>
                  </div>
                  <Badge variant={activeTab === 'individual' ? 'primary' : 'success'}>
                    {activeTab === 'individual' ? 'Individual' : 'Group'}
                  </Badge>
                </div>

                {/* Enhanced participant cards */}
                <div className="space-y-3">
                  {participants.length === 0 ? (
                    <p className="text-textMuted text-sm py-4 text-center">No participants registered for this event</p>
                  ) : (
                    participants.map((participant: any) => {
                    // Get the correct ID based on event type
                    const participationId = activeTab === 'individual' 
                      ? participant.individual_event_participation_id 
                      : participant.group_event_participation_id || participant.participation_id;
                    const eventId = activeTab === 'individual'
                      ? participant.individual_event_id
                      : participant.group_event_id || participant.event_id;
                    
                    return (
                      <div
                        key={participationId}
                        className="flex items-start justify-between p-4 bg-bgLight rounded-lg border border-borderColor hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          {activeTab === 'individual' ? (
                            <div className="space-y-2">
                              {/* Name and badges row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-textDark text-base">{participant.participant_name}</p>
                                <Badge variant="light" className="font-mono text-xs">{participant.participant_chest_number}</Badge>
                                {participant.seniority_category && participant.seniority_category !== 'NA' && (
                                  <Badge 
                                    variant={participant.seniority_category === 'Junior' ? 'primary' : 'success'}
                                    className="text-xs"
                                  >
                                    {participant.seniority_category}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Details row */}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-textMuted">
                                {/* Unit Name */}
                                {participant.participant_unit && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{participant.participant_unit}</span>
                                  </div>
                                )}
                                
                                {/* District */}
                                {participant.participant_district && participant.participant_district !== participant.participant_unit && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-purple-500" />
                                    <span>{participant.participant_district}</span>
                                  </div>
                                )}
                                
                                {/* Contact Number */}
                                {participant.participant_phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{participant.participant_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Team Header with Unit Name */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {participant.chest_number || participant.group_chest_number || 'T'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-textDark">{participant.unit_name || participant.participant_unit || 'Team'}</p>
                                      <Badge variant="success" className="text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {participant.members?.length || 0} members
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-textMuted">
                                      Chest No: <span className="font-mono font-medium">{participant.chest_number || participant.group_chest_number}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Members Grid */}
                              {participant.members && participant.members.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                                  {participant.members.map((member: any, idx: number) => (
                                    <div 
                                      key={idx} 
                                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-borderColor hover:border-primary/30 hover:shadow-sm transition-all"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700 flex-shrink-0">
                                        {(member.name || member.participant_name || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-textDark truncate">
                                          {member.name || member.participant_name}
                                        </p>
                                        {(member.phone_number || member.participant_phone) && (
                                          <p className="text-xs text-textMuted flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {member.phone_number || member.participant_phone}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="danger"
                          size="sm"
                          className="ml-4 flex-shrink-0"
                          onClick={() => {
                            setSelectedParticipation({ 
                              id: participationId,
                              eventId: eventId || 0,
                              eventType: activeTab,
                              name: participant.participant_name || `Team ${participationId}`,
                            });
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedParticipation(null);
        }}
        onConfirm={handleRemove}
        title="Remove Participant"
        message={`Are you sure you want to remove "${selectedParticipation?.name}" from this event? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
      />
    </div>
  );
};
