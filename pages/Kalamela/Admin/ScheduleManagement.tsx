import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { 
  Calendar, Clock, MapPin, Filter, Search, 
  ChevronDown, ChevronUp, CheckCircle, XCircle, 
  AlertCircle, PlayCircle, PauseCircle, Users
} from 'lucide-react';
import { useEventsWithSchedules } from '../../../hooks/queries';
import { ScheduleStatus, IndividualEventWithSchedules, GroupEventWithSchedules } from '../../../types';

type TabType = 'individual' | 'group';
type StatusFilter = 'all' | ScheduleStatus;

export const ScheduleManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

  const { data, isLoading, error } = useEventsWithSchedules();

  const individualEvents = data?.individual_events || [];
  const groupEvents = data?.group_events || [];

  const events = activeTab === 'individual' ? individualEvents : groupEvents;

  // Filter events by search term
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Filter by schedule status if filter is set
      if (statusFilter !== 'all') {
        const hasMatchingSchedule = event.schedules?.some(
          schedule => schedule.status === statusFilter
        );
        return hasMatchingSchedule || (event.schedules?.length === 0 && statusFilter === 'all');
      }
      
      return true;
    });
  }, [events, searchTerm, statusFilter]);

  // Get all unique schedule statuses from events
  const availableStatuses = useMemo(() => {
    const statuses = new Set<ScheduleStatus>();
    events.forEach(event => {
      event.schedules?.forEach(schedule => {
        statuses.add(schedule.status);
      });
    });
    return Array.from(statuses);
  }, [events]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const eventsWithSchedules = events.filter(e => e.schedules && e.schedules.length > 0).length;
    const totalSchedules = events.reduce((sum, e) => sum + (e.schedules?.length || 0), 0);
    
    const schedulesByStatus = events.reduce((acc, e) => {
      e.schedules?.forEach(schedule => {
        acc[schedule.status] = (acc[schedule.status] || 0) + 1;
      });
      return acc;
    }, {} as Record<ScheduleStatus, number>);

    return {
      totalEvents,
      eventsWithSchedules,
      eventsWithoutSchedules: totalEvents - eventsWithSchedules,
      totalSchedules,
      schedulesByStatus
    };
  }, [events]);

  const toggleEventExpansion = (eventId: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getStatusBadgeVariant = (status: ScheduleStatus): 'success' | 'warning' | 'danger' | 'info' | 'light' => {
    switch (status) {
      case 'Scheduled':
        return 'info';
      case 'Ongoing':
        return 'success';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'danger';
      case 'Postponed':
        return 'warning';
      default:
        return 'light';
    }
  };

  const getStatusIcon = (status: ScheduleStatus) => {
    switch (status) {
      case 'Scheduled':
        return <Clock className="w-3 h-3" />;
      case 'Ongoing':
        return <PlayCircle className="w-3 h-3" />;
      case 'Completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'Cancelled':
        return <XCircle className="w-3 h-3" />;
      case 'Postponed':
        return <PauseCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-textDark mb-2">Error Loading Schedules</h3>
          <p className="text-textMuted">{error instanceof Error ? error.message : 'Failed to load schedule data'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Schedule Management</h1>
          <p className="mt-1 text-sm text-textMuted">View and manage event schedules and performing stages</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Total Events</p>
              <p className="text-2xl font-bold text-textDark mt-1">{stats.totalEvents}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">With Schedules</p>
              <p className="text-2xl font-bold text-success mt-1">{stats.eventsWithSchedules}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Total Schedules</p>
              <p className="text-2xl font-bold text-textDark mt-1">{stats.totalSchedules}</p>
            </div>
            <Clock className="w-8 h-8 text-info opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Without Schedules</p>
              <p className="text-2xl font-bold text-warning mt-1">{stats.eventsWithoutSchedules}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning opacity-50" />
          </div>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Card className="p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'individual'
                ? 'bg-primary text-white'
                : 'text-textMuted hover:bg-bgLight'
            }`}
          >
            Individual Events ({individualEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'group'
                ? 'bg-primary text-white'
                : 'text-textMuted hover:bg-bgLight'
            }`}
          >
            Group Events ({groupEvents.length})
          </button>
        </Card>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-textMuted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="all">All Schedules</option>
            {availableStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-borderColor rounded-md bg-white">
          <Search className="w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-textMuted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-textDark mb-2">No Events Found</h3>
          <p className="text-textMuted">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : `No ${activeTab} events available`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            const schedules = event.schedules || [];
            const hasSchedules = schedules.length > 0;

            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="p-6">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-textDark">{event.name}</h3>
                        {activeTab === 'group' && 'min_allowed_limit' in event && (
                          <Badge variant="light" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.min_allowed_limit}-{event.max_allowed_limit} members
                          </Badge>
                        )}
                        {event.category_name && (
                          <Badge variant="info">{event.category_name}</Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-textMuted mb-2">{event.description}</p>
                      )}
                      {hasSchedules && (
                        <div className="flex items-center gap-4 text-sm text-textMuted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSchedules && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEventExpansion(event.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Show Schedules
                            </>
                          )}
                        </Button>
                      )}
                      {!hasSchedules && (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          No Schedules
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Schedules List */}
                  {isExpanded && hasSchedules && (
                    <div className="mt-4 pt-4 border-t border-borderColor">
                      <div className="space-y-3">
                        {schedules.map((schedule) => {
                          const startTime = formatDateTime(schedule.start_time);
                          const endTime = formatDateTime(schedule.end_time);
                          const isSameDate = startTime.date === endTime.date;

                          return (
                            <Card key={schedule.id} className="p-4 bg-bgLight">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={getStatusBadgeVariant(schedule.status)} className="flex items-center gap-1">
                                      {getStatusIcon(schedule.status)}
                                      {schedule.status}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="w-4 h-4 text-textMuted" />
                                      <span className="font-medium text-textDark">{schedule.stage_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-textMuted">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {isSameDate ? (
                                          <>
                                            {startTime.date} • {startTime.time} - {endTime.time}
                                          </>
                                        ) : (
                                          <>
                                            {startTime.date} {startTime.time} - {endTime.date} {endTime.time}
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-textMuted">
                                  <div>Created: {new Date(schedule.created_on).toLocaleDateString()}</div>
                                  {schedule.updated_on !== schedule.created_on && (
                                    <div>Updated: {new Date(schedule.updated_on).toLocaleDateString()}</div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

