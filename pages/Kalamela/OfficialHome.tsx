import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { Calendar, Users, CreditCard, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { IndividualEvent, GroupEvent } from '../../types';
import { useKalamelaOfficialHome } from '../../hooks/queries';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: 'Individual Events',
      value: data.individual_events.length,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Group Events',
      value: data.group_events.length,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-textMuted">{stat.label}</p>
                <p className="text-2xl font-bold text-textDark">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-textDark mb-2">Registration Steps</h3>
            <ol className="text-sm text-textMuted space-y-1 list-decimal list-inside">
              <li>Select an event from the lists below</li>
              <li>Choose participants from your unit members</li>
              <li>Review all registrations in the Preview page</li>
              <li>Complete payment and upload proof</li>
              <li>Print your registration form</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Individual Events */}
      <div>
        <h2 className="text-xl font-bold text-textDark mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Individual Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.individual_events.map((event: IndividualEvent, index: number) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/kalamela/official/event/individual/${event.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-textDark">
                  {index + 1}. {event.name}
                </h3>
                {event.category_name && (
                  <Badge variant="light">{event.category_name}</Badge>
                )}
              </div>
              <p className="text-sm text-textMuted mb-4 line-clamp-2">{event.description || 'No description'}</p>
              <Button variant="primary" size="sm" className="w-full">
                Select Participants
              </Button>
            </Card>
          ))}
          {data.individual_events.length === 0 && (
            <Card className="col-span-full text-center py-8">
              <p className="text-textMuted">No individual events available yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* Group Events */}
      <div>
        <h2 className="text-xl font-bold text-textDark mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-success" />
          Group Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.group_events.map((event: GroupEvent, index: number) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/kalamela/official/event/group/${event.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-textDark">
                  {index + 1}. {event.name}
                </h3>
              </div>
              <p className="text-sm text-textMuted mb-3 line-clamp-2">{event.description || 'No description'}</p>
              <div className="flex items-center gap-4 text-sm text-textMuted mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {event.min_allowed_limit} - {event.max_allowed_limit} per team
                </span>
                <span>{event.per_unit_allowed_limit} team(s)/unit</span>
              </div>
              <Button variant="success" size="sm" className="w-full">
                Select Team
              </Button>
            </Card>
          ))}
          {data.group_events.length === 0 && (
            <Card className="col-span-full text-center py-8">
              <p className="text-textMuted">No group events available yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
