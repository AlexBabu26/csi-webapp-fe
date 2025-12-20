import React, { useState } from 'react';
import { Card, Badge } from '../../components/ui';
import { Trophy, Medal, Award, Calendar, Users } from 'lucide-react';
import { usePublicKalamelaResults } from '../../hooks/queries';

type TabType = 'individual' | 'group';

export const PublicResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  
  // Use TanStack Query
  const { data, isLoading: loading } = usePublicKalamelaResults();

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-50 border-yellow-200';
    if (position === 2) return 'bg-gray-50 border-gray-200';
    if (position === 3) return 'bg-amber-50 border-amber-200';
    return '';
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

  const results = activeTab === 'individual'
    ? data?.individual_results || {}
    : data?.group_results || {};
  const eventNames = Object.keys(results);

  return (
    <div className="space-y-6 animate-slide-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-textDark tracking-tight">
          Kalamela Results
        </h1>
        <p className="mt-2 text-textMuted">
          CSI Madhya Kerala Diocese Youth Movement - Displaying Top 3 Winners
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <Card className="p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'individual'
                ? 'bg-primary text-white'
                : 'text-textMuted hover:bg-bgLight'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Individual Events
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'group'
                ? 'bg-primary text-white'
                : 'text-textMuted hover:bg-bgLight'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Group Events
          </button>
        </Card>
      </div>

      {/* Results */}
      {eventNames.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-textMuted text-lg">
            Results will be published once scoring is complete
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {eventNames.map((eventName) => {
            const winners = results[eventName].slice(0, 3); // Top 3
            
            return (
              <Card key={eventName}>
                <h2 className="text-xl font-bold text-textDark mb-6 pb-3 border-b border-borderColor">
                  {eventName}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {winners.map((winner: any) => {
                    const position = winner.position;
                    
                    return (
                      <div
                        key={winner.participant_id || winner.participation_id}
                        className={`p-4 rounded-lg border-2 ${getPositionColor(position)} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {getPositionIcon(position)}
                          <span className="text-2xl font-bold text-textDark">
                            {position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'} Place
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {activeTab === 'individual' ? (
                            <>
                              <p className="font-semibold text-lg text-textDark">
                                {winner.participant_name}
                              </p>
                              <p className="text-sm text-textMuted">{winner.unit_name}</p>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="light">{winner.chest_number}</Badge>
                                {winner.seniority_category && winner.seniority_category !== 'NA' && (
                                  <Badge variant="primary">{winner.seniority_category}</Badge>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-lg text-textDark">
                                {winner.unit_name}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="light">{winner.chest_number}</Badge>
                                <Badge variant="success">{winner.member_count} members</Badge>
                              </div>
                            </>
                          )}
                          
                          <div className="mt-4 pt-3 border-t border-borderColor/50">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-textMuted">Score:</span>
                              <span className="text-lg font-bold text-primary">{winner.marks}/100</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-sm text-textMuted">Grade:</span>
                              <Badge variant={
                                winner.grade === 'A' ? 'success' :
                                winner.grade === 'B' ? 'warning' :
                                winner.grade === 'C' ? 'primary' : 'light'
                              }>
                                {winner.grade}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-sm text-textMuted">Points:</span>
                              <span className="text-lg font-bold text-textDark">{winner.total_points}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show if less than 3 winners */}
                {winners.length < 3 && (
                  <p className="text-sm text-textMuted text-center mt-4 italic">
                    Only {winners.length} {winners.length === 1 ? 'winner' : 'winners'} declared for this event
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};


