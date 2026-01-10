import React from 'react';
import { Card } from '../../components/ui';
import { Trophy, Star, Crown } from 'lucide-react';
import { useKalamelaTopPerformers } from '../../hooks/queries';

export const TopPerformers: React.FC = () => {
  // Use TanStack Query
  const { data, isLoading: loading } = useKalamelaTopPerformers();

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in max-w-6xl mx-auto px-4 py-8">
        <div className="h-12 bg-gray-200 rounded w-96 animate-pulse mx-auto"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in max-w-6xl mx-auto px-4 py-8">
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

      {/* Kalaprathibha - Top Individual Performer */}
      <div>
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <h2 className="text-2xl font-bold text-textDark">Kalaprathibha</h2>
          </div>
          <p className="text-textMuted">Top Individual Performer - Highest Combined Score</p>
        </Card>

        {data?.kalaprathibha ? (
          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 hover:shadow-lg transition-all">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-yellow-500 text-white flex items-center justify-center text-3xl font-bold">
                1
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-textDark mb-1">
                  {data.kalaprathibha.participant_name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-textMuted">
                  <p>
                    <span className="font-semibold">Unit:</span> {data.kalaprathibha.participant_unit}
                  </p>
                  <p>
                    <span className="font-semibold">District:</span> {data.kalaprathibha.participant_district}
                  </p>
                </div>
                <p className="text-sm text-textMuted mt-2">
                  Participated in {data.kalaprathibha.event_count} event{data.kalaprathibha.event_count !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-textMuted mb-1">Combined Score</p>
                <p className="text-4xl font-bold text-yellow-600">{data.kalaprathibha.combined_score}</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <p className="text-textMuted">Kalaprathibha will be announced after score calculation</p>
          </Card>
        )}
      </div>

      {/* Kalathilakam - Top Individual Performer */}
      <div>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-textDark">Kalathilakam</h2>
          </div>
          <p className="text-textMuted">Top Individual Performer - Highest Combined Score</p>
        </Card>

        {data?.kalathilakam ? (
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 hover:shadow-lg transition-all">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-purple-500 text-white flex items-center justify-center text-3xl font-bold">
                1
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-textDark mb-1">
                  {data.kalathilakam.participant_name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-textMuted">
                  <p>
                    <span className="font-semibold">Unit:</span> {data.kalathilakam.participant_unit}
                  </p>
                  <p>
                    <span className="font-semibold">District:</span> {data.kalathilakam.participant_district}
                  </p>
                </div>
                <p className="text-sm text-textMuted mt-2">
                  Participated in {data.kalathilakam.event_count} event{data.kalathilakam.event_count !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-textMuted mb-1">Combined Score</p>
                <p className="text-4xl font-bold text-purple-600">{data.kalathilakam.combined_score}</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <p className="text-textMuted">Kalathilakam will be announced after score calculation</p>
          </Card>
        )}
      </div>
    </div>
  );
};


