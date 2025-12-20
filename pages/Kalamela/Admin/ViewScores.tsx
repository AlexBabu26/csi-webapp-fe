import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { Plus, Edit2, Eye, Calendar, Users } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { useIndividualEvents, useGroupEvents } from '../../../hooks/queries';
import { api } from '../../../services/api';
import { useQuery } from '@tanstack/react-query';

type TabType = 'individual' | 'group';

export const ViewScores: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  
  // Use TanStack Query for events
  const { data: individualEventsData, isLoading: loadingIndividual } = useIndividualEvents();
  const { data: groupEventsData, isLoading: loadingGroup } = useGroupEvents();
  
  // Scores queries
  const { data: individualScoresData, isLoading: loadingIndScores } = useQuery({
    queryKey: ['kalamela', 'scores', 'individual', 'all'],
    queryFn: async () => {
      const response = await api.getAdminIndividualScores();
      return response.data.individual_event_scores || {};
    },
  });
  
  const { data: groupScoresData, isLoading: loadingGroupScores } = useQuery({
    queryKey: ['kalamela', 'scores', 'group', 'all'],
    queryFn: async () => {
      const response = await api.getAdminGroupScores();
      return response.data.group_event_scores || {};
    },
  });
  
  const loading = loadingIndividual || loadingGroup || loadingIndScores || loadingGroupScores;
  
  const individualEvents = individualEventsData ?? [];
  const groupEvents = groupEventsData ?? [];
  const individualScores = individualScoresData ?? {};
  const groupScores = groupScoresData ?? {};
  
  const events = activeTab === 'individual' ? individualEvents : groupEvents;
  const scores = activeTab === 'individual' ? individualScores : groupScores;

  const eventsWithScores = events.filter((event: any) => scores[event.name]);
  const eventsWithoutScores = events.filter((event: any) => !scores[event.name]);

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Score Management
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            Add and manage event scores with automatic grade calculation
          </p>
        </div>
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
          <Calendar className="w-4 h-4 inline mr-2" />
          Individual ({events.length} events)
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
          Group ({groupEvents.length} events)
        </button>
      </Card>

      {/* Events With Scores */}
      {eventsWithScores.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-textDark mb-3">Events with Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsWithScores.map((event) => {
              const eventScores = scores[event.name] || [];
              return (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-textDark">{event.name}</h3>
                    <Badge variant="success">Scored</Badge>
                  </div>
                  <p className="text-sm text-textMuted mb-4">
                    {eventScores.length} {activeTab === 'individual' ? 'participant' : 'team'}
                    {eventScores.length !== 1 ? 's' : ''} scored
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/kalamela/admin/scores/${activeTab}/${event.id}/view`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/kalamela/admin/scores/${activeTab}/${event.id}/edit`)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Events Without Scores */}
      {eventsWithoutScores.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-textDark mb-3">Events Pending Score Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsWithoutScores.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow border-warning/30">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-textDark">{event.name}</h3>
                  <Badge variant="warning">Pending</Badge>
                </div>
                <p className="text-sm text-textMuted mb-4 line-clamp-2">{event.description}</p>
                
                <Button
                  variant="success"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/kalamela/admin/scores/${activeTab}/${event.id}/add`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scores
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-textMuted mb-4">No {activeTab} events found</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/kalamela/admin/events')}>
            Manage Events
          </Button>
        </Card>
      )}
    </div>
  );
};


