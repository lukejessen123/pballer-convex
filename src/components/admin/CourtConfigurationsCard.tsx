import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import type { CourtConfig } from '../../services/gameDayService';

interface CourtConfigurationCardProps {
  court: CourtConfig;
  onSizeChange: (courtNumber: number, size: number) => void;
  disabled?: boolean;
}

const CourtConfigurationCard: React.FC<CourtConfigurationCardProps> = ({
  court,
  onSizeChange,
  disabled = false,
}) => {
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    onSizeChange(court.court_number, newSize);
  };

  return (
    <Card className={`${
      court.players_count > 4 ? 'border-2 border-warning-500' : ''
    } ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{court.display_name || `Court ${court.court_number}`}</span>
          <select
            value={court.players_count}
            onChange={handleSizeChange}
            disabled={disabled}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={4}>4 Players</option>
            <option value={5}>5 Players</option>
            <option value={6}>6 Players</option>
          </select>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          {court.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
            >
              <div>
                <div className="font-medium">
                  {player.first_name} {player.last_name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Rating: {player.dup_rating || 'N/A'}
                </div>
              </div>
            </div>
          ))}
          {court.players_count > court.players.length && (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Users size={24} className="mx-auto mb-2" />
                <span>
                  {court.players_count - court.players.length} more player
                  {court.players_count - court.players.length !== 1 ? 's' : ''} needed
                </span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default CourtConfigurationCard;