import React, { useState, useMemo, useRef } from 'react';
import { Tabs, Tab } from '@mui/material';
import StandingsTable from '../../components/Standings/StandingsTable';
import SeasonStandingsTable from '../../components/Standings/SeasonStandingsTable';
import { exportToExcel } from '../../Utils/exportToExcel';

interface GameDay {
  _id: string;
  date: string;
  is_finalized: boolean;
}

interface Standing {
  _id: string;
  player_id: string;
  first_name?: string;
  last_name?: string;
  substitute_name?: string;
  movement?: string;
  court_number?: number;
  game_scores?: number[];
  total_points?: number;
  games_won?: number;
}

interface CourtAssignment {
  _id: string;
  player_id: string;
  first_name: string;
  last_name: string;
  next_court_number?: number;
  court_number?: number;
}

interface LeagueRankingsTabProps {
  leagueId: string;
  gameDays: GameDay[];
  selectedGameDayId: string | null;
  mostRecentGameDayId: string | null;
  seasonRankings: Standing[];
  gameDayRankings: Standing[];
  courtAssignments: CourtAssignment[];
  courtDisplayNames: Record<number, string>;
  gamesPerMatch: number;
  errors: Record<string, string>;
  onGameDaySelect: (gameDayId: string) => void;
  onExportSeason: () => void;
  onExportGameDay: () => void;
  onExportNextWeek: () => void;
}

const LeagueRankingsTab: React.FC<LeagueRankingsTabProps> = ({
  leagueId,
  gameDays,
  selectedGameDayId,
  mostRecentGameDayId,
  seasonRankings,
  gameDayRankings,
  courtAssignments,
  courtDisplayNames,
  gamesPerMatch,
  errors,
  onGameDaySelect,
  onExportSeason,
  onExportGameDay,
  onExportNextWeek
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [hasScrolledTabs, setHasScrolledTabs] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Helper to group court assignments by court_number or next_court_number
  const groupedCourtAssignments = useMemo(() => {
    const grouped: Record<string, CourtAssignment[]> = {};
    courtAssignments.forEach((ca: CourtAssignment) => {
      // Use next_court_number if it exists, otherwise fallback to court_number
      const court = ca.next_court_number ?? ca.court_number;
      if (!grouped[court]) grouped[court] = [];
      grouped[court].push(ca);
    });
    return grouped;
  }, [courtAssignments]);

  // Add error display
  const renderError = (key: string) => {
    if (!errors[key]) return null;
    return (
      <div className="text-red-500 mt-2 mb-4">
        Error: {errors[key]}
      </div>
    );
  };

  // Helper to format a date string (YYYY-MM-DD) as local date
  function formatLocalDateFromYMD(dateString: string) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    // JS Date: month is 0-based
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString();
  }

  const handleTabsScroll = () => {
    const el = tabsScrollRef.current;
    if (!el) return;
    setHasScrolledTabs(el.scrollLeft > 5);
  };

  return (
    <div>
      <div
        ref={tabsScrollRef}
        className={`overflow-x-auto scroll-fade-right${hasScrolledTabs ? ' scrolled' : ''}`}
        onScroll={handleTabsScroll}
      >
        <div className="min-w-max">
          <Tabs
            value={tabIndex}
            onChange={(_, v: number) => setTabIndex(v)}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              backgroundColor: '#181f2a', // Match your app's dark background
              color: 'white',
              borderRadius: 8,
              minHeight: 48,
              '& .MuiTab-root': {
                color: 'white',
                fontWeight: 600,
                minHeight: 48,
                fontSize: '1rem',
                letterSpacing: '0.05em',
                textTransform: 'none',
                opacity: 0.7,
              },
              '& .Mui-selected': {
                color: '#fff',
                opacity: 1,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#14b8a6', // Teal accent (Tailwind's teal-500)
                height: 4,
                borderRadius: 2,
              },
            }}
          >
            <Tab label="Season Rankings" />
            <Tab label="Game Day Scores" />
            <Tab label="Next Week Court Assignments" />
          </Tabs>
        </div>
      </div>

      {tabIndex === 0 && (
        <div className="mt-4">
          {renderError('seasonRankings')}
          <button onClick={onExportSeason} className="mb-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
            Export to Excel
          </button>
          <SeasonStandingsTable standings={seasonRankings} isLoading={false} />
        </div>
      )}

      {tabIndex === 1 && (
        <div className="mt-4">
          {renderError('gameDays')}
          {renderError('gameDayRankings')}
          <button onClick={onExportGameDay} className="mb-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
            Export to Excel
          </button>
          <select
            value={selectedGameDayId || ''}
            onChange={e => onGameDaySelect(e.target.value)}
            className="mb-4 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 outline-none transition"
          >
            {gameDays.map(gd => (
              <option key={gd._id} value={gd._id}>
                {formatLocalDateFromYMD(gd.date)}
              </option>
            ))}
          </select>
          <StandingsTable 
            standings={gameDayRankings} 
            isLoading={false} 
            courtDisplayNames={courtDisplayNames}
            gamesPerMatch={gamesPerMatch}
          />
        </div>
      )}

      {tabIndex === 2 && (
        <div className="mt-4">
          {renderError('courtAssignments')}
          <button onClick={onExportNextWeek} className="mb-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
            Export to Excel
          </button>
          <div className="flex flex-col gap-4 w-full">
            {Object.entries(groupedCourtAssignments).map(([court, players]: [string, CourtAssignment[]]) => (
              <div key={court} className="mb-6">
                <h3 className="font-semibold mb-2 text-white">{courtDisplayNames[Number(court)] || `Court ${court}`}</h3>
                <ul className="bg-gray-800 rounded p-4">
                  {players.map((player: CourtAssignment) => (
                    <li key={player._id} className="text-white">
                      {player.first_name} {player.last_name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueRankingsTab;