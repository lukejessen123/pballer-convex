import React from 'react';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  dup_rating?: number;
}

interface TeamCardProps {
  teamNumber: number;
  players: [Player, Player];
  score?: number;
  isWinning?: boolean;
  isLosing?: boolean;
  onTeamClick?: (teamNumber: number) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  teamNumber,
  players,
  score,
  isWinning = false,
  isLosing = false,
  onTeamClick
}) => {
  const getTeamColor = () => {
    if (isWinning) return 'bg-green-50 border-green-300';
    if (isLosing) return 'bg-red-50 border-red-300';
    return 'bg-gray-50 border-gray-200';
  };

  const getScoreColor = () => {
    if (isWinning) return 'text-green-700 bg-green-100';
    if (isLosing) return 'text-red-700 bg-red-100';
    return 'text-gray-700 bg-gray-100';
  };

  return (
    <div 
      className={`p-4 border rounded-lg ${getTeamColor()} transition-all ${
        onTeamClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={() => onTeamClick?.(teamNumber)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900">
          Team {teamNumber}
        </h3>
        {score !== undefined && (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor()}`}>
            {score}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {index + 1}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {player.first_name} {player.last_name}
                </span>
                {player.dup_rating && (
                  <div className="text-xs text-gray-500">
                    DUPR: {player.dup_rating}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 