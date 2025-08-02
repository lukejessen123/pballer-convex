import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { Check } from 'lucide-react';

interface Player {
  _id: string;
  first_name: string;
  last_name: string;
  dup_rating?: number;
  email?: string;
}

interface Rotation {
  game_number: number;
  rotation_number: number;
  team1: [Player | null, Player | null];
  team2: [Player | null, Player | null];
  start_time?: string;
  end_time?: string;
  team1_score?: number;
  team2_score?: number;
}

interface GameDayScoringViewProps {
  leagueId: string;
  gameDayId: string;
  courtConfigs: Record<string, string>;
  rotations: Record<string, Rotation[]>;
  isLoading: boolean;
  isAdmin: boolean;
  isFinalized: boolean;
  isFinalizing: boolean;
  selectedCourt: string | null;
  onCourtSelect: (courtNumber: string) => void;
  onFinalizeGameDay: () => Promise<void>;
  onNavigate: (path: string) => void;
}

const GameDayScoringView: React.FC<GameDayScoringViewProps> = ({
  leagueId,
  gameDayId,
  courtConfigs,
  rotations,
  isLoading,
  isAdmin,
  isFinalized,
  isFinalizing,
  selectedCourt,
  onCourtSelect,
  onFinalizeGameDay,
  onNavigate
}) => {
  // Prepare sorted courts: user's courts first, then the rest
  const sortedCourts: [string, string][] = Object.entries(courtConfigs);

  return (
    <div className="p-6">
      <div className="flex items-center mb-2 justify-between">
        <div className="flex items-center">
          <button
            className="mr-4 px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600"
            onClick={() => onNavigate(`/leagues/${leagueId}`)}
          >
            ← Back to League
          </button>
          <h1 className="text-2xl font-bold text-white">Match Scoring</h1>
        </div>
        {isAdmin && !isFinalized && (
          <Button
            onClick={onFinalizeGameDay}
            isLoading={isFinalizing}
            leftIcon={<Check size={16} />}
            variant="success"
          >
            Finalize Game Day
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <>
          {sortedCourts.length > 1 && (
            <div className="mb-6">
              <label htmlFor="court-select" className="block mb-2 text-sm font-semibold text-gray-200">
                Select Court
              </label>
              <select
                id="court-select"
                value={selectedCourt ?? ''}
                onChange={e => onCourtSelect(e.target.value)}
                className="mb-6 w-60 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-base text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition shadow-sm outline-none"
              >
                {sortedCourts.map(([courtNumber, displayName]) => (
                  <option key={courtNumber} value={courtNumber}>
                    {displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-8">
            {selectedCourt && courtConfigs[selectedCourt] ? (
              <div key={selectedCourt}>
                <h2 className="mb-4 text-xl font-bold text-white">{courtConfigs[selectedCourt]}</h2>
                <div className="space-y-6 text-black">
                  {/* MatchScoring component would be passed as a prop or imported */}
                  <div className="bg-gray-100 p-4 rounded">
                    <p>Match Scoring Component for Court {selectedCourt}</p>
                    <p>Rotations: {rotations[selectedCourt]?.length || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white">No court selected.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GameDayScoringView; 