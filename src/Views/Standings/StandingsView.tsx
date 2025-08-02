import React, { useState } from 'react';
import { Users, RefreshCw, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import StandingsTable from '../../components/Standings/StandingsTable';

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
  court_number: number;
  players: {
    id: string;
    name: string;
    dup_rating: number;
    role: 'player' | 'substitute';
  }[];
}

interface GameDay {
  _id: string;
  status: string;
  is_finalized: boolean;
  date: string;
}

interface StandingsViewProps {
  standings: Standing[];
  courtAssignments: CourtAssignment[];
  gameDays: GameDay[];
  selectedLeagueId: string;
  gameDayId: string;
  isLoading: boolean;
  isAdmin: boolean;
  isRefreshing: boolean;
  isFinalizing: boolean;
  onRefreshCourts: () => Promise<void>;
  onFinalizeGameDay: () => Promise<void>;
  onExport: () => void;
  onGameDaySelect?: (gameDayId: string) => void;
}

const StandingsView: React.FC<StandingsViewProps> = ({
  standings,
  courtAssignments,
  gameDays,
  selectedLeagueId,
  gameDayId,
  isLoading,
  isAdmin,
  isRefreshing,
  isFinalizing,
  onRefreshCourts,
  onFinalizeGameDay,
  onExport,
  onGameDaySelect
}) => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            Standings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View current standings and court assignments
          </p>
        </div>
        {isAdmin && gameDayId && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRefreshCourts}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw size={16} />}
            >
              Refresh Courts
            </Button>
            <div title="All scores must be entered before finalizing.">
              <Button
                onClick={onFinalizeGameDay}
                isLoading={isFinalizing}
                leftIcon={<Check size={16} />}
              >
                Finalize Game Day
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StandingsTable
            standings={standings}
            isLoading={isLoading}
            onExport={onExport}
            gamesPerMatch={1}
            courtDisplayNames={{}}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-primary-600 dark:text-primary-400" />
                Court Assignments
              </CardTitle>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
                </div>
              ) : courtAssignments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No court assignments available
                </p>
              ) : (
                <div className="space-y-6">
                  {courtAssignments.map((court) => (
                    <div key={court.court_number}>
                      <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                        Court {court.court_number}
                      </h4>
                      <div className="space-y-2">
                        {court.players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                          >
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Rating: {player.dup_rating}
                              </div>
                            </div>
                            {player.role === 'substitute' && (
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Sub
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StandingsView;