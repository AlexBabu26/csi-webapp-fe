import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { ArrowLeft, Save, Calculator, Info } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { calculateGrade, calculateGradePoints } from '../../../services/api-helpers';
import { useIndividualEventScoring } from '../../../hooks/queries';

interface Candidate {
  participant_id: number;
  participant_name: string;
  chest_number: string;
  unit_name: string;
  seniority_category: string;
  event_participation_id?: number; // For API submission
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
  
  const parsedEventId = parseInt(eventId!);
  
  // Use TanStack Query
  const { data, isLoading: loading } = useIndividualEventScoring(parsedEventId);
  
  const [scores, setScores] = useState<Record<number, Score>>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize scores when data loads
  useEffect(() => {
    if (data?.participants) {
      const initialScores: Record<number, Score> = {};
      data.participants.forEach((participant: Candidate) => {
        initialScores[participant.participant_id] = {
          participant_id: participant.participant_id,
          event_participation_id: participant.event_participation_id || participant.participant_id,
          marks: 0,
        };
      });
      setScores(initialScores);
    }
  }, [data]);

  const updateScore = (participantId: number, marks: number) => {
    const score = scores[participantId];
    const updatedScore = { ...score, marks };
    
    // Calculate grade preview (backend will calculate final rank)
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
      
      // Format for new API: array of { event_participation_id, awarded_mark }
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/admin/scores')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">{data.event_name}</h1>
          <p className="text-sm text-textMuted mt-1">Enter marks for individual event participants</p>
        </div>
        <Button
          variant="success"
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || validScores.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Submitting...' : `Submit Scores (${validScores.length})`}
        </Button>
      </div>

      {/* Instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-textDark mb-2">Scoring System</h3>
            <ul className="text-sm text-textMuted space-y-1 list-disc list-inside">
              <li>Enter marks out of <strong>100</strong> for each participant</li>
              <li><strong>Grades:</strong> A (≥60%), B (50-59%), C (40-49%), No Grade (&lt;40%)</li>
              <li><strong>Grade Points:</strong> A = 5 pts, B = 3 pts, C = 1 pt</li>
              <li><strong>Rank Points:</strong> 1st = 5 pts, 2nd = 3 pts, 3rd = 1 pt</li>
              <li><strong>Total Points = Grade Points + Rank Points</strong></li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Info about auto-ranking */}
      <Card className="bg-warning/5 border-warning/20">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-sm text-textMuted">
            <strong>Ranks are auto-calculated</strong> by the system based on marks. 
            Just enter the marks and the system will determine 1st, 2nd, 3rd positions automatically.
          </p>
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
                <th className="text-center p-3 text-sm font-semibold text-textDark">Marks (out of 100)</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Grade</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Grade Points</th>
              </tr>
            </thead>
            <tbody>
              {data.participants.map((candidate: Candidate, index: number) => {
                const score = scores[candidate.participant_id];
                if (!score) return null;
                
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
                        onChange={(e) => updateScore(candidate.participant_id, parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-borderColor rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="0-100"
                      />
                    </td>
                    <td className="p-3 text-center">
                      {score.grade && score.marks > 0 && (
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
                      {score.gradePoints !== undefined && score.marks > 0 ? score.gradePoints : '-'}
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
    </div>
  );
};
