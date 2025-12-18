import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../../components/ui';
import { Trophy, Star, Crown } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';

export const TopPerformers: React.FC = () => {
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    kalaprathibha: Array<{
      rank: number;
      unit_name: string;
      total_points: number;
      individual_points: number;
      group_points: number;
      event_count: number;
    }>;
    kalathilakam: Array<{
      rank: number;
      participant_name: string;
      unit_name: string;
      total_points: number;
      event_count: number;
      grades: { A: number; B: number; C: number };
    }>;
  } | null>(null);

  useEffect(() => {
    loadTopPerformers();
  }, []);

  const loadTopPerformers = async () => {
    try {
      setLoading(true);
      const response = await api.getKalaprathibha();
      setData(response.data);
    } catch (err) {
      addToast("Failed to load top performers", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in max-w-6xl mx-auto">
        <div className="h-12 bg-gray-200 rounded w-96 animate-pulse mx-auto"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Crown className="w-10 h-10 text-yellow-500" />
          <h1 className="text-3xl sm:text-4xl font-bold text-textDark tracking-tight">
            Top Performers
          </h1>
          <Crown className="w-10 h-10 text-yellow-500" />
        </div>
        <p className="text-textMuted">
          CSI Madhya Kerala Diocese Youth Movement - Excellence in Arts & Culture
        </p>
      </div>

      {/* Kalaprathibha - Unit Champions */}
      <div>
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <h2 className="text-2xl font-bold text-textDark">Kalaprathibha</h2>
          </div>
          <p className="text-textMuted">Top Performing Units - Based on Combined Points</p>
        </Card>

        {data?.kalaprathibha && data.kalaprathibha.length > 0 ? (
          <div className="space-y-4">
            {data.kalaprathibha.map((unit, index) => (
              <Card
                key={index}
                className={`hover:shadow-lg transition-all ${
                  unit.rank === 1 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300' :
                  unit.rank === 2 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300' :
                  unit.rank === 3 ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300' :
                  ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    unit.rank === 1 ? 'bg-yellow-500 text-white' :
                    unit.rank === 2 ? 'bg-gray-400 text-white' :
                    unit.rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {unit.rank}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-textDark">{unit.unit_name}</h3>
                    <p className="text-sm text-textMuted mt-1">
                      {unit.event_count} events participated
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-textMuted">Individual</p>
                      <p className="text-lg font-bold text-primary">{unit.individual_points}</p>
                    </div>
                    <div>
                      <p className="text-xs text-textMuted">Group</p>
                      <p className="text-lg font-bold text-success">{unit.group_points}</p>
                    </div>
                    <div>
                      <p className="text-xs text-textMuted">Total</p>
                      <p className="text-2xl font-bold text-textDark">{unit.total_points}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p className="text-textMuted">Kalaprathibha rankings will be published after score calculation</p>
          </Card>
        )}
      </div>

      {/* Kalathilakam - Individual Champions */}
      <div>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-textDark">Kalathilakam</h2>
          </div>
          <p className="text-textMuted">Top Individual Performers - Highest Total Points</p>
        </Card>

        {data?.kalathilakam && data.kalathilakam.length > 0 ? (
          <div className="space-y-4">
            {data.kalathilakam.map((performer, index) => (
              <Card
                key={index}
                className={`hover:shadow-lg transition-all ${
                  performer.rank === 1 ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300' :
                  performer.rank === 2 ? 'bg-gradient-to-r from-pink-50 to-pink-100 border-2 border-pink-300' :
                  performer.rank === 3 ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300' :
                  ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    performer.rank === 1 ? 'bg-purple-500 text-white' :
                    performer.rank === 2 ? 'bg-pink-500 text-white' :
                    performer.rank === 3 ? 'bg-indigo-500 text-white' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {performer.rank}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-textDark">{performer.participant_name}</h3>
                    <p className="text-sm text-textMuted mt-1">{performer.unit_name}</p>
                    <p className="text-xs text-textMuted mt-1">
                      {performer.event_count} events participated
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex gap-3">
                      <Badge variant="success">A: {performer.grades.A}</Badge>
                      <Badge variant="warning">B: {performer.grades.B}</Badge>
                      <Badge variant="primary">C: {performer.grades.C}</Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-textMuted">Total Points</p>
                      <p className="text-3xl font-bold text-purple-600">{performer.total_points}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p className="text-textMuted">Kalathilakam rankings will be published after score calculation</p>
          </Card>
        )}
      </div>
    </div>
  );
};


