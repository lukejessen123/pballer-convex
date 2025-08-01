import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';

interface Player {
  id: string;
  name: string;
}

interface NextMatchProps {
  match?: {
    date?: string;
    time?: string;
    location: string;
    court: string;
    players: Player[];
    leagueName: string;
    start_datetime_utc?: string;
    end_datetime_utc?: string;
  };
  isLoading?: boolean;
  leagueId?: string;
  onCardClick?: () => void;
}

const NextMatchCard: React.FC<NextMatchProps> = ({ match, isLoading, leagueId, onCardClick }) => {
  // Helper to parse as local time, even if string ends with 'Z'
  const parseLocal = (dt: string) => new Date(dt.replace(/Z$/, ''));

  let displayDate = '';
  let displayTime = '';
  if (match?.start_datetime_utc && match?.end_datetime_utc) {
    const start = parseLocal(match.start_datetime_utc);
    const end = parseLocal(match.end_datetime_utc);
    displayDate = start.toLocaleDateString([], { dateStyle: 'medium' });
    displayTime = `${start.toLocaleTimeString([], { timeStyle: 'short' })} - ${end.toLocaleTimeString([], { timeStyle: 'short' })}`;
  } else if (match?.date && match?.time) {
    // Fallback: show date and time as provided
    displayDate = match.date;
    displayTime = match.time;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Next Match</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!match) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Next Match</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">
            No upcoming matches scheduled
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div
      tabIndex={onCardClick ? 0 : undefined}
      role={onCardClick ? 'button' : undefined}
      className={onCardClick ? 'focus:outline-none' : ''}
      onClick={onCardClick}
      onKeyDown={onCardClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(); } : undefined}
      style={{ cursor: onCardClick ? 'pointer' : undefined }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{match.leagueName || 'Next Match'}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="text-white">{displayDate}</span>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="text-white">{displayTime}</span>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400 mt-1" />
              <div>
                <p className="text-white">{match.location || 'Location TBD'}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="font-medium text-white">Players:</div>
              <div className="font-medium text-white text-right">
                Court Assignment: <span className="text-primary-400">{match.court || 'TBD'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {match.players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-full bg-primary-50 px-3 py-1 text-center text-sm text-white dark:bg-primary-900/30 border border-primary-400 dark:border-primary-600"
                >
                  {player.name}
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default NextMatchCard;