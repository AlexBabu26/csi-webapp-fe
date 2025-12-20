import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { calculateGrade, calculatePoints } from '../../../services/api-helpers';
import { useIndividualEventScoring, useSubmitScores } from '../../../hooks/queries';

interface Candidate {
  participant_id: number;
  participant_name: string;
  chest_number: string;
  unit_name: string;
  seniority_category: string;
}

interface Score {
  participant_id: number;
  marks: number;
  position: number;
  grade?: 'A' | 'B' | 'C' | 'No Grade';
  positionPoints?: number;
  gradePoints?: number;
  totalPoints?: number;
}

export const ScoreIndividualEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const parsedEventId = parseInt(eventId!);
  
  // Use TanStack Query
  const { data, isLoading: loading } = useIndividualEventScoring(parsedEventId);
  const submitScoresMutation = useSubmitScores();
  
  const [scores, setScores] = useState<Record<number, Score>>({});

  // Initialize scores when data loads
  useEffect(() => {
    if (data?.participants) {
      const initialScores: Record<number, Score> = {};
      data.participants.forEach((participant: Candidate) => {
        initialScores[participant.participant_id] = {
          participant_id: participant.participant_id,
          marks: 0,
          position: 0,
        };
      });
      setScores(initialScores);
    }
  }, [data]);

  const updateScore = (participantId: number, field: 'marks' | 'position', value: number) => {
    const updatedScore = { ...scores[participantId], [field]: value };
    
    // Calculate grade and points
    if (updatedScore.marks > 0 && updatedScore.position > 0) {
      const calculated = calculatePoints(updatedScore.marks, updatedScore.position, false);
      updatedScore.grade = calculated.grade;
      updatedScore.positionPoints = calculated.positionPoints;
      updatedScore.gradePoints = calculated.gradePoints;
      updatedScore.totalPoints = calculated.totalPoints;
    }
    
    setScores({ ...scores, [participantId]: updatedScore });
  };

  const handleSubmit = async () => {
    const scoresToSubmit = Object.values(scores).filter(
      (score) => score.marks > 0 && score.position > 0
    );

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

    // Check for duplicate positions
    const positions = scoresToSubmit.map((s) => s.position);
    const hasDuplicates = positions.length !== new Set(positions).size;
    if (hasDuplicates) {
      addToast("Cannot have duplicate positions", "error");
      return;
    }

    submitScoresMutation.mutate(
      {
        eventId: parsedEventId,
        eventType: 'individual',
        scores: scoresToSubmit,
      },
      {
        onSuccess: () => navigate('/kalamela/admin/scores'),
      }
    );
  };

  const submitting = submitScoresMutation.isPending;

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

  if (!data || data.participants.length === 0) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-textDark">{data?.event_name || 'Score Entry'}</h1>
        </div>
        <Card className="text-center py-12">
          <p className="text-textMuted">No participants found for this event</p>
        </Card>
      </div>
    );
  }

  const validScores = Object.values(scores).filter((s) => s.marks > 0 && s.position > 0);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">{data.event_name}</h1>
          <p className="text-sm text-textMuted mt-1">Enter scores for individual event participants</p>
        </div>
        <Button
          variant="success"
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || validScores.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          Submit Scores ({validScores.length})
        </Button>
      </div>

      {/* Instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-textDark mb-2">Score Entry Instructions</h3>
            <ul className="text-sm text-textMuted space-y-1 list-disc list-inside">
              <li>Enter marks out of 100 and position (1, 2, 3, etc.)</li>
              <li>Grade is automatically calculated: A (&ge;60%), B (&gt;50%), C (&gt;40%)</li>
              <li>Points: Position (5/3/1 for 1st/2nd/3rd) + Grade Bonus (5/3/1 for A/B/C)</li>
              <li>Only participants with both marks and position will be submitted</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Score Entry Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-borderColor">
                <th className="text-left p-3 text-sm font-semibold text-textDark">Sl.</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">Chest No.</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">Participant</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">Unit</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">Category</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Marks (100)</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Position</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Grade</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Pos Pts</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Grade Pts</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Total Pts</th>
              </tr>
            </thead>
            <tbody>
              {data.participants.map((candidate, index) => {
                const score = scores[candidate.participant_id];
                return (
                  <tr key={candidate.participant_id} className="border-b border-borderColor hover:bg-bgLight">
                    <td className="p-3 text-sm text-textDark">{index + 1}</td>
                    <td className="p-3 text-sm">
                      <Badge variant="light">{candidate.chest_number}</Badge>
                    </td>
                    <td className="p-3 text-sm font-medium text-textDark">{candidate.participant_name}</td>
                    <td className="p-3 text-sm text-textMuted">{candidate.unit_name}</td>
                    <td className="p-3 text-sm">
                      <Badge variant="primary">{candidate.seniority_category}</Badge>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score.marks || ''}
                        onChange={(e) => updateScore(candidate.participant_id, 'marks', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-borderColor rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={score.position || ''}
                        onChange={(e) => updateScore(candidate.participant_id, 'position', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-borderColor rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </td>
                    <td className="p-3 text-center">
                      {score.grade && score.marks > 0 && score.position > 0 && (
                        <Badge variant={
                          score.grade === 'A' ? 'success' :
                          score.grade === 'B' ? 'warning' :
                          score.grade === 'C' ? 'primary' : 'light'
                        }>
                          {score.grade}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm font-semibold text-textDark">
                      {score.positionPoints || '-'}
                    </td>
                    <td className="p-3 text-center text-sm font-semibold text-textDark">
                      {score.gradePoints || '-'}
                    </td>
                    <td className="p-3 text-center text-sm font-bold text-primary">
                      {score.totalPoints || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      {validScores.length > 0 && (
        <Card className="bg-success/5 border-success/20">
          <h3 className="font-semibold text-textDark mb-3">Score Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-textMuted">Valid Entries</p>
              <p className="text-2xl font-bold text-textDark">{validScores.length}</p>
            </div>
            <div>
              <p className="text-sm text-textMuted">Highest Marks</p>
              <p className="text-2xl font-bold text-success">
                {Math.max(...validScores.map((s) => s.marks))}
              </p>
            </div>
            <div>
              <p className="text-sm text-textMuted">A Grades</p>
              <p className="text-2xl font-bold text-success">
                {validScores.filter((s) => s.grade === 'A').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-textMuted">Highest Points</p>
              <p className="text-2xl font-bold text-primary">
                {Math.max(...validScores.map((s) => s.totalPoints || 0))}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};


