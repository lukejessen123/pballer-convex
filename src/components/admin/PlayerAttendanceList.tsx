import React from 'react';
import { Search, Check, X } from 'lucide-react';
import Input from '../ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import type { Player } from '../../services/gameDayService';

interface PlayerAttendanceListProps {
  players: Player[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAttendanceChange: (playerId: string, isPresent: boolean) => void;
  isLoading?: boolean;
}

const PlayerAttendanceList: React.FC<PlayerAttendanceListProps> = ({
  players,
  searchQuery,
  onSearchChange,
  onAttendanceChange,
  isLoading,
}) => {
  const filteredPlayers = players.filter(
    (player) =>
      `${player.first_name} ${player.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      player.dup_rating.toString().includes(searchQuery)
  );

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Attendance</CardTitle>
        <Input
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search size={16} />}
          className="mt-4"
        />
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                player.is_present
                  ? 'border-success-200 bg-success-50 dark:border-success-900 dark:bg-success-900/30'
                  : 'border-error-200 bg-error-50 dark:border-error-900 dark:bg-error-900/30'
              }`}
            >
              <div>
                <div className="font-medium">
                  {player.first_name} {player.last_name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Rating: {player.dup_rating}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAttendanceChange(player.id, true)}
                  className={`rounded-full p-2 transition-colors ${
                    player.is_present
                      ? 'bg-success-200 text-success-800 dark:bg-success-900 dark:text-success-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-success-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-success-900/30'
                  }`}
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => onAttendanceChange(player.id, false)}
                  className={`rounded-full p-2 transition-colors ${
                    !player.is_present
                      ? 'bg-error-200 text-error-800 dark:bg-error-900 dark:text-error-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-error-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-error-900/30'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default PlayerAttendanceList; 