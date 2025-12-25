import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { 
  ArrowLeft, Save, Calculator, Info, Search, 
  Users, Trophy, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { calculateGrade, calculateGradePoints } from '../../../services/api-helpers';
import { useIndividualEvents, useAdminIndividualParticipants } from '../../../hooks/queries';

interface Participant {
  participant_id: number;
  event_participation_id: number;
  participant_name: string;
  chest_number: string;
  unit_name: string;
  district_name: string;
  seniority_category: string;
}

interface Score {
  participant_id: number;
  event_participation_id: number;
  marks: number;
  grade?: 'A' | 'B' | 'C' | 'No Grade';
  gradePoints?: number;
}

export const ScoreIndividualEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const parsedEventId = parseInt(eventId || '0');
  
  // Fetch events to get event name
  const { data: eventsData, isLoading: loadingEvents, error: eventsError } = useIndividualEvents();
  // Fetch all participants
  const { data: participantsData, isLoading: loadingParticipants, error: participantsError } = useAdminIndividualParticipants();
  
  const [scores, setScores] = useState<Record<number, Score>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Find event name from eventId
  const event = useMemo(() => {
    return eventsData?.find((e: any) => e.id === parsedEventId);
  }, [eventsData, parsedEventId]);

  // Get participants for this specific event
  const participants: Participant[] = useMemo(() => {
    if (!event?.name || !participantsData) return [];
    
    const eventParticipants = participantsData[event.name] || [];
    return eventParticipants.map((p: any) => ({
      participant_id: p.participant_id,
      event_participation_id: p.individual_event_participation_id,
      participant_name: p.participant_name,
      chest_number: p.participant_chest_number || '-',
      unit_name: p.participant_unit || 'Unknown Unit',
      district_name: p.participant_district || 'Unknown District',
      seniority_category: p.seniority_category || 'N/A',
    }));
  }, [event, participantsData]);

  // Filter participants by search
  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const term = searchTerm.toLowerCase();
    return participants.filter(p => 
      p.participant_name.toLowerCase().includes(term) ||
      p.chest_number.toLowerCase().includes(term) ||
      p.unit_name.toLowerCase().includes(term) ||
      p.district_name.toLowerCase().includes(term)
    );
  }, [participants, searchTerm]);

  // Initialize scores when participants load
  useEffect(() => {
    if (participants.length > 0) {
      const initialScores: Record<number, Score> = {};
      participants.forEach((participant) => {
        if (!scores[participant.participant_id]) {
          initialScores[participant.participant_id] = {
            participant_id: participant.participant_id,
            event_participation_id: participant.event_participation_id,
            marks: 0,
          };
        }
      });
      if (Object.keys(initialScores).length > 0) {
        setScores(prev => ({ ...prev, ...initialScores }));
      }
    }
  }, [participants]);

  const updateScore = (participantId: number, marks: number) => {
    const score = scores[participantId];
    if (!score) return;
    
    const updatedScore = { ...score, marks };
    
    // Calculate grade preview
    if (marks > 0) {
      updatedScore.grade = calculateGrade(marks);
      updatedScore.gradePoints = calculateGradePoints(marks);
    } else {
      updatedScore.grade = undefined;
      updatedScore.gradePoints = undefined;
    }
    
    setScores({ ...scores, [participantId]: updatedScore });
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

    try {
      setSubmitting(true);
      
      // Format for API: array of { event_participation_id, awarded_mark }
      const formattedScores = scoresToSubmit.map((s) => ({
        event_participation_id: s.event_participation_id,
        awarded_mark: s.marks,
      }));

      await api.addIndividualEventScores(parsedEventId, formattedScores);
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
              <div key={i} className="h-14 bg-gray-100 rounded"></div>
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

  if (participants.length === 0) {
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
          <h3 className="text-lg font-semibold text-textDark mb-2">No Participants Found</h3>
          <p className="text-textMuted">No participants have registered for this event yet.</p>
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
            <div className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            {event.name}
          </h1>
          <p className="text-sm text-textMuted mt-1">Enter marks for {participants.length} participants</p>
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
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textDark">{participants.length}</p>
              <p className="text-xs text-textMuted">Participants</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/15 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success" />
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
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-textDark mb-2">Scoring System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-textMuted">
              <ul className="space-y-1 list-disc list-inside">
                <li>Enter marks out of <strong>100</strong></li>
                <li><strong>Grades:</strong> A (≥60), B (50-59), C (40-49)</li>
              </ul>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Grade Points:</strong> A=5, B=3, C=1</li>
                <li><strong>Rank Points:</strong> 1st=5, 2nd=3, 3rd=1</li>
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
          placeholder="Search by name, chest number, unit, or district..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-borderColor rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Score Entry List */}
      <Card>
        <div className="divide-y divide-borderColor">
          {filteredParticipants.map((participant, index) => {
            const score = scores[participant.participant_id];
            if (!score) return null;
            
            return (
              <div 
                key={participant.participant_id} 
                className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                {/* Participant Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-textDark truncate">{participant.participant_name}</h4>
                      <Badge variant="light" className="flex-shrink-0">{participant.chest_number}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-textMuted mt-1 flex-wrap">
                      <span>{participant.unit_name}</span>
                      <span>•</span>
                      <span>{participant.district_name}</span>
                      {participant.seniority_category !== 'N/A' && (
                        <>
                          <span>•</span>
                          <Badge variant="primary" className="text-xs">{participant.seniority_category}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Input */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-textMuted whitespace-nowrap">Marks:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score.marks || ''}
                      onChange={(e) => updateScore(participant.participant_id, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-borderColor rounded-lg text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="0-100"
                    />
                  </div>
                  
                  {/* Grade Preview */}
                  <div className="flex items-center gap-2 min-w-[100px]">
                    {score.grade && score.marks > 0 ? (
                      <>
                        <Badge variant={
                          score.grade === 'A' ? 'success' :
                          score.grade === 'B' ? 'warning' :
                          score.grade === 'C' ? 'primary' : 'light'
                        }>
                          {score.grade}
                        </Badge>
                        <span className="text-sm font-semibold text-textMuted">
                          +{score.gradePoints} pts
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-textMuted">-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredParticipants.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <Search className="w-10 h-10 text-textMuted mx-auto mb-3" />
            <p className="text-textMuted">No participants match "{searchTerm}"</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </div>
        )}
      </Card>

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
            * Final ranks and total points will be calculated by the system after submission
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
