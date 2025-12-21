import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Trash2, Users, User, Phone, Calendar, MapPin } from 'lucide-react';
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
      return response.data.group_event_participations || {};
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
    (acc: number, participants: any) => acc + (participants?.length || 0), 0
  );
  const totalGroupParticipants = Object.values(groupEvents).reduce(
    (acc: number, participants: any) => acc + (participants?.length || 0), 0
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
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
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
          <Button variant="primary" size="sm" onClick={() => navigate('/kalamela/official')}>
            Register Participants
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {eventNames.map((eventName) => {
            const participants = events[eventName];
            
            return (
              <Card key={eventName}>
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-borderColor">
                  <div>
                    <h3 className="text-lg font-bold text-textDark">{eventName}</h3>
                    <p className="text-sm text-textMuted">
                      {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant={activeTab === 'individual' ? 'primary' : 'success'}>
                    {activeTab === 'individual' ? 'Individual' : 'Group'}
                  </Badge>
                </div>

                {/* Enhanced participant cards */}
                <div className="space-y-3">
                  {participants.map((participant: any) => (
                    <div
                      key={participant.participation_id || participant.id}
                      className="flex items-start justify-between p-4 bg-bgLight rounded-lg border border-borderColor hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        {activeTab === 'individual' ? (
                          <div className="space-y-2">
                            {/* Name and badges row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-textDark text-base">{participant.participant_name}</p>
                              <Badge variant="light" className="font-mono text-xs">{participant.chest_number}</Badge>
                              {participant.seniority_category && participant.seniority_category !== 'NA' && (
                                <Badge 
                                  variant={participant.seniority_category === 'Junior' ? 'primary' : 'success'}
                                  className="text-xs"
                                >
                                  {participant.seniority_category}
                                </Badge>
                              )}
                              {participant.gender && (
                                <Badge variant="light" className="text-xs">
                                  {participant.gender === 'M' ? 'Male' : participant.gender === 'F' ? 'Female' : participant.gender}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Details row */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-textMuted">
                              {/* Unit Name */}
                              {participant.unit_name && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{participant.unit_name}</span>
                                </div>
                              )}
                              
                              {/* Contact Number */}
                              {participant.phone_number && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{participant.phone_number}</span>
                                </div>
                              )}
                              
                              {/* Age */}
                              {participant.age && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{participant.age} years</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-textDark">Team {participant.participation_id}</p>
                              <Badge variant="light" className="font-mono text-xs">{participant.chest_number}</Badge>
                              <Badge variant="success" className="text-xs">{participant.members?.length || 0} members</Badge>
                            </div>
                            {participant.members && participant.members.length > 0 && (
                              <div className="bg-white rounded-md border border-borderColor overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-textMuted">Name</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-textMuted">Contact</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-textMuted">Unit</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-borderColor">
                                    {participant.members.map((member: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium text-textDark">{member.name}</td>
                                        <td className="px-3 py-2 text-textMuted">
                                          {member.phone_number || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-textMuted">
                                          {member.unit_name || participant.unit_name || '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
                            id: participant.participation_id || participant.id,
                            eventId: participant.event_id || 0,
                            eventType: activeTab,
                            name: participant.participant_name || `Team ${participant.participation_id}`,
                          });
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
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
