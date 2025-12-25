import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { 
  Plus, Edit2, Eye, Calendar, Users, Trophy, 
  CheckCircle2, Clock, BarChart3, Award, Search,
  ChevronRight, Sparkles
} from 'lucide-react';
import { useIndividualEvents, useGroupEvents } from '../../../hooks/queries';
import { api } from '../../../services/api';
import { useQuery } from '@tanstack/react-query';

type TabType = 'individual' | 'group';

export const ViewScores: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Filter events by search
  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    return events.filter((event: any) => 
      event.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const eventsWithScores = filteredEvents.filter((event: any) => scores[event.name]);
  const eventsWithoutScores = filteredEvents.filter((event: any) => !scores[event.name]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const scoredEvents = events.filter((e: any) => scores[e.name]).length;
    const pendingEvents = totalEvents - scoredEvents;
    const progressPercent = totalEvents > 0 ? Math.round((scoredEvents / totalEvents) * 100) : 0;
    
    // Count total participants/teams scored
    let totalScored = 0;
    Object.values(scores).forEach((eventScores: any) => {
      if (Array.isArray(eventScores)) totalScored += eventScores.length;
    });
    
    return { totalEvents, scoredEvents, pendingEvents, progressPercent, totalScored };
  }, [events, scores]);

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-72 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg shadow-primary/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            Score Management
          </h1>
          <p className="mt-2 text-sm text-textMuted">
            Add and manage event scores with automatic grade calculation
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/15 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{stats.totalEvents}</p>
              <p className="text-xs text-textMuted">Total Events</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/15 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{stats.scoredEvents}</p>
              <p className="text-xs text-textMuted">Scored</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/15 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{stats.pendingEvents}</p>
              <p className="text-xs text-textMuted">Pending</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/15 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{stats.totalScored}</p>
              <p className="text-xs text-textMuted">Entries Scored</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-gradient-to-r from-bgLight to-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-textDark">Scoring Progress</span>
          </div>
          <span className="text-sm font-bold text-primary">{stats.progressPercent}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500 ease-out"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-textMuted mt-2">
          {stats.scoredEvents} of {stats.totalEvents} {activeTab} events have been scored
        </p>
      </Card>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex bg-bgLight p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'individual'
                ? 'bg-white text-primary shadow-md'
                : 'text-textMuted hover:text-textDark'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Individual
            <Badge variant={activeTab === 'individual' ? 'primary' : 'light'} className="ml-1">
              {individualEvents.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'group'
                ? 'bg-white text-success shadow-md'
                : 'text-textMuted hover:text-textDark'
            }`}
          >
            <Users className="w-4 h-4" />
            Group
            <Badge variant={activeTab === 'group' ? 'success' : 'light'} className="ml-1">
              {groupEvents.length}
            </Badge>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-borderColor rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Events Pending Score Entry */}
      {eventsWithoutScores.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-bold text-textDark">Pending Score Entry</h2>
            <Badge variant="warning">{eventsWithoutScores.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsWithoutScores.map((event: any) => (
              <Card 
                key={event.id} 
                className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent cursor-pointer"
                onClick={() => navigate(`/kalamela/admin/scores/${activeTab}/${event.id}/add`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-textDark group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    {event.description && (
                      <p className="text-xs text-textMuted mt-1 line-clamp-1">{event.description}</p>
                    )}
                  </div>
                  <Badge variant="warning" className="flex-shrink-0">Pending</Badge>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-borderColor/50">
                  <span className="text-xs text-textMuted">
                    {activeTab === 'individual' ? 'Individual Event' : 'Group Event'}
                  </span>
                  <Button
                    variant="success"
                    size="sm"
                    className="group-hover:shadow-md transition-shadow"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Scores
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Events With Scores */}
      {eventsWithScores.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h2 className="text-lg font-bold text-textDark">Scored Events</h2>
            <Badge variant="success">{eventsWithScores.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsWithScores.map((event: any) => {
              const eventScores = scores[event.name] || [];
              const topScorer = eventScores[0]; // Assuming sorted by rank
              return (
                <Card 
                  key={event.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-success"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-textDark">{event.name}</h3>
                    <Badge variant="success" className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Scored
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-textMuted mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {eventScores.length} {activeTab === 'individual' ? 'participant' : 'team'}
                      {eventScores.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Mini leaderboard preview */}
                  {topScorer && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-2 mb-4 border border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-textDark truncate">
                            {topScorer.participant_name || topScorer.unit_name || 'Top Scorer'}
                          </p>
                          <p className="text-xs text-amber-600">
                            {topScorer.awarded_mark || topScorer.marks || 0} marks
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/kalamela/admin/scores/${activeTab}/${event.id}/view`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/kalamela/admin/scores/${activeTab}/${event.id}/edit`)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <Card className="text-center py-16 bg-gradient-to-b from-bgLight to-white">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {searchTerm ? (
              <Search className="w-8 h-8 text-gray-400" />
            ) : (
              <Trophy className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-textDark mb-2">
            {searchTerm ? 'No events found' : `No ${activeTab} events`}
          </h3>
          <p className="text-textMuted mb-6">
            {searchTerm 
              ? `No events match "${searchTerm}"`
              : 'Events will appear here once they are created'
            }
          </p>
          {searchTerm ? (
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          ) : (
            <Button variant="primary" onClick={() => navigate('/kalamela/admin/events')}>
              Manage Events
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
