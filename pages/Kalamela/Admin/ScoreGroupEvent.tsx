import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { 
  ArrowLeft, Save, Calculator, Users, Info, Search,
  Trophy, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { calculateGrade } from '../../../services/api-helpers';
import { useGroupEvents, useAdminGroupParticipants } from '../../../hooks/queries';

interface TeamMember {
  name: string;
  participant_id: number;
}

interface Team {
  participation_id: number;
  chest_number: string;
  unit_name: string;
  district_name: string;
  members: TeamMember[];
}

interface Score {
  participation_id: number;
  chest_number: string;
  marks: number;
  grade?: 'A' | 'B' | 'C' | 'No Grade';
}

export const ScoreGroupEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const parsedEventId = parseInt(eventId || '0');
  
  // Fetch events to get event name
  const { data: eventsData, isLoading: loadingEvents, error: eventsError } = useGroupEvents();
  // Fetch all participants
  const { data: participantsData, isLoading: loadingParticipants, error: participantsError } = useAdminGroupParticipants();
  
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Find event from eventId
  const event = useMemo(() => {
    return eventsData?.find((e: any) => e.id === parsedEventId);
  }, [eventsData, parsedEventId]);

  // Get teams for this specific event
  const teams: Team[] = useMemo(() => {
    if (!event?.name || !participantsData) return [];
    
    const eventTeams = participantsData[event.name] || {};
    
    return Object.entries(eventTeams).map(([chestNumber, members]: [string, any]) => ({
      participation_id: members[0]?.group_event_participation_id || 0,
      chest_number: chestNumber,
      unit_name: members[0]?.participant_unit || 'Unknown Unit',
      district_name: members[0]?.participant_district || 'Unknown District',
      members: members.map((m: any) => ({
        name: m.participant_name,
        participant_id: m.participant_id,
      })),
    }));
  }, [event, participantsData]);

  // Filter teams by search
  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const term = searchTerm.toLowerCase();
    return teams.filter(t => 
      t.chest_number.toLowerCase().includes(term) ||
      t.unit_name.toLowerCase().includes(term) ||
      t.district_name.toLowerCase().includes(term) ||
      t.members.some(m => m.name.toLowerCase().includes(term))
    );
  }, [teams, searchTerm]);

  // Initialize scores when teams load
  useEffect(() => {
    if (teams.length > 0) {
      const initialScores: Record<string, Score> = {};
      teams.forEach((team) => {
        if (!scores[team.chest_number]) {
          initialScores[team.chest_number] = {
            participation_id: team.participation_id,
            chest_number: team.chest_number,
            marks: 0,
          };
        }
      });
      if (Object.keys(initialScores).length > 0) {
        setScores(prev => ({ ...prev, ...initialScores }));
      }
    }
  }, [teams]);

  const updateScore = (chestNumber: string, marks: number) => {
    const score = scores[chestNumber];
    if (!score) return;
    
    const updatedScore = { ...score, marks };
    
    // Calculate grade preview
    if (marks > 0) {
      updatedScore.grade = calculateGrade(marks);
    } else {
      updatedScore.grade = undefined;
    }
    
    setScores({ ...scores, [chestNumber]: updatedScore });
  };

  const handleSubmit = async () => {
    const scoresToSubmit = Object.values(scores).filter((score) => score.marks > 0);

    if (scoresToSubmit.length === 0) {
      addToast("Please enter at least one valid score", "warning");
      return;
    }

    // Validate marks are <= 100
    const invalidMarks = scoresToSubmit.find((s) => s.marks > 100);
    if (invalidMarks) {
      addToast("Marks cannot exceed 100", "error");
      return;
    }

    // Validate marks are >= 0
    const negativeMarks = scoresToSubmit.find((s) => s.marks < 0);
    if (negativeMarks) {
      addToast("Marks cannot be negative", "error");
      return;
    }

    if (!event?.name) {
      addToast("Event name not found", "error");
      return;
    }

    try {
      setSubmitting(true);
      
      // Format for API: array of { chest_number, awarded_mark }
      const formattedScores = scoresToSubmit.map((s) => ({
        chest_number: s.chest_number,
        awarded_mark: s.marks,
      }));

      await api.addGroupEventScores(event.name, formattedScores);
      addToast(`${scoresToSubmit.length} scores submitted successfully!`, 'success');
      navigate('/kalamela/admin/scores');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit scores', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = loadingEvents || loadingParticipants;

  // Show error if API calls failed
  if (eventsError || participantsError) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-textDark">Error Loading Data</h1>
        </div>
        <Card className="text-center py-12 bg-danger/5 border-danger/20">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-textDark mb-2">Failed to load data</h3>
          <p className="text-textMuted mb-4">
            {(eventsError as any)?.message || (participantsError as any)?.message || 'An error occurred while fetching data.'}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <Card className="animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-textDark">Event Not Found</h1>
        </div>
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <p className="text-textMuted">The event you're looking for doesn't exist.</p>
        </Card>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-textDark">{event.name}</h1>
        </div>
        <Card className="text-center py-12">
          <Users className="w-12 h-12 text-textMuted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-textDark mb-2">No Teams Found</h3>
          <p className="text-textMuted">No teams have registered for this event yet.</p>
        </Card>
      </div>
    );
  }

  const validScores = Object.values(scores).filter((s) => s.marks > 0);
  const gradeDistribution = {
    A: validScores.filter((s) => s.grade === 'A').length,
    B: validScores.filter((s) => s.grade === 'B').length,
    C: validScores.filter((s) => s.grade === 'C').length,
    NoGrade: validScores.filter((s) => s.grade === 'No Grade').length,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-success to-success/70 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            {event.name}
          </h1>
          <p className="text-sm text-textMuted mt-1">Enter marks for {teams.length} teams</p>
        </div>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={submitting || validScores.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Submitting...' : `Submit Scores (${validScores.length})`}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/15 rounded-lg">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{teams.length}</p>
              <p className="text-xs text-textMuted">Teams</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{validScores.length}</p>
              <p className="text-xs text-textMuted">Scores Entered</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/15 rounded-lg">
              <Calculator className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">
                {validScores.length > 0 ? Math.max(...validScores.map(s => s.marks)) : '-'}
              </p>
              <p className="text-xs text-textMuted">Highest Mark</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/15 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{gradeDistribution.A}</p>
              <p className="text-xs text-textMuted">A Grades</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-success/5 border-success/20">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-textDark mb-2">Group Event Scoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-textMuted">
              <ul className="space-y-1 list-disc list-inside">
                <li>Enter marks out of <strong>100</strong></li>
                <li><strong>Grades:</strong> A (≥60), B (50-59), C (40-49)</li>
              </ul>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Rank Points:</strong> 1st=5, 2nd=3, 3rd=1</li>
                <li>Group events: <strong>Only rank points</strong> (no grade points)</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Info about auto-ranking */}
      <Card className="bg-warning/5 border-warning/20">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-sm text-textMuted">
            <strong>Ranks are auto-calculated</strong> by the system based on marks. 
            Just enter the marks and submit.
          </p>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
        <input
          type="text"
          placeholder="Search by chest number, unit, district, or member name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-borderColor rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success"
        />
      </div>

      {/* Score Entry List */}
      <div className="space-y-4">
        {filteredTeams.map((team, index) => {
          const score = scores[team.chest_number];
          if (!score) return null;
          
          return (
            <Card 
              key={team.chest_number} 
              className="hover:shadow-md transition-shadow border-l-4 border-l-success"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Team Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-success">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="success" className="text-sm font-bold">{team.chest_number}</Badge>
                      <span className="font-semibold text-textDark">{team.unit_name}</span>
                    </div>
                    <p className="text-xs text-textMuted mt-1">{team.district_name}</p>
                    
                    {/* Team Members */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {team.members.map((member, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center px-2 py-1 bg-bgLight rounded-md text-xs text-textDark"
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-textMuted mt-2">
                      <Users className="w-3 h-3 inline mr-1" />
                      {team.members.length} members
                    </p>
                  </div>
                </div>

                {/* Score Input */}
                <div className="flex items-center gap-4 lg:gap-6 pl-14 lg:pl-0">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-textMuted whitespace-nowrap">Marks:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score.marks || ''}
                      onChange={(e) => updateScore(team.chest_number, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-borderColor rounded-lg text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success"
                      placeholder="0-100"
                    />
                  </div>
                  
                  {/* Grade Preview */}
                  <div className="flex items-center gap-2 min-w-[80px]">
                    {score.grade && score.marks > 0 ? (
                      <Badge variant={
                        score.grade === 'A' ? 'success' :
                        score.grade === 'B' ? 'warning' :
                        score.grade === 'C' ? 'primary' : 'light'
                      }>
                        {score.grade}
                      </Badge>
                    ) : (
                      <span className="text-sm text-textMuted">-</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredTeams.length === 0 && searchTerm && (
          <Card className="text-center py-8">
            <Search className="w-10 h-10 text-textMuted mx-auto mb-3" />
            <p className="text-textMuted">No teams match "{searchTerm}"</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </Card>
        )}
      </div>

      {/* Summary */}
      {validScores.length > 0 && (
        <Card className="bg-success/5 border-success/20">
          <h3 className="font-semibold text-textDark mb-3">Score Summary (Preview)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-textMuted">Entries</p>
              <p className="text-2xl font-bold text-textDark">{validScores.length}</p>
            </div>
            <div>
              <p className="text-sm text-textMuted">Highest</p>
              <p className="text-2xl font-bold text-success">
                {Math.max(...validScores.map((s) => s.marks))}
              </p>
            </div>
            <div>
              <p className="text-sm text-textMuted">A Grades</p>
              <p className="text-2xl font-bold text-success">{gradeDistribution.A}</p>
            </div>
            <div>
              <p className="text-sm text-textMuted">B Grades</p>
              <p className="text-2xl font-bold text-warning">{gradeDistribution.B}</p>
            </div>
            <div>
              <p className="text-sm text-textMuted">C Grades</p>
              <p className="text-2xl font-bold text-primary">{gradeDistribution.C}</p>
            </div>
          </div>
          <p className="text-xs text-textMuted mt-3">
            * Final ranks and points will be calculated by the system after submission
          </p>
        </Card>
      )}

      {/* Sticky Submit Button for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-borderColor sm:hidden">
        <Button
          variant="success"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || validScores.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Submitting...' : `Submit ${validScores.length} Scores`}
        </Button>
      </div>
      
      {/* Spacer for mobile sticky button */}
      <div className="h-20 sm:hidden"></div>
    </div>
  );
};
