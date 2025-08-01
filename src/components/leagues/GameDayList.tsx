import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CalendarPlus, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateGameDay } from '../../services/gameDayService';
import { Id } from '../../../convex/_generated/dataModel';

interface GameDay {
  _id: Id<"game_days">;
  _creationTime: number;
  league_id: Id<"leagues">;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  start_datetime_utc?: string;
  end_datetime_utc?: string;
  is_finalized: boolean;
}

interface GameDayListProps {
  leagueId: Id<"leagues">;
  gameDays: GameDay[];
  onGameDayAdded: () => void;
  isLoading?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

// Helper to format UTC datetime to local string
function formatLocalDateTime(utcString: string) {
  if (!utcString) return '';
  const d = new Date(utcString);
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

const GameDayList: React.FC<GameDayListProps> = ({
  leagueId,
  gameDays,
  onGameDayAdded,
  isLoading = false,
  isAdmin = false,
  isSuperAdmin = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingGameDay, setIsAddingGameDay] = useState(false);
  const [newGameDayDate, setNewGameDayDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convex mutation hook
  const createGameDay = useCreateGameDay();

  const gameDayForSelectedDate = selectedDate
    ? gameDays.find(gd => gd.date === selectedDate)
    : undefined;

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleAddGameDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameDayDate) return;

    setIsSubmitting(true);
    try {
      await createGameDay({
        leagueId,
        date: newGameDayDate,
      });

      toast.success('Game day added successfully');
      setNewGameDayDate('');
      setIsAddingGameDay(false);
      onGameDayAdded();
    } catch (error) {
      console.error('Error adding game day:', error);
      toast.error('Failed to add game day');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'in_progress':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHasScrolled(el.scrollLeft > 5);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} className="text-primary-600 dark:text-primary-400" />
            Game Days
          </CardTitle>
          {/**
           * Add Game Day button temporarily hidden
           * {!isAddingGameDay && (isAdmin || isSuperAdmin) && (
           *   <Button
           *     size="sm"
           *     onClick={() => setIsAddingGameDay(true)}
           *     leftIcon={<CalendarPlus size={16} />}
           *   >
           *     Add Game Day
           *   </Button>
           * )}
           */}
        </div>
        {/**
          * Calendar date input temporarily hidden
          * (isAdmin || isSuperAdmin) && (
          *   <div className="mt-4">
          *     <Input
          *       type="date"
          *       value={selectedDate}
          *       onChange={e => handleDateSelect(e.target.value)}
          *       leftIcon={<Calendar size={16} />}
          *       className="w-48"
          *     />
          *   </div>
          * )
          */}
      </CardHeader>
      <CardBody>
        {selectedDate && !gameDayForSelectedDate && (
          <div className="mb-4 text-center text-warning-600 dark:text-warning-400">
            No game day scheduled for {new Date(selectedDate).toLocaleDateString()}.
            {(isAdmin || isSuperAdmin) && !isAddingGameDay && (
              <div className="mt-2">
                <Button size="sm" onClick={() => {
                  setIsAddingGameDay(true);
                  setNewGameDayDate(selectedDate);
                }}>
                  Add Game Day for this date
                </Button>
              </div>
            )}
          </div>
        )}
        {isAddingGameDay && (isAdmin || isSuperAdmin) && (
          <form onSubmit={handleAddGameDay} className="mb-6">
            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
              <Input
                type="date"
                value={newGameDayDate}
                onChange={(e) => setNewGameDayDate(e.target.value)}
                required
                leftIcon={<Calendar size={16} />}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingGameDay(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        ) : gameDays.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No game days scheduled yet
          </div>
        ) : (
          <div
            ref={scrollRef}
            className={`overflow-x-auto scroll-fade-right relative${hasScrolled ? ' scrolled' : ''}`}
            onScroll={handleScroll}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {(() => {
                  const nextPendingIdx = gameDays.findIndex(gd => gd.status === 'pending');
                  return gameDays.map((gameDay, idx) => {
                    const isNextPending = idx === nextPendingIdx && gameDay.status === 'pending';
                    // Determine if row should be clickable (go to scoring)
                    const canGoToScoring =
                      (gameDay.status === 'in_progress') ||
                      (gameDay.status === 'completed' || gameDay.is_finalized);
                    const scoringUrl = `/leagues/${leagueId}/game-day/${gameDay._id}/scoring`;
                    return (
                      <tr
                        key={gameDay._id}
                        className={
                          (isNextPending ? 'bg-primary-50 dark:bg-primary-900/20 ' : '') +
                          (canGoToScoring ? ' cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-800/40 transition-colors' : '')
                        }
                        onClick={() => {
                          if (canGoToScoring) navigate(scoringUrl);
                        }}
                        tabIndex={canGoToScoring ? 0 : -1}
                        aria-label={canGoToScoring ? 'Go to match scoring' : undefined}
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {gameDay.start_datetime_utc
  ? (() => {
      // Helper to parse as local time, even if string ends with 'Z'
      const parseLocal = (dt: string) => new Date(dt.replace(/Z$/, ''));
      const start = parseLocal(gameDay.start_datetime_utc!);
      const end = parseLocal(gameDay.end_datetime_utc!);
      return (
        start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) +
        ' - ' +
        end.toLocaleTimeString([], { timeStyle: 'short' })
      );
    })()
  : new Date(gameDay.date).toLocaleDateString()}
                          {isNextPending && (
                            <span className="ml-2 inline-block rounded bg-primary-200 px-2 py-0.5 text-xs font-semibold text-primary-800 dark:bg-primary-800 dark:text-primary-200">Next</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(gameDay.status)}`}> 
                            {gameDay.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          {(isAdmin || isSuperAdmin) ? (
                            (gameDay.status === 'in_progress') ? (
                              <Link
                                to={scoringUrl}
                                className="inline-block"
                                onClick={e => e.stopPropagation()}
                              >
                                <Button
                                  variant="primary"
                                  size="sm"
                                >
                                  Enter Scores
                                </Button>
                              </Link>
                            ) : (gameDay.status === 'completed' || gameDay.is_finalized) ? (
                              <Link
                                to={scoringUrl}
                                className="inline-block"
                                onClick={e => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  Match Score
                                </Button>
                              </Link>
                            ) : (
                              <Link
                                to={`/leagues/${leagueId}/game-day/${gameDay._id}/scheduler`}
                                className="inline-block"
                                onClick={e => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  Court Scheduler
                                </Button>
                              </Link>
                            )
                          ) : (
                            (gameDay.status === 'in_progress') ? (
                              <Link
                                to={scoringUrl}
                                className="inline-block"
                                onClick={e => e.stopPropagation()}
                              >
                                <Button
                                  variant="primary"
                                  size="sm"
                                >
                                  Enter Scores
                                </Button>
                              </Link>
                            ) : (gameDay.status === 'completed' || gameDay.is_finalized) ? (
                              <Link
                                to={scoringUrl}
                                className="inline-block"
                                onClick={e => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  Match Score
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                              >
                                Scoring Not Available
                              </Button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default GameDayList 