import React, { useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { TeamCard } from './TeamCard';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  dup_rating?: number;
}

interface MatchScoringProps {
  leagueId: Id<"leagues">;
  gameDayId: Id<"game_days">;
  courtNumber: number;
  rotationNumber: number;
  gameNumber: number;
  team1: [Player, Player];
  team2: [Player, Player];
  team1Score?: number;
  team2Score?: number;
  onScoreUpdate: (team1Score: number, team2Score: number) => void;
  isEditable?: boolean;
}

export const MatchScoring: React.FC<MatchScoringProps> = ({
  leagueId,
  gameDayId,
  courtNumber,
  rotationNumber,
  gameNumber,
  team1,
  team2,
  team1Score = 0,
  team2Score = 0,
  onScoreUpdate,
  isEditable = true
}) => {
  const [localTeam1Score, setLocalTeam1Score] = useState(team1Score);
  const [localTeam2Score, setLocalTeam2Score] = useState(team2Score);

  const handleScoreChange = (team: 1 | 2, newScore: number) => {
    if (!isEditable) return;
    
    const score = Math.max(0, newScore);
    
    if (team === 1) {
      setLocalTeam1Score(score);
    } else {
      setLocalTeam2Score(score);
    }
  };

  const handleSaveScores = () => {
    if (!isEditable) return;
    onScoreUpdate(localTeam1Score, localTeam2Score);
  };

  const isWinning = localTeam1Score > localTeam2Score;
  const isLosing = localTeam1Score < localTeam2Score;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Game {gameNumber} - Rotation {rotationNumber}
        </h3>
        <p className="text-sm text-gray-600">
          Court {courtNumber}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TeamCard
          teamNumber={1}
          players={team1}
          score={localTeam1Score}
          isWinning={isWinning}
          isLosing={isLosing}
        />
        
        <TeamCard
          teamNumber={2}
          players={team2}
          score={localTeam2Score}
          isWinning={!isWinning && !isLosing}
          isLosing={isLosing}
        />
      </div>

      {isEditable && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team 1 Score
              </label>
              <input
                type="number"
                min="0"
                value={localTeam1Score}
                onChange={(e) => handleScoreChange(1, parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team 2 Score
              </label>
              <input
                type="number"
                min="0"
                value={localTeam2Score}
                onChange={(e) => handleScoreChange(2, parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setLocalTeam1Score(team1Score);
                setLocalTeam2Score(team2Score);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reset
            </button>
            
            <button
              onClick={handleSaveScores}
              disabled={localTeam1Score === team1Score && localTeam2Score === team2Score}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Scores
            </button>
          </div>
        </div>
      )}

      {!isEditable && (
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {localTeam1Score} - {localTeam2Score}
          </div>
          {localTeam1Score > localTeam2Score && (
            <p className="text-green-600 font-medium">Team 1 Wins!</p>
          )}
          {localTeam2Score > localTeam1Score && (
            <p className="text-green-600 font-medium">Team 2 Wins!</p>
          )}
          {localTeam1Score === localTeam2Score && localTeam1Score > 0 && (
            <p className="text-yellow-600 font-medium">Tie Game</p>
          )}
        </div>
      )}
    </div>
  );
}; 