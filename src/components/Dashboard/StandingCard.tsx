import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../ui/Card';
import { Link } from 'react-router-dom';

interface StandingProps {
  standing?: {
    rank: number;
    wins: number;
    losses: number;
    movement: 'up' | 'down' | 'stay';
    totalPoints: number;
    winPercentage: number;
  };
  isLoading?: boolean;
  title?: string;
  leagueId?: string | null;
}

const StandingCard: React.FC<StandingProps> = ({ standing, isLoading, title, leagueId }) => {
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || 'Season Ranking'}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!standing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || 'Season Ranking'}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">
            No standing information available
          </div>
        </CardBody>
      </Card>
    );
  }

  const MovementIcon = {
    up: ArrowUp,
    down: ArrowDown,
    stay: Minus,
  }[standing.movement];

  const movementColor = {
    up: 'text-success-600 dark:text-success-400',
    down: 'text-error-600 dark:text-error-400',
    stay: 'text-gray-600 dark:text-gray-400',
  }[standing.movement];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Season Ranking'}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400">Rank</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-white">{getOrdinal(standing.rank)}</span>
              {standing.movement !== 'stay' && <MovementIcon className={`h-5 w-5 ${movementColor}`} />}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Wins</p>
            <span className="text-2xl font-bold text-white">{standing.wins}</span>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Points</p>
            <span className="text-2xl font-bold text-white">{standing.totalPoints}</span>
          </div>
        </div>
        <div className="mt-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-white">Record</span>
            <div>
              <span className="font-medium text-success-400">{standing.wins}W</span>
              <span className="mx-1 text-white">/</span>
              <span className="font-medium text-error-400">{standing.losses}L</span>
            </div>
          </div>
        </div>
      </CardBody>
      {leagueId && (
        <CardFooter>
          <Link
            to={`/leagues/${leagueId}/rankings`}
            className="w-full text-center text-primary-400 hover:text-primary-300"
          >
            View Full Rankings
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default StandingCard;