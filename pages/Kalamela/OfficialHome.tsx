import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { Calendar, Users, CreditCard, FileText, CheckCircle, ArrowRight, Info } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { IndividualEvent, GroupEvent } from '../../types';
import { useKalamelaOfficialHome } from '../../hooks/queries';

// Helper type for the API response structure
interface IndividualEventItem {
  event: IndividualEvent & { category_name: string };
  participation_count: number;
  remaining_slots: number;
}

export const KalamelaOfficialHome: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: responseData, isLoading: loading } = useKalamelaOfficialHome();
  const data = responseData || null;

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Transform individual_events from grouped object to flat array
  const individualEvents: Array<IndividualEvent & { participation_count: number; remaining_slots: number }> = [];
  if (data.individual_events && typeof data.individual_events === 'object') {
    Object.values(data.individual_events).forEach((categoryEvents: any) => {
      if (Array.isArray(categoryEvents)) {
        categoryEvents.forEach((item: IndividualEventItem) => {
          individualEvents.push({
            ...item.event,
            participation_count: item.participation_count,
            remaining_slots: item.remaining_slots,
          });
        });
      }
    });
  }

  // Transform group_events from object to array
  const groupEvents: GroupEvent[] = [];
  if (data.group_events && typeof data.group_events === 'object') {
    Object.values(data.group_events).forEach((event: any) => {
      if (event && event.id) {
        groupEvents.push(event as GroupEvent);
      }
    });
  }

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Kalamela Registration
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            Register participants for individual and group events
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official/participants')}>
            <FileText className="w-4 h-4 mr-2" />
            View Participants
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/kalamela/official/preview')}>
            <CreditCard className="w-4 h-4 mr-2" />
            Payment
          </Button>
        </div>
      </div>

      {/* Stats & Instructions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards - Takes 2 columns */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted">Individual Events</p>
                <p className="text-3xl font-bold text-primary">{individualEvents.length}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/20">
                <Users className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted">Group Events</p>
                <p className="text-3xl font-bold text-success">{groupEvents.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Tips - Takes 1 column */}
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 text-sm mb-1">Quick Tips</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Click on any event card to register</li>
                <li>• Check remaining slots before selecting</li>
                <li>• Review all entries before payment</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Individual Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-textDark flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Individual Events
          </h2>
          <span className="text-sm text-textMuted">{individualEvents.length} event(s)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {individualEvents.map((event, index: number) => (
            <Card 
              key={event.id} 
              className="group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => navigate(`/kalamela/official/event/individual/${event.id}`)}
            >
              {/* Category Badge */}
              {event.category_name && (
                <div className="absolute top-3 right-3">
                  <Badge variant="primary" className="text-xs">{event.category_name}</Badge>
                </div>
              )}
              
              {/* Event Number */}
              <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{index + 1}</span>
              </div>
              
              <div className="pt-8">
                <h3 className="font-bold text-textDark text-lg mb-2 group-hover:text-primary transition-colors">
                  {event.name}
                </h3>
                <p className="text-sm text-textMuted mb-4 line-clamp-2">
                  {event.description || 'No description available'}
                </p>
                
                {/* Slots Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-sm font-medium ${event.remaining_slots > 0 ? 'text-success' : 'text-danger'}`}>
                    {event.remaining_slots > 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {event.remaining_slots} slot{event.remaining_slots !== 1 ? 's' : ''} left
                      </span>
                    ) : (
                      <span>No slots available</span>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="w-full group-hover:bg-primary-hover"
                  disabled={event.remaining_slots === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/kalamela/official/event/individual/${event.id}`);
                  }}
                >
                  Select Participants
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
          {individualEvents.length === 0 && (
            <Card className="col-span-full text-center py-12 bg-gray-50">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-textMuted font-medium">No individual events available yet</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for updates</p>
            </Card>
          )}
        </div>
      </div>

      {/* Group Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-textDark flex items-center gap-2">
            <Users className="w-5 h-5 text-success" />
            Group Events
          </h2>
          <span className="text-sm text-textMuted">{groupEvents.length} event(s)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groupEvents.map((event: GroupEvent, index: number) => (
            <Card 
              key={event.id} 
              className="group hover:shadow-lg hover:border-success/30 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => navigate(`/kalamela/official/event/group/${event.id}`)}
            >
              {/* Event Number */}
              <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-xs font-bold text-success">{index + 1}</span>
              </div>
              
              <div className="pt-8">
                <h3 className="font-bold text-textDark text-lg mb-2 group-hover:text-success transition-colors">
                  {event.name}
                </h3>
                <p className="text-sm text-textMuted mb-4 line-clamp-2">
                  {event.description || 'No description available'}
                </p>
                
                {/* Team Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-textMuted">Team Size</span>
                    <span className="font-medium text-textDark">
                      {event.min_allowed_limit} - {event.max_allowed_limit} members
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-textMuted">Teams Allowed</span>
                    <span className="font-medium text-textDark">
                      {event.per_unit_allowed_limit} per unit
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="success" 
                  size="sm" 
                  className="w-full group-hover:bg-success/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/kalamela/official/event/group/${event.id}`);
                  }}
                >
                  Select Team
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
          {groupEvents.length === 0 && (
            <Card className="col-span-full text-center py-12 bg-gray-50">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-textMuted font-medium">No group events available yet</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for updates</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
