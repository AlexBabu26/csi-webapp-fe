import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { ArrowLeft, Download, Trophy, Medal, Award, Users, Calendar, Building, MapPin, Edit } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { useIndividualEventScoresByName, useGroupEventScoresByName, useIndividualEvents, useGroupEvents } from '../../../hooks/queries';
import { api } from '../../../services/api';

export const EventResults: React.FC = () => {
  const { eventName, eventType } = useParams<{ eventName: string; eventType: 'individual' | 'group' }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);

  // Decode event name from URL
  const decodedEventName = eventName ? decodeURIComponent(eventName) : '';

  // Fetch scores based on event type
  const { data: individualScores, isLoading: loadingIndividual } = useIndividualEventScoresByName(
    decodedEventName
  );
  const { data: groupScores, isLoading: loadingGroup } = useGroupEventScoresByName(
    decodedEventName
  );

  // Fetch events to get event ID from event name
  const { data: individualEvents } = useIndividualEvents();
  const { data: groupEvents } = useGroupEvents();

  const scores = eventType === 'individual' ? individualScores : groupScores;
  const loading = eventType === 'individual' ? loadingIndividual : loadingGroup;
  const eventScores = scores?.event_scores || [];

  // Find event ID from event name
  const eventId = useMemo(() => {
    const events = eventType === 'individual' ? individualEvents : groupEvents;
    const event = events?.find((e: any) => e.name === decodedEventName);
    return event?.id;
  }, [decodedEventName, eventType, individualEvents, groupEvents]);

  // Handle edit navigation
  const handleEdit = () => {
    if (!eventId) {
      addToast('Event ID not found', 'error');
      return;
    }
    navigate(`/kalamela/admin/scores/${eventType}/${eventId}/edit`);
  };

  // Format mark to 2 decimal places
  const formatMark = (mark: number | null | undefined): string => {
    if (mark === null || mark === undefined) return '-';
    return parseFloat(mark.toString()).toFixed(2);
  };

  // Get grade badge variant
  const getGradeBadgeVariant = (grade: string | null) => {
    if (!grade) return 'light';
    switch (grade.toUpperCase()) {
      case 'A': return 'success';
      case 'B': return 'warning';
      case 'C': return 'danger';
      default: return 'light';
    }
  };

  // Get position icon
  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Format position
  const formatPosition = (position: number | null): string => {
    if (!position) return '-';
    const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
    return `${position}${suffix}`;
  };

  // Export results
  const handleExport = async () => {
    if (!scores || eventScores.length === 0) {
      addToast('No data to export', 'warning');
      return;
    }

    try {
      setExporting(true);
      
      // Create CSV content
      const headers = eventType === 'individual'
        ? ['Rank', 'Participant Name', 'Chest Number', 'Unit Name', 'District Name', 'Marks', 'Grade', 'Total Points']
        : ['Rank', 'Chest Number', 'Unit Name', 'District Name', 'Marks', 'Grade', 'Total Points'];
      
      const rows = eventScores.map((score: any, index: number) => {
        const rank = index + 1;
        if (eventType === 'individual') {
          return [
            rank,
            score.participant_name || '-',
            score.chest_number || '-',
            score.unit_name || '-',
            score.district_name || '-',
            score.awarded_mark || 0,
            score.grade || '-',
            score.total_points || 0,
          ];
        } else {
          return [
            rank,
            score.chest_number || '-',
            score.unit_name || '-',
            score.district_name || '-',
            score.awarded_mark || 0,
            score.grade || '-',
            score.total_points || 0,
          ];
        }
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${decodedEventName.replace(/[^a-z0-9]/gi, '_')}_results_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast('Results exported successfully', 'success');
    } catch (err) {
      addToast('Failed to export results', 'error');
    } finally {
      setExporting(false);
    }
  };

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

  if (!scores || eventScores.length === 0) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-textDark">Event Results</h1>
        </div>
        <Card className="text-center py-12">
          <p className="text-textMuted">No results available for this event</p>
        </Card>
      </div>
    );
  }

  // Sort by total_points descending (or awarded_mark if total_points not available)
  const sortedScores = [...eventScores].sort((a: any, b: any) => {
    const aPoints = a.total_points ?? a.awarded_mark ?? 0;
    const bPoints = b.total_points ?? b.awarded_mark ?? 0;
    return bPoints - aPoints;
  });

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg shadow-primary/20">
                {eventType === 'individual' ? (
                  <Calendar className="w-6 h-6 text-white" />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              {decodedEventName}
            </h1>
            <p className="mt-1 text-sm text-textMuted">
              {eventType === 'individual' ? 'Individual Event' : 'Group Event'} Results
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="warning" size="sm" onClick={handleEdit} disabled={!eventId}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Scores
          </Button>
          <Button variant="success" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/15 rounded-lg">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{sortedScores.length}</p>
              <p className="text-xs text-textMuted">Total {eventType === 'individual' ? 'Participants' : 'Teams'}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/15 rounded-lg">
              <Award className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">
                {sortedScores.filter((s: any) => s.grade === 'A').length}
              </p>
              <p className="text-xs text-textMuted">Grade A</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/15 rounded-lg">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">
                {new Set(sortedScores.map((s: any) => s.unit_name).filter(Boolean)).size}
              </p>
              <p className="text-xs text-textMuted">Units</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-borderColor">
                <th className="text-left p-3 text-sm font-semibold text-textDark">Rank</th>
                {eventType === 'individual' && (
                  <th className="text-left p-3 text-sm font-semibold text-textDark">Participant</th>
                )}
                <th className="text-left p-3 text-sm font-semibold text-textDark">Chest Number</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">Unit Name</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">District Name</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Marks</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Grade</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((score: any, index: number) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                
                return (
                  <tr
                    key={score.id}
                    className={`border-b border-borderColor hover:bg-bgLight ${
                      isTopThree ? 'bg-success/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getPositionIcon(rank)}
                        <Badge variant={
                          rank === 1 ? 'success' :
                          rank === 2 ? 'warning' :
                          rank === 3 ? 'primary' : 'light'
                        }>
                          #{rank}
                        </Badge>
                      </div>
                    </td>
                    {eventType === 'individual' && (
                      <td className="p-3">
                        <span className="text-sm font-medium text-textDark">
                          {score.participant_name || '-'}
                        </span>
                      </td>
                    )}
                    <td className="p-3">
                      <Badge variant="light">{score.chest_number || '-'}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-textMuted" />
                        <span className="text-sm text-textDark">
                          {score.unit_name || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-textMuted" />
                        <span className="text-sm text-textDark">
                          {score.district_name || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-semibold text-textDark">
                        {formatMark(score.awarded_mark)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={getGradeBadgeVariant(score.grade)}>
                        {score.grade || '-'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-bold text-primary">
                        {score.total_points ?? formatMark(score.awarded_mark) ?? '0.00'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

