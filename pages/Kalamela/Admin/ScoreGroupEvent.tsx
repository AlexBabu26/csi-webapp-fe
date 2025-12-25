import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { ArrowLeft, Save, Calculator, Users, Info } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { calculateGrade } from '../../../services/api-helpers';
import { useGroupEventScoring } from '../../../hooks/queries';

interface Team {
  participation_id: number;
  chest_number: string;
  unit_name: string;
  members: Array<{ name: string; age: number }>;
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
  
  const parsedEventId = parseInt(eventId!);
  
  // Use TanStack Query
  const { data, isLoading: loading } = useGroupEventScoring(parsedEventId);
  
  const [scores, setScores] = useState<Record<number, Score>>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize scores when data loads
  useEffect(() => {
    if (data?.teams) {
      const initialScores: Record<number, Score> = {};
      data.teams.forEach((team: Team) => {
        initialScores[team.participation_id] = {
          participation_id: team.participation_id,
          chest_number: team.chest_number,
          marks: 0,
        };
      });
      setScores(initialScores);
    }
  }, [data]);

  const updateScore = (participationId: number, marks: number) => {
    const score = scores[participationId];
    const updatedScore = { ...score, marks };
    
    // Calculate grade preview (backend will calculate final rank)
    if (marks > 0) {
      updatedScore.grade = calculateGrade(marks);
    } else {
      updatedScore.grade = undefined;
    }
    
    setScores({ ...scores, [participationId]: updatedScore });
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

    if (!data?.event_name) {
      addToast("Event name not found", "error");
      return;
    }

    try {
      setSubmitting(true);
      
      // Format for new API: array of { chest_number, awarded_mark }
      // Uses event_name (not event_id) in the endpoint
      const formattedScores = scoresToSubmit.map((s) => ({
        chest_number: s.chest_number,
        awarded_mark: s.marks,
      }));

      await api.addGroupEventScores(data.event_name, formattedScores);
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

  if (!data || data.teams.length === 0) {
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
          <p className="text-textMuted">No teams found for this event</p>
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
          <h1 className="text-2xl font-bold text-textDark flex items-center gap-2">
            <Users className="w-6 h-6 text-success" />
            {data.event_name}
          </h1>
          <p className="text-sm text-textMuted mt-1">Enter marks for group event teams</p>
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
      <Card className="bg-success/5 border-success/20">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-textDark mb-2">Group Event Scoring System</h3>
            <ul className="text-sm text-textMuted space-y-1 list-disc list-inside">
              <li>Enter marks out of <strong>100</strong> for each team</li>
              <li><strong>Grades:</strong> A (≥60%), B (50-59%), C (40-49%), No Grade (&lt;40%)</li>
              <li><strong>Rank Points:</strong> 1st = 5 pts, 2nd = 3 pts, 3rd = 1 pt</li>
              <li><strong>Group events only get rank points</strong> (no grade points for championship)</li>
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
                <th className="text-left p-3 text-sm font-semibold text-textDark">Unit</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">Team Members</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Marks (out of 100)</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team: Team, index: number) => {
                const score = scores[team.participation_id];
                if (!score) return null;
                
                return (
                  <tr key={team.participation_id} className="border-b border-borderColor hover:bg-bgLight">
                    <td className="p-3 text-sm text-textDark">{index + 1}</td>
                    <td className="p-3 text-sm">
                      <Badge variant="light">{team.chest_number}</Badge>
                    </td>
                    <td className="p-3 text-sm font-medium text-textDark">{team.unit_name}</td>
                    <td className="p-3 text-sm text-textMuted">
                      <div className="flex flex-wrap gap-1">
                        {team.members.map((member, idx) => (
                          <span key={idx} className="text-xs">
                            {member.name}
                            {idx < team.members.length - 1 && ','}
                          </span>
                        ))}
                      </div>
                      <Badge variant="success" className="mt-1">
                        {team.members.length} members
                      </Badge>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score.marks || ''}
                        onChange={(e) => updateScore(team.participation_id, parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-borderColor rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-success/20"
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
            * Final ranks and points will be calculated by the system after submission
          </p>
        </Card>
      )}
    </div>
  );
};
