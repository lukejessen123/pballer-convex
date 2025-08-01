import React from 'react';

interface NextWeekPlayer {
  next_court_number: number;
  player_id: string;
  first_name: string;
  last_name: string;
}

interface GroupedCourt {
  court: number;
  players: NextWeekPlayer[];
}

interface LeagueNextWeekTabProps {
  leagueId?: string;
  gameDayId?: string;
  groupedCourts: GroupedCourt[];
  isLoading: boolean;
  error: string | null;
}

const LeagueNextWeekTab: React.FC<LeagueNextWeekTabProps> = ({ 
  leagueId, 
  gameDayId, 
  groupedCourts, 
  isLoading, 
  error 
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Next Week Court Assignments</h2>
      {isLoading && <div className="text-white">Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!isLoading && !error && groupedCourts.length === 0 && (
        <div className="text-white">No assignments found.</div>
      )}
      {!isLoading && !error && groupedCourts.map(({ court, players }) => (
        <div key={court} className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Court {court}</h3>
          <div className="bg-gray-800 rounded p-4">
            {players.map((p) => (
              <div key={p.player_id} className="text-white">
                {p.first_name} {p.last_name}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeagueNextWeekTab; 