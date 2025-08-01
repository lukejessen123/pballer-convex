import React from 'react';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';

interface Match {
  _id: string;
  league: string;
  date: string;
  time: string;
  location: string;
  players: string[];
  confirmed: boolean;
}

interface AvailableMatch {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  playersCount: number;
  maxPlayers: number;
}

interface PlayViewProps {
  upcomingMatches: Match[];
  availableMatches: AvailableMatch[];
  currentUserId?: string;
  onViewMatch?: (matchId: string) => void;
  onConfirmMatch?: (matchId: string) => Promise<void>;
  onCancelMatch?: (matchId: string) => Promise<void>;
  onJoinMatch?: (matchId: string) => Promise<void>;
  onFindMatches?: () => void;
  onViewAllMatches?: () => void;
}

const PlayView: React.FC<PlayViewProps> = ({ 
  upcomingMatches, 
  availableMatches, 
  currentUserId,
  onViewMatch,
  onConfirmMatch,
  onCancelMatch,
  onJoinMatch,
  onFindMatches,
  onViewAllMatches
}) => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">Play</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage your upcoming matches</p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Upcoming Matches</h2>
        
        {upcomingMatches.length === 0 ? (
          <Card>
            <CardBody className="text-center">
              <p className="text-gray-600 dark:text-gray-400">You don't have any upcoming matches scheduled.</p>
              <Button className="mt-4" onClick={onFindMatches}>Find Matches</Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <Card key={match._id} className="overflow-hidden">
                <div className={`h-2 w-full ${match.confirmed ? 'bg-success-500' : 'bg-warning-500'}`} />
                <CardHeader>
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <CardTitle>{match.league}</CardTitle>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                      match.confirmed
                        ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                        : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                    }`}>
                      {match.confirmed ? 'Confirmed' : 'Awaiting Confirmation'}
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="mb-4 grid gap-y-2 md:grid-cols-3">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <CalendarDays size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                      <span>{match.date}</span>
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <Clock size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                      <span>{match.time}</span>
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <MapPin size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                      <span>{match.location}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="mb-2 flex items-center text-gray-700 dark:text-gray-300">
                      <Users size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium">Players:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {match.players.map((player, index) => (
                        <div
                          key={index}
                          className={`rounded-full px-3 py-1 text-sm ${
                            player === 'You'
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {player}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => onViewMatch?.(match._id)}>View Details</Button>
                    {!match.confirmed && <Button onClick={() => onConfirmMatch?.(match._id)}>Confirm</Button>}
                    {match.confirmed && <Button variant="outline" className="text-error-600 hover:border-error-300 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/30" onClick={() => onCancelMatch?.(match._id)}>Cancel</Button>}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Matches</h2>
          <Button variant="outline" size="sm" onClick={onViewAllMatches}>View All</Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableMatches.map((match) => (
            <Card key={match._id}>
              <CardBody>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{match.title}</h3>
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <CalendarDays size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
                    <span>{match.date}</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Clock size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
                    <span>{match.time}</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <MapPin size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
                    <span>{match.location}</span>
                  </div>
                </div>
                <div className="mb-4 space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Players: {match.playersCount}/{match.maxPlayers}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-full rounded-full bg-primary-600 dark:bg-primary-500" style={{ width: `${(match.playersCount / match.maxPlayers) * 100}%` }}></div>
                  </div>
                </div>
                <Button size="sm" className="w-full" onClick={() => onJoinMatch?.(match._id)}>Join Match</Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayView;