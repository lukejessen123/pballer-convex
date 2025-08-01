import React, { useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Minus, Download } from 'lucide-react';
import type { Standing, StandingWithPlayer } from '../../services/standingsService';
import { Card } from '../ui/Card';

interface StandingsTableProps {
  standings: (Standing | StandingWithPlayer)[];
  isLoading?: boolean;
  onExport?: () => void;
  courtDisplayNames?: Record<number, string>;
  gamesPerMatch: number;
}

const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  isLoading,
  onExport,
  courtDisplayNames,
  gamesPerMatch,
}) => {
  const MovementIcon = {
    up: ArrowUp,
    down: ArrowDown,
    stay: Minus,
  };

  const movementColor = {
    up: 'text-success-600 dark:text-success-400',
    down: 'text-error-600 dark:text-error-400',
    stay: 'text-gray-600 dark:text-gray-400',
  };

  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHasScrolled(el.scrollLeft > 5);
  };

  // Helper function to get player name
  const getPlayerName = (standing: Standing | StandingWithPlayer) => {
    if ('player' in standing && standing.player) {
      return `${standing.player.first_name} ${standing.player.last_name}`;
    }
    return standing.display_name || 'Unknown Player';
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
            Current Standings
          </h3>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Download size={16} />
              Export
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Movement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Court
              </th>
              {Array.from({ length: gamesPerMatch }).map((_, i) => (
                <th key={`game-col-${i}`} className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {`Game ${i + 1}`}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Points Won
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Games Won
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {standings.map((standing) => (
              <tr key={standing._id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getPlayerName(standing)}
                      </div>
                      {standing.substitute_name && (
                        <div style={{ fontSize: '0.8em', color: '#aaa' }}>
                          (Sub: {standing.substitute_name})
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  {standing.movement && (
                    <>
                      {standing.movement === 'up' && <ArrowUp size={16} className="text-success-600 dark:text-success-400" />}
                      {standing.movement === 'down' && <ArrowDown size={16} className="text-error-600 dark:text-error-400" />}
                      {standing.movement === 'stay' && <Minus size={16} className="text-gray-600 dark:text-gray-400" />}
                      <span>{standing.movement.charAt(0).toUpperCase() + standing.movement.slice(1)}</span>
                    </>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {courtDisplayNames && courtDisplayNames[standing.court_number]
                    ? courtDisplayNames[standing.court_number]
                    : standing.court_number}
                </td>
                {Array.from({ length: gamesPerMatch }).map((_, i) => (
                  <td key={`game-score-${i}`} className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {/* For now, show '-' since game_scores is not in the interface */}
                    {/* This can be enhanced when game scores are added to the Standing interface */}
                    {'-'}
                  </td>
                ))}
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {standing.total_points}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {standing.games_won}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default StandingsTable;