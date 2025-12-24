import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Info, 
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  Music,
  Mic2,
  BookOpen,
  Palette,
  Trophy,
  Star
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { IndividualEvent, GroupEvent } from '../../types';
import { useKalamelaOfficialHome } from '../../hooks/queries';

// Helper type for the API response structure
interface IndividualEventItem {
  event: IndividualEvent & { category_name: string };
  participation_count: number;
  remaining_slots: number;
}

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const lower = category?.toLowerCase() || '';
  if (lower.includes('music')) return <Music className="w-4 h-4" />;
  if (lower.includes('stage')) return <Mic2 className="w-4 h-4" />;
  if (lower.includes('literary')) return <BookOpen className="w-4 h-4" />;
  if (lower.includes('art') || lower.includes('fine')) return <Palette className="w-4 h-4" />;
  return <Star className="w-4 h-4" />;
};

// Category color mapping
const getCategoryColor = (category: string): string => {
  const lower = category?.toLowerCase() || '';
  if (lower.includes('music')) return 'bg-blue-500';
  if (lower.includes('stage')) return 'bg-purple-500';
  if (lower.includes('literary')) return 'bg-amber-500';
  if (lower.includes('art') || lower.includes('fine')) return 'bg-pink-500';
  return 'bg-gray-500';
};

const getCategoryBgColor = (category: string): string => {
  const lower = category?.toLowerCase() || '';
  if (lower.includes('music')) return 'bg-blue-50 border-blue-200 text-blue-700';
  if (lower.includes('stage')) return 'bg-purple-50 border-purple-200 text-purple-700';
  if (lower.includes('literary')) return 'bg-amber-50 border-amber-200 text-amber-700';
  if (lower.includes('art') || lower.includes('fine')) return 'bg-pink-50 border-pink-200 text-pink-700';
  return 'bg-gray-50 border-gray-200 text-gray-700';
};

export const KalamelaOfficialHome: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  // Use TanStack Query
  const { data: responseData, isLoading: loading } = useKalamelaOfficialHome();
  const data = responseData || null;

  // Transform and process events
  const { individualEvents, groupEvents, categories, stats } = useMemo(() => {
    if (!data) return { individualEvents: [], groupEvents: [], categories: [], stats: null };

    // Transform individual_events from grouped object to flat array
    const indEvents: Array<IndividualEvent & { participation_count: number; remaining_slots: number }> = [];
    if (data.individual_events && typeof data.individual_events === 'object') {
      Object.values(data.individual_events).forEach((categoryEvents: any) => {
        if (Array.isArray(categoryEvents)) {
          categoryEvents.forEach((item: IndividualEventItem) => {
            indEvents.push({
              ...item.event,
              participation_count: item.participation_count,
              remaining_slots: item.remaining_slots,
            });
          });
        }
      });
    }

    // Transform group_events from object to array
    const grpEvents: GroupEvent[] = [];
    if (data.group_events && typeof data.group_events === 'object') {
      Object.values(data.group_events).forEach((event: any) => {
        if (event && event.id) {
          grpEvents.push(event as GroupEvent);
        }
      });
    }

    // Extract unique categories
    const uniqueCategories = [...new Set(indEvents.map(e => e.category_name).filter(Boolean))];

    // Calculate stats
    const totalSlots = indEvents.reduce((acc, e) => acc + (e.remaining_slots + e.participation_count), 0);
    const usedSlots = indEvents.reduce((acc, e) => acc + e.participation_count, 0);
    const eventsWithRegistrations = indEvents.filter(e => e.participation_count > 0).length;

    return {
      individualEvents: indEvents,
      groupEvents: grpEvents,
      categories: uniqueCategories,
      stats: {
        totalSlots,
        usedSlots,
        eventsWithRegistrations,
        totalIndividualEvents: indEvents.length,
        totalGroupEvents: grpEvents.length,
      }
    };
  }, [data]);

  // Filter events based on search and filters
  const filteredIndividualEvents = useMemo(() => {
    return individualEvents.filter(event => {
      const matchesSearch = !searchTerm || 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.category_name && event.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesAvailable = !showOnlyAvailable || event.remaining_slots > 0;
      const matchesCategory = selectedCategory === 'all' || event.category_name === selectedCategory;
      return matchesSearch && matchesAvailable && matchesCategory;
    });
  }, [individualEvents, searchTerm, showOnlyAvailable, selectedCategory]);

  // Group filtered events by category
  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, typeof filteredIndividualEvents> = {};
    filteredIndividualEvents.forEach(event => {
      const cat = event.category_name || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(event);
    });
    return grouped;
  }, [filteredIndividualEvents]);

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  const progressPercent = stats ? Math.round((stats.eventsWithRegistrations / stats.totalIndividualEvents) * 100) : 0;

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-textMuted">Individual Events</p>
              <p className="text-2xl font-bold text-primary">{stats?.totalIndividualEvents || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/20">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium text-textMuted">Group Events</p>
              <p className="text-2xl font-bold text-success">{stats?.totalGroupEvents || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-200">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-textMuted">Registered</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.eventsWithRegistrations || 0}
                <span className="text-sm font-normal text-purple-400">/{stats?.totalIndividualEvents || 0}</span>
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-200">
              <CheckCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-textMuted">Slots Used</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats?.usedSlots || 0}
                <span className="text-sm font-normal text-amber-400">/{stats?.totalSlots || 0}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-textDark">Registration Progress</span>
          <span className="text-sm font-bold text-primary">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-textMuted mt-2">
          {stats?.eventsWithRegistrations || 0} of {stats?.totalIndividualEvents || 0} individual events have registrations
        </p>
      </Card>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-textMuted" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-primary border-borderColor rounded focus:ring-primary"
              />
              <span className="text-sm text-textDark">Available only</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Individual Events - Grouped by Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-textDark flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Individual Events
          </h2>
          <span className="text-sm text-textMuted">
            {filteredIndividualEvents.length} of {individualEvents.length} event(s)
          </span>
        </div>

        {Object.keys(groupedByCategory).length === 0 ? (
          <Card className="text-center py-12 bg-gray-50">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-textMuted font-medium">No events found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByCategory).map(([category, events]) => (
              <div key={category} className="border border-borderColor rounded-xl overflow-hidden bg-white">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${getCategoryBgColor(category)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(category)} text-white`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold">{category}</h3>
                      <p className="text-xs opacity-75">{events.length} event(s)</p>
                    </div>
                  </div>
                  {collapsedCategories.has(category) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>

                {/* Events Grid */}
                {!collapsedCategories.has(category) && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-gray-50/50">
                    {events.map((event) => {
                      const isFull = event.remaining_slots === 0;
                      const hasRegistrations = event.participation_count > 0;
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => !isFull && navigate(`/kalamela/official/event/individual/${event.id}`)}
                          className={`
                            bg-white rounded-xl border-2 p-4 transition-all relative
                            ${isFull 
                              ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                              : hasRegistrations
                                ? 'border-success/30 hover:border-success hover:shadow-lg cursor-pointer'
                                : 'border-borderColor hover:border-primary hover:shadow-lg cursor-pointer'
                            }
                          `}
                        >
                          {/* Status indicator */}
                          <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
                            isFull ? 'bg-gray-300' : hasRegistrations ? 'bg-success' : 'bg-primary/30'
                          }`} />
                          
                          <div className="pl-2">
                            <h4 className="font-semibold text-textDark mb-1 line-clamp-1">{event.name}</h4>
                            
                            {/* Registration Status */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                isFull 
                                  ? 'bg-gray-100 text-gray-500' 
                                  : hasRegistrations 
                                    ? 'bg-success/10 text-success' 
                                    : 'bg-primary/10 text-primary'
                              }`}>
                                {event.participation_count}/{event.participation_count + event.remaining_slots} registered
                              </span>
                            </div>

                            {/* Slots */}
                            <div className={`text-sm font-medium ${event.remaining_slots > 0 ? 'text-success' : 'text-gray-400'}`}>
                              {event.remaining_slots > 0 ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {event.remaining_slots} slot{event.remaining_slots !== 1 ? 's' : ''} left
                                </span>
                              ) : (
                                <span>Full</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupEvents.map((event: GroupEvent) => {
            const isFull = event.is_registration_complete || event.remaining_slots === 0;
            const hasRegistrations = (event.participation_count || 0) > 0;
            
            return (
              <Card 
                key={event.id} 
                className={`
                  group transition-all border-2 relative overflow-hidden
                  ${isFull 
                    ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                    : hasRegistrations
                      ? 'hover:shadow-lg hover:border-success border-success/30 cursor-pointer'
                      : 'hover:shadow-lg hover:border-success/30 border-transparent cursor-pointer'
                  }
                `}
                onClick={() => !isFull && navigate(`/kalamela/official/event/group/${event.id}`)}
              >
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  isFull ? 'bg-gray-300' : hasRegistrations ? 'bg-success' : 'bg-success/30'
                }`} />
                
                <div className="pl-2">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-bold text-lg ${isFull ? 'text-gray-400' : 'text-textDark group-hover:text-success'} transition-colors`}>
                      {event.name}
                    </h3>
                    <Badge variant={isFull ? "light" : "success"} className="text-xs">
                      {isFull ? 'Full' : 'Group'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-textMuted mb-4 line-clamp-2">
                    {event.description || 'No description available'}
                  </p>
                  
                  {/* Team Info */}
                  <div className={`${isFull ? 'bg-gray-50' : 'bg-success/5'} rounded-lg p-3 mb-4`}>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-textMuted block text-xs">Team Size</span>
                        <span className={`font-semibold ${isFull ? 'text-gray-400' : 'text-textDark'}`}>
                          {event.min_allowed_limit} - {event.max_allowed_limit}
                        </span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-xs">Teams Registered</span>
                        <span className={`font-semibold ${isFull ? 'text-gray-400' : 'text-textDark'}`}>
                          {event.participation_count || 0} / 2
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Registration Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isFull 
                        ? 'bg-gray-100 text-gray-500' 
                        : hasRegistrations 
                          ? 'bg-success/10 text-success' 
                          : 'bg-primary/10 text-primary'
                    }`}>
                      {event.remaining_slots ?? 2} slot{(event.remaining_slots ?? 2) !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                  
                  <Button 
                    variant={isFull ? "outline" : "success"}
                    size="sm" 
                    className="w-full"
                    disabled={isFull}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFull) navigate(`/kalamela/official/event/group/${event.id}`);
                    }}
                  >
                    {isFull ? (
                      'Registration Complete'
                    ) : (
                      <>
                        Select Team
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
          
          {groupEvents.length === 0 && (
            <Card className="col-span-full text-center py-12 bg-gray-50">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-textMuted font-medium">No group events available yet</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for updates</p>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 mb-2">Quick Tips</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-amber-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Click on any event to register participants</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Green border indicates events with registrations</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Complete payment after all registrations</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
