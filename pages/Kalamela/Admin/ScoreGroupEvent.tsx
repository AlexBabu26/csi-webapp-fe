import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/ui';
import { ArrowLeft, Save, Calculator, Users } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { calculateGrade, calculatePoints } from '../../../services/api-helpers';

interface Team {
  participation_id: number;
  chest_number: string;
  unit_name: string;
  members: Array<{ name: string; age: number }>;
}

interface Score {
  participation_id: number;
  marks: number;
  position: number;
  grade?: 'A' | 'B' | 'C' | 'No Grade';
  positionPoints?: number;
  totalPoints?: number;
}

export const ScoreGroupEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<{
    event_id: number;
    event_name: string;
    teams: Team[];
  } | null>(null);
  const [scores, setScores] = useState<Record<number, Score>>({});

  useEffect(() => {
    loadTeams();
  }, [eventId]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await api.getGroupEventCandidates(parseInt(eventId!));
      setData(response.data);
      
      // Initialize scores
      const initialScores: Record<number, Score> = {};
      response.data.teams.forEach((team: Team) => {
        initialScores[team.participation_id] = {
          participation_id: team.participation_id,
          marks: 0,
          position: 0,
        };
      });
      setScores(initialScores);
    } catch (err: any) {
      addToast(err.message || "Failed to load teams", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (participationId: number, field: 'marks' | 'position', value: number) => {
    const updatedScore = { ...scores[participationId], [field]: value };
    
    // Calculate grade and points (no grade bonus for group events)
    if (updatedScore.marks > 0 && updatedScore.position > 0) {
      const calculated = calculatePoints(updatedScore.marks, updatedScore.position, true);
      updatedScore.grade = calculated.grade;
      updatedScore.positionPoints = calculated.positionPoints;
      updatedScore.totalPoints = calculated.totalPoints;
    }
    
    setScores({ ...scores, [participationId]: updatedScore });
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

    try {
      setSubmitting(true);
      await api.bulkAddGroupScores(parseInt(eventId!), scoresToSubmit);
      addToast("Scores submitted successfully", "success");
      navigate('/kalamela/admin/scores');
    } catch (err: any) {
      addToast(err.message || "Failed to submit scores", "error");
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
          <h1 className="text-2xl font-bold text-textDark flex items-center gap-2">
            <Users className="w-6 h-6 text-success" />
            {data.event_name}
          </h1>
          <p className="text-sm text-textMuted mt-1">Enter scores for group event teams</p>
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
      <Card className="bg-success/5 border-success/20">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-textDark mb-2">Group Event Score Entry</h3>
            <ul className="text-sm text-textMuted space-y-1 list-disc list-inside">
              <li>Enter marks out of 100 and position (1, 2, 3, etc.)</li>
              <li>Grade is automatically calculated: A (&ge;60%), B (&gt;50%), C (&gt;40%)</li>
              <li>Points: Position only (10/5/3 for 1st/2nd/3rd) - No grade bonus for group events</li>
              <li>Only teams with both marks and position will be submitted</li>
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
                <th className="text-left p-3 text-sm font-semibold text-textDark">Unit</th>
                <th className="text-left p-3 text-sm font-semibold text-textDark">Team Members</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Marks (100)</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Position</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Grade</th>
                <th className="text-center p-3 text-sm font-semibold text-textDark">Points</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team, index) => {
                const score = scores[team.participation_id];
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
                        onChange={(e) => updateScore(team.participation_id, 'marks', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-borderColor rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-success/20"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={score.position || ''}
                        onChange={(e) => updateScore(team.participation_id, 'position', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-borderColor rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-success/20"
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
                    <td className="p-3 text-center text-sm font-bold text-success">
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
              <p className="text-2xl font-bold text-success">
                {Math.max(...validScores.map((s) => s.totalPoints || 0))}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};


