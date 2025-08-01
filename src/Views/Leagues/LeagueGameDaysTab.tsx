import React from 'react';
import GameDayList from '../../components/leagues/GameDayList';

interface GameDay {
  _id: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  is_finalized: boolean;
}

interface LeagueGameDaysTabProps {
  leagueId: string;
  gameDays: GameDay[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  onGameDayAdded: () => void;
}

const LeagueGameDaysTab: React.FC<LeagueGameDaysTabProps> = ({ 
  leagueId, 
  gameDays, 
  isAdmin, 
  isSuperAdmin, 
  isLoading, 
  onGameDayAdded 
}) => {
  return (
    <GameDayList
      leagueId={leagueId}
      gameDays={gameDays}
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
      onGameDayAdded={onGameDayAdded}
      isLoading={isLoading}
    />
  );
};

export default LeagueGameDaysTab; 