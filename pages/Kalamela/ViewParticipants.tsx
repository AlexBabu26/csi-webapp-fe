import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Trash2, Users, User } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';

type TabType = 'individual' | 'group';

export const ViewParticipants: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState<number | null>(null);
  const [data, setData] = useState<{
    individual_event_participations: Record<string, any[]>;
    group_event_participations: Record<string, any[]>;
  } | null>(null);

  useEffect(() => {
    loadParticipants();
  }, [activeTab]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      if (activeTab === 'individual') {
        const response = await api.getOfficialIndividualParticipants();
        setData({ ...data, individual_event_participations: response.data.individual_event_participations || {} });
      } else {
        const response = await api.getOfficialGroupParticipants();
        setData({ ...data, group_event_participations: response.data.group_event_participations || {} });
      }
    } catch (err) {
      addToast("Failed to load participants", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedParticipation) return;

    try {
      if (activeTab === 'individual') {
        await api.removeIndividualParticipant(selectedParticipation);
      } else {
        await api.removeGroupParticipant(selectedParticipation);
      }
      addToast("Participant removed successfully", "success");
      setShowDeleteDialog(false);
      setSelectedParticipation(null);
      loadParticipants();
    } catch (err: any) {
      addToast(err.message || "Failed to remove participant", "error");
    }
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

  const individualEvents = data?.individual_event_participations || {};
  const groupEvents = data?.group_event_participations || {};
  const events = activeTab === 'individual' ? individualEvents : groupEvents;
  const eventNames = Object.keys(events);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
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
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'individual'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Individual ({Object.keys(individualEvents).length} events)
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'group'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Group ({Object.keys(groupEvents).length} events)
        </button>
      </Card>

      {/* Events List */}
      {eventNames.length === 0 ? (
        <Card className="text-center py-12">
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-textDark">{eventName}</h3>
                    <p className="text-sm text-textMuted">
                      {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="success">
                    {activeTab === 'individual' ? 'Individual' : 'Group'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {participants.map((participant: any) => (
                    <div
                      key={participant.participation_id || participant.id}
                      className="flex items-center justify-between p-3 bg-bgLight rounded-lg"
                    >
                      <div className="flex-1">
                        {activeTab === 'individual' ? (
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-textDark">{participant.participant_name}</p>
                              <Badge variant="light">{participant.chest_number}</Badge>
                              {participant.seniority_category && participant.seniority_category !== 'NA' && (
                                <Badge variant="primary">{participant.seniority_category}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-textMuted mt-1">{participant.unit_name}</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-textDark">Team {participant.participation_id}</p>
                              <Badge variant="light">{participant.chest_number}</Badge>
                              <Badge variant="success">{participant.members?.length || 0} members</Badge>
                            </div>
                            {participant.members && (
                              <div className="flex flex-wrap gap-2 ml-4">
                                {participant.members.map((member: any, idx: number) => (
                                  <span key={idx} className="text-sm text-textMuted">
                                    {member.name}{idx < participant.members.length - 1 ? ',' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedParticipation(participant.participation_id || participant.id);
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
        message="Are you sure you want to remove this participant? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
      />
    </div>
  );
};


