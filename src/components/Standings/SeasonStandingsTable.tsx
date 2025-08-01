import React, { useRef, useState } from 'react';
import { Card } from '../ui/Card';

interface SeasonStanding {
  player_id: string;
  first_name: string;
  last_name: string;
  total_points: number;
  avg_points_per_game: number;
  total_games_won: number;
}

interface SeasonStandingsTableProps {
  standings: SeasonStanding[];
  isLoading?: boolean;
  onExport?: () => void;
}

const SeasonStandingsTable: React.FC<SeasonStandingsTableProps> = ({
  standings,
  isLoading,
  onExport,
}) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHasScrolled(el.scrollLeft > 5);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        ref={scrollRef}
        className={`overflow-x-auto scroll-fade-right${hasScrolled ? ' scrolled' : ''}`}
        onScroll={handleScroll}
      >
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Season Rankings
          </h3>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Export
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Player Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Points
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Avg Points/Game
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Games Won
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {standings.map((standing) => (
              <tr key={standing.player_id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {standing.first_name} {standing.last_name}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {standing.total_points}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {standing.avg_points_per_game}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {standing.total_games_won}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default SeasonStandingsTable; 