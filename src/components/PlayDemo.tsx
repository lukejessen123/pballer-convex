import React from 'react';
import { PlayDashboard } from './play/PlayDashboard';

// Demo component to showcase the play functionality
export const PlayDemo: React.FC = () => {
  // Sample data for demonstration
  const sampleLeagueId = "sample_league_id" as any; // This would be a real league ID in production
  const sampleGameDayId = "sample_game_day_id" as any; // This would be a real game day ID in production
  const courtNumbers = [1, 2, 3, 4]; // Sample court numbers

  return (
    <div className="min-h-screen bg-gray-50">
      <PlayDashboard
        leagueId={sampleLeagueId}
        gameDayId={sampleGameDayId}
        courtNumbers={courtNumbers}
      />
    </div>
  );
}; 