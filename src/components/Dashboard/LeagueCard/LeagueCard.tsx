import React from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '../../ui/Card';
import Button from '../../ui/Button';
import { Calendar, Clock, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  name: string;
}

interface LeagueCardProps {
  league: {
    id: string;
    name: string;
  };
  nextMatch?: {
    date: string;
    time: string;
    court?: string;
    players: Player[];
  };
  ranking?: string | number;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ league, nextMatch, ranking }) => {
  const navigate = useNavigate();

  return (
    <Card className="mb-4 w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="text-primary-600 dark:text-primary-400" size={20} />
          {league.name}
        </CardTitle>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900 dark:text-primary-300">
          Rank: {ranking ?? 'N/A'}
        </span>
      </CardHeader>
      <CardBody>
        {nextMatch ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Calendar size={16} />
              <span>{nextMatch.date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Clock size={16} />
              <span>{nextMatch.time}</span>
            </div>
            {nextMatch.court && (
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span>Court:</span>
                <span>{nextMatch.court}</span>
              </div>
            )}
            <div className="mt-2">
              <div className="mb-1 font-medium text-gray-900 dark:text-white">Players:</div>
              <div className="flex flex-wrap gap-2">
                {nextMatch.players.map((player) => (
                  <span
                    key={player.id}
                    className="rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-800 dark:bg-primary-900/30 dark:text-primary-200"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            No upcoming matches scheduled
          </div>
        )}
        <div className="mt-4 flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => navigate(`/leagues/${league.id}/view`)}>
            View Details
          </Button>
          {nextMatch && (
            <Button size="sm" onClick={() => navigate(`/leagues/${league.id}/game-day/next/scoring`)}>
              Enter Score
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LeagueCard;
